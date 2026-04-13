
-- ==========================================
-- ENUMS
-- ==========================================
DO $$ BEGIN CREATE TYPE public.portal_role AS ENUM ('director','hr','accounts','employee','admin','ithead','tender_head','tender_executive','purchase','operations'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.leave_type AS ENUM ('paid','medical','exchange'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.leave_status AS ENUM ('pending','approved','rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.payment_status AS ENUM ('pending','approved','rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ==========================================
-- EXTENSIONS
-- ==========================================
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgmq;

-- ==========================================
-- FUNCTIONS
-- ==========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger LANGUAGE plpgsql SET search_path = 'public' AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.has_role(user_uuid uuid, check_role text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public' AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = user_uuid AND role = check_role); $$;

CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid) RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public' AS $$ SELECT role FROM public.user_roles WHERE user_id = user_uuid LIMIT 1; $$;

CREATE OR REPLACE FUNCTION public.get_employee_id(user_uuid uuid) RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public' AS $$ SELECT employee_id FROM public.user_roles WHERE user_id = user_uuid LIMIT 1; $$;

CREATE OR REPLACE FUNCTION public.verify_password(input_password text, stored_hash text) RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = 'public', 'extensions' AS $$ SELECT stored_hash = extensions.crypt(input_password, stored_hash); $$;

CREATE OR REPLACE FUNCTION public.hash_password(raw_password text) RETURNS text LANGUAGE sql SECURITY DEFINER SET search_path = 'public', 'extensions' AS $$ SELECT extensions.crypt(raw_password, extensions.gen_salt('bf')); $$;

CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name text, payload jsonb) RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN pgmq.send(queue_name, payload); EXCEPTION WHEN undefined_table THEN PERFORM pgmq.create(queue_name); RETURN pgmq.send(queue_name, payload); END; $$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer) RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb) LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r; EXCEPTION WHEN undefined_table THEN PERFORM pgmq.create(queue_name); RETURN; END; $$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name text, message_id bigint) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN pgmq.delete(queue_name, message_id); EXCEPTION WHEN undefined_table THEN RETURN FALSE; END; $$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb) RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE new_id BIGINT; BEGIN SELECT pgmq.send(dlq_name, payload) INTO new_id; PERFORM pgmq.delete(source_queue, message_id); RETURN new_id; EXCEPTION WHEN undefined_table THEN BEGIN PERFORM pgmq.create(dlq_name); EXCEPTION WHEN OTHERS THEN NULL; END; SELECT pgmq.send(dlq_name, payload) INTO new_id; BEGIN PERFORM pgmq.delete(source_queue, message_id); EXCEPTION WHEN undefined_table THEN NULL; END; RETURN new_id; END; $$;

-- ==========================================
-- TABLES (CREATE IF NOT EXISTS)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.user_roles (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, role text NOT NULL, employee_id uuid, created_at timestamptz DEFAULT now(), UNIQUE(user_id, role));
CREATE TABLE IF NOT EXISTS public.portal_users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), username text NOT NULL, password_hash text NOT NULL, role portal_role NOT NULL, employee_id uuid, is_active boolean DEFAULT true, last_login timestamptz, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.employees (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, photo text, address text NOT NULL, phone text NOT NULL, email text NOT NULL, aadhaar_number text NOT NULL, pan_number text NOT NULL, blood_group text NOT NULL, father_name text NOT NULL, father_mobile text, mother_name text NOT NULL, mother_mobile text, highest_education text NOT NULL, degree_name text NOT NULL, specialization text, school_college text NOT NULL, board_university text NOT NULL, year_of_passing text NOT NULL, passed_or_appearing text NOT NULL, marks_percentage text, certifications text, is_fresher boolean DEFAULT true, organization_name text, post_held text, job_period_from date, job_period_to date, reason_of_leaving text, previous_ctc text, total_experience text, date_of_joining date NOT NULL, designation text NOT NULL, additional_charge text, responsibilities text NOT NULL, username text NOT NULL, paid_leave_balance integer DEFAULT 12, medical_leave_balance integer DEFAULT 6, exchange_leave_balance integer DEFAULT 0, is_active boolean DEFAULT true, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.attendance (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), employee_id uuid NOT NULL, date date NOT NULL, location text NOT NULL, in_time text, out_time text, status text NOT NULL DEFAULT 'Approved', approved_by uuid, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.approval_requests (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), employee_id uuid NOT NULL, date date NOT NULL, location text NOT NULL, status text NOT NULL DEFAULT 'Pending', hr_notes text, attendance_id uuid, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.leave_requests (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), employee_id uuid NOT NULL, date date NOT NULL, reason text NOT NULL, leave_type leave_type NOT NULL, status leave_status DEFAULT 'pending', rejection_reason text, medical_certificate text, working_date date, working_reason text, is_add_leave boolean DEFAULT false, approved_by uuid, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.leave_reset_audit (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), employee_id uuid NOT NULL, reset_year integer NOT NULL, paid_leaves_reset integer NOT NULL, medical_leaves_reset integer NOT NULL, exchange_leaves_reset integer NOT NULL, reset_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.tasks (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, description text, assigned_to uuid, assigned_by text, priority text NOT NULL DEFAULT 'medium', status text NOT NULL DEFAULT 'pending', due_date date, completed_at timestamptz, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.director_tasks (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), task text NOT NULL, department text NOT NULL, date date NOT NULL DEFAULT CURRENT_DATE, status text NOT NULL DEFAULT 'Pending', expected_days integer NOT NULL DEFAULT 7, report text, completed_at timestamptz, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.daily_reports (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), employee_id uuid NOT NULL, date date NOT NULL, content text NOT NULL, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.contacts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, designation text NOT NULL, department text NOT NULL, phone text NOT NULL, email text, extension text, is_active boolean DEFAULT true, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.notices (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, content text NOT NULL, is_active boolean DEFAULT true, expires_at date, created_by uuid, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.products (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, category text NOT NULL, description text, price numeric, stock_quantity integer DEFAULT 0, unit text, is_active boolean DEFAULT true, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.admin_payments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), date date NOT NULL, paid_to text NOT NULL, amount numeric NOT NULL, purpose text NOT NULL, payment_mode text NOT NULL, remarks text, receipt_url text, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.employee_payments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), employee_id uuid NOT NULL, date date NOT NULL, amount numeric NOT NULL, category text NOT NULL, description text NOT NULL, receipt_url text, status payment_status DEFAULT 'pending', approved_by uuid, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.admin_assets (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, category text NOT NULL, quantity integer DEFAULT 1, location text, purchase_date date, purchase_price numeric, vendor text, warranty_till date, assigned_to uuid, remarks text, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.inward_outward (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), register_type text NOT NULL, date date NOT NULL, sender_receiver text NOT NULL, subject text NOT NULL, document_type text NOT NULL, reference_number text, remarks text, attachment_url text, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.it_assets (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), registration_number text NOT NULL, asset_type text NOT NULL, brand text NOT NULL, model text NOT NULL, serial_number text NOT NULL, purchase_date date NOT NULL, warranty_till date NOT NULL, assigned_to uuid, processor text, ram_size text, ram_serial text, storage_size text, storage_type text, storage_serial text, motherboard_model text, motherboard_serial text, display_model text, display_serial text, mac_address text, invoice_url text, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.it_passwords (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), portal text NOT NULL, username text NOT NULL, encrypted_password text NOT NULL, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.it_network_images (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, url text NOT NULL, image_type text NOT NULL, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.operations_brochures (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_name text NOT NULL, description text, file_url text, created_by uuid, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.operations_events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, description text, event_date date, event_time time, created_by uuid, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.operations_gr (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), department_name text NOT NULL, title text NOT NULL, unique_code text NOT NULL, gr_date date NOT NULL, file_url text, created_by uuid, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.operations_inwards (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), document_type text NOT NULL, product_name text NOT NULL, subject text NOT NULL, organization_name text NOT NULL, e_office_number text, date date, file_url text, created_by uuid, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.operations_media (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), media_type text NOT NULL, product_name text, description text, file_url text, created_by uuid, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.operations_notes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), content text NOT NULL, created_by uuid, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.operations_presentations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, description text, file_url text, created_by uuid, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.operations_proposals (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), unique_id text NOT NULL, subject text NOT NULL, to_sender text NOT NULL, organization_name text NOT NULL, product_name text NOT NULL, status text NOT NULL DEFAULT 'Pending', reason text, file_url text, created_by uuid, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.operations_reminders (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, date_time timestamptz NOT NULL, notified boolean DEFAULT false, created_by uuid, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.operations_settings (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, first_name text, last_name text, mobile text, designation text, profile_photo_url text, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.purchase_contacts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, phone text NOT NULL, email text, designation text, department text, organization text, created_by uuid, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.purchase_dispatches (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), work_order_no text NOT NULL, organization_name text NOT NULL, transporter_name text NOT NULL, dispatched_date date NOT NULL, expected_date date, delivered_date date, vehicle_no text, eway_bill_no text, eway_bill_url text, status text DEFAULT 'Pending', created_by uuid, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.purchase_documents (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, type text NOT NULL, custom_type text, file_url text, created_by uuid, uploaded_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.purchase_events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, description text, event_date date, created_by uuid, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.purchase_installations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_name text NOT NULL, work_order_no text NOT NULL, hardware_install boolean DEFAULT false, software_install boolean DEFAULT false, product_inspection boolean DEFAULT false, training_done boolean DEFAULT false, amc boolean DEFAULT false, amc_start date, amc_end date, warranty_till date, progress integer DEFAULT 0, created_by uuid, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.purchase_products (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, manufacturer text NOT NULL, model text NOT NULL, price numeric, image_url text, tech_specs_url text, created_by uuid, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.purchase_project_images (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_name text NOT NULL, organization_name text NOT NULL, work_order text, file_url text, created_by uuid, uploaded_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.purchase_projects (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, organization_name text NOT NULL, product_name text NOT NULL, vendor_discussion boolean DEFAULT false, quotes_final boolean DEFAULT false, proforma_invoice boolean DEFAULT false, purchase_order boolean DEFAULT false, supply_done boolean DEFAULT false, dc_report_done boolean DEFAULT false, installation_done boolean DEFAULT false, training_done boolean DEFAULT false, progress integer DEFAULT 0, created_by uuid, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.purchase_quotes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), quote_id text NOT NULL, type text NOT NULL, subject text NOT NULL, description text, status text DEFAULT 'Pending', file_url text, created_by uuid, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.purchase_settings (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, first_name text, last_name text, mobile text, designation text, profile_photo_url text, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.purchase_support_tickets (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), org_name text NOT NULL, issue text NOT NULL, description text NOT NULL, status text DEFAULT 'Open', priority text DEFAULT 'Medium', report text, modified boolean DEFAULT false, created_by uuid, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.purchase_tasks (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, description text NOT NULL, status text DEFAULT 'Pending', report text, created_by uuid, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.purchase_vendors (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, contact_details text, created_by uuid, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.purchase_work_completions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, organization_name text NOT NULL, project_name text NOT NULL, work_order_no text NOT NULL, file_url text, created_by uuid, uploaded_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.email_send_log (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), template_name text NOT NULL, recipient_email text NOT NULL, status text NOT NULL, metadata jsonb, error_message text, message_id text, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.email_send_state (id integer PRIMARY KEY DEFAULT 1, batch_size integer NOT NULL DEFAULT 10, send_delay_ms integer NOT NULL DEFAULT 200, auth_email_ttl_minutes integer NOT NULL DEFAULT 15, transactional_email_ttl_minutes integer NOT NULL DEFAULT 60, retry_after_until timestamptz, updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.email_unsubscribe_tokens (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text NOT NULL, token text NOT NULL, used_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());

-- ==========================================
-- ENABLE RLS ON ALL TABLES
-- ==========================================
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_reset_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.director_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inward_outward ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.it_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.it_passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.it_network_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operations_brochures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operations_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operations_gr ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operations_inwards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operations_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operations_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operations_presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operations_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operations_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operations_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_project_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_work_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_send_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_unsubscribe_tokens ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- DROP AND RECREATE ALL RLS POLICIES
-- ==========================================

-- user_roles
DROP POLICY IF EXISTS "user_roles_select" ON public.user_roles;
CREATE POLICY "user_roles_select" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- portal_users
DROP POLICY IF EXISTS "portal_users_no_direct_access" ON public.portal_users;
DROP POLICY IF EXISTS "portal_users_no_insert" ON public.portal_users;
DROP POLICY IF EXISTS "portal_users_no_update" ON public.portal_users;
DROP POLICY IF EXISTS "portal_users_no_delete" ON public.portal_users;
CREATE POLICY "portal_users_no_direct_access" ON public.portal_users FOR SELECT TO authenticated USING (false);
CREATE POLICY "portal_users_no_insert" ON public.portal_users FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "portal_users_no_update" ON public.portal_users FOR UPDATE TO authenticated USING (false);
CREATE POLICY "portal_users_no_delete" ON public.portal_users FOR DELETE TO authenticated USING (false);

-- employees
DROP POLICY IF EXISTS "employees_select" ON public.employees;
DROP POLICY IF EXISTS "employees_insert" ON public.employees;
DROP POLICY IF EXISTS "employees_update" ON public.employees;
DROP POLICY IF EXISTS "employees_delete" ON public.employees;
CREATE POLICY "employees_select" ON public.employees FOR SELECT TO authenticated USING (has_role(auth.uid(),'director') OR has_role(auth.uid(),'hr') OR has_role(auth.uid(),'admin') OR id = get_employee_id(auth.uid()));
CREATE POLICY "employees_insert" ON public.employees FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'hr') OR has_role(auth.uid(),'admin'));
CREATE POLICY "employees_update" ON public.employees FOR UPDATE TO authenticated USING (has_role(auth.uid(),'hr') OR has_role(auth.uid(),'admin'));
CREATE POLICY "employees_delete" ON public.employees FOR DELETE TO authenticated USING (has_role(auth.uid(),'hr') OR has_role(auth.uid(),'admin'));

-- attendance
DROP POLICY IF EXISTS "attendance_select" ON public.attendance;
DROP POLICY IF EXISTS "attendance_insert" ON public.attendance;
DROP POLICY IF EXISTS "attendance_update" ON public.attendance;
DROP POLICY IF EXISTS "attendance_delete" ON public.attendance;
CREATE POLICY "attendance_select" ON public.attendance FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'hr') OR has_role(auth.uid(),'director'));
CREATE POLICY "attendance_insert" ON public.attendance FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "attendance_update" ON public.attendance FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'hr'));
CREATE POLICY "attendance_delete" ON public.attendance FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));

-- approval_requests
DROP POLICY IF EXISTS "approval_requests_select" ON public.approval_requests;
DROP POLICY IF EXISTS "approval_requests_insert" ON public.approval_requests;
DROP POLICY IF EXISTS "approval_requests_update" ON public.approval_requests;
DROP POLICY IF EXISTS "approval_requests_delete" ON public.approval_requests;
CREATE POLICY "approval_requests_select" ON public.approval_requests FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'hr') OR has_role(auth.uid(),'director'));
CREATE POLICY "approval_requests_insert" ON public.approval_requests FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "approval_requests_update" ON public.approval_requests FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'hr'));
CREATE POLICY "approval_requests_delete" ON public.approval_requests FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));

-- leave_requests
DROP POLICY IF EXISTS "leave_requests_select" ON public.leave_requests;
DROP POLICY IF EXISTS "leave_requests_insert" ON public.leave_requests;
DROP POLICY IF EXISTS "leave_requests_update" ON public.leave_requests;
DROP POLICY IF EXISTS "leave_requests_delete" ON public.leave_requests;
CREATE POLICY "leave_requests_select" ON public.leave_requests FOR SELECT TO authenticated USING (has_role(auth.uid(),'director') OR has_role(auth.uid(),'hr') OR employee_id = get_employee_id(auth.uid()));
CREATE POLICY "leave_requests_insert" ON public.leave_requests FOR INSERT TO authenticated WITH CHECK (employee_id = get_employee_id(auth.uid()) OR has_role(auth.uid(),'hr'));
CREATE POLICY "leave_requests_update" ON public.leave_requests FOR UPDATE TO authenticated USING (has_role(auth.uid(),'director') OR has_role(auth.uid(),'hr') OR employee_id = get_employee_id(auth.uid()));
CREATE POLICY "leave_requests_delete" ON public.leave_requests FOR DELETE TO authenticated USING (has_role(auth.uid(),'hr'));

-- leave_reset_audit
DROP POLICY IF EXISTS "leave_reset_audit_select" ON public.leave_reset_audit;
CREATE POLICY "leave_reset_audit_select" ON public.leave_reset_audit FOR SELECT TO authenticated USING (has_role(auth.uid(),'director') OR has_role(auth.uid(),'hr') OR has_role(auth.uid(),'admin'));

-- tasks
DROP POLICY IF EXISTS "tasks_select" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete" ON public.tasks;
CREATE POLICY "tasks_select" ON public.tasks FOR SELECT TO authenticated USING (has_role(auth.uid(),'director') OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'hr') OR assigned_to = get_employee_id(auth.uid()));
CREATE POLICY "tasks_insert" ON public.tasks FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'director') OR has_role(auth.uid(),'admin'));
CREATE POLICY "tasks_update" ON public.tasks FOR UPDATE TO authenticated USING (has_role(auth.uid(),'director') OR has_role(auth.uid(),'admin') OR assigned_to = get_employee_id(auth.uid()));
CREATE POLICY "tasks_delete" ON public.tasks FOR DELETE TO authenticated USING (has_role(auth.uid(),'director') OR has_role(auth.uid(),'admin'));

-- director_tasks
DROP POLICY IF EXISTS "director_tasks_select" ON public.director_tasks;
DROP POLICY IF EXISTS "director_tasks_insert" ON public.director_tasks;
DROP POLICY IF EXISTS "director_tasks_update" ON public.director_tasks;
DROP POLICY IF EXISTS "director_tasks_delete" ON public.director_tasks;
CREATE POLICY "director_tasks_select" ON public.director_tasks FOR SELECT TO authenticated USING (has_role(auth.uid(),'director') OR (has_role(auth.uid(),'admin') AND department='Admin') OR (has_role(auth.uid(),'hr') AND department='HR') OR ((has_role(auth.uid(),'tender_head') OR has_role(auth.uid(),'tender_executive')) AND department='Tender') OR (has_role(auth.uid(),'operations') AND department='Operations') OR (has_role(auth.uid(),'purchase') AND department='Purchase') OR (has_role(auth.uid(),'ithead') AND department='IT') OR (has_role(auth.uid(),'accounts') AND department='Accounts'));
CREATE POLICY "director_tasks_insert" ON public.director_tasks FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'director'));
CREATE POLICY "director_tasks_update" ON public.director_tasks FOR UPDATE TO authenticated USING (has_role(auth.uid(),'director') OR (has_role(auth.uid(),'admin') AND department='Admin') OR (has_role(auth.uid(),'hr') AND department='HR') OR ((has_role(auth.uid(),'tender_head') OR has_role(auth.uid(),'tender_executive')) AND department='Tender') OR (has_role(auth.uid(),'operations') AND department='Operations') OR (has_role(auth.uid(),'purchase') AND department='Purchase') OR (has_role(auth.uid(),'ithead') AND department='IT') OR (has_role(auth.uid(),'accounts') AND department='Accounts'));
CREATE POLICY "director_tasks_delete" ON public.director_tasks FOR DELETE TO authenticated USING (has_role(auth.uid(),'director'));

-- daily_reports
DROP POLICY IF EXISTS "daily_reports_select" ON public.daily_reports;
DROP POLICY IF EXISTS "daily_reports_insert" ON public.daily_reports;
DROP POLICY IF EXISTS "daily_reports_update" ON public.daily_reports;
DROP POLICY IF EXISTS "daily_reports_delete" ON public.daily_reports;
CREATE POLICY "daily_reports_select" ON public.daily_reports FOR SELECT TO authenticated USING (has_role(auth.uid(),'director') OR has_role(auth.uid(),'hr') OR employee_id = get_employee_id(auth.uid()));
CREATE POLICY "daily_reports_insert" ON public.daily_reports FOR INSERT TO authenticated WITH CHECK (employee_id = get_employee_id(auth.uid()));
CREATE POLICY "daily_reports_update" ON public.daily_reports FOR UPDATE TO authenticated USING (employee_id = get_employee_id(auth.uid()));
CREATE POLICY "daily_reports_delete" ON public.daily_reports FOR DELETE TO authenticated USING (has_role(auth.uid(),'director') OR employee_id = get_employee_id(auth.uid()));

-- contacts
DROP POLICY IF EXISTS "contacts_select" ON public.contacts;
DROP POLICY IF EXISTS "contacts_insert" ON public.contacts;
DROP POLICY IF EXISTS "contacts_update" ON public.contacts;
DROP POLICY IF EXISTS "contacts_delete" ON public.contacts;
CREATE POLICY "contacts_select" ON public.contacts FOR SELECT TO authenticated USING (has_role(auth.uid(),'director') OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'hr') OR has_role(auth.uid(),'purchase') OR has_role(auth.uid(),'operations') OR has_role(auth.uid(),'tender_head') OR has_role(auth.uid(),'tender_executive') OR has_role(auth.uid(),'ithead') OR has_role(auth.uid(),'accounts') OR get_employee_id(auth.uid()) IS NOT NULL);
CREATE POLICY "contacts_insert" ON public.contacts FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'director') OR has_role(auth.uid(),'admin'));
CREATE POLICY "contacts_update" ON public.contacts FOR UPDATE TO authenticated USING (has_role(auth.uid(),'director') OR has_role(auth.uid(),'admin'));
CREATE POLICY "contacts_delete" ON public.contacts FOR DELETE TO authenticated USING (has_role(auth.uid(),'director') OR has_role(auth.uid(),'admin'));

-- notices
DROP POLICY IF EXISTS "notices_select" ON public.notices;
DROP POLICY IF EXISTS "notices_insert" ON public.notices;
DROP POLICY IF EXISTS "notices_update" ON public.notices;
DROP POLICY IF EXISTS "notices_delete" ON public.notices;
CREATE POLICY "notices_select" ON public.notices FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "notices_insert" ON public.notices FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'director') OR has_role(auth.uid(),'admin'));
CREATE POLICY "notices_update" ON public.notices FOR UPDATE TO authenticated USING (has_role(auth.uid(),'director') OR has_role(auth.uid(),'admin'));
CREATE POLICY "notices_delete" ON public.notices FOR DELETE TO authenticated USING (has_role(auth.uid(),'director') OR has_role(auth.uid(),'admin'));

-- products
DROP POLICY IF EXISTS "products_select" ON public.products;
DROP POLICY IF EXISTS "products_insert" ON public.products;
DROP POLICY IF EXISTS "products_update" ON public.products;
DROP POLICY IF EXISTS "products_delete" ON public.products;
CREATE POLICY "products_select" ON public.products FOR SELECT TO authenticated USING (has_role(auth.uid(),'director') OR has_role(auth.uid(),'admin'));
CREATE POLICY "products_insert" ON public.products FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'director'));
CREATE POLICY "products_update" ON public.products FOR UPDATE TO authenticated USING (has_role(auth.uid(),'director'));
CREATE POLICY "products_delete" ON public.products FOR DELETE TO authenticated USING (has_role(auth.uid(),'director'));

-- admin_payments
DROP POLICY IF EXISTS "admin_payments_select" ON public.admin_payments;
DROP POLICY IF EXISTS "admin_payments_insert" ON public.admin_payments;
DROP POLICY IF EXISTS "admin_payments_update" ON public.admin_payments;
DROP POLICY IF EXISTS "admin_payments_delete" ON public.admin_payments;
CREATE POLICY "admin_payments_select" ON public.admin_payments FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'director') OR has_role(auth.uid(),'accounts'));
CREATE POLICY "admin_payments_insert" ON public.admin_payments FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'accounts'));
CREATE POLICY "admin_payments_update" ON public.admin_payments FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'accounts'));
CREATE POLICY "admin_payments_delete" ON public.admin_payments FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));

-- employee_payments
DROP POLICY IF EXISTS "employee_payments_select" ON public.employee_payments;
DROP POLICY IF EXISTS "employee_payments_insert" ON public.employee_payments;
DROP POLICY IF EXISTS "employee_payments_update" ON public.employee_payments;
DROP POLICY IF EXISTS "employee_payments_delete" ON public.employee_payments;
CREATE POLICY "employee_payments_select" ON public.employee_payments FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'accounts') OR has_role(auth.uid(),'director') OR employee_id = get_employee_id(auth.uid()));
CREATE POLICY "employee_payments_insert" ON public.employee_payments FOR INSERT TO authenticated WITH CHECK (employee_id = get_employee_id(auth.uid()) OR has_role(auth.uid(),'accounts'));
CREATE POLICY "employee_payments_update" ON public.employee_payments FOR UPDATE TO authenticated USING (has_role(auth.uid(),'accounts') OR has_role(auth.uid(),'admin'));
CREATE POLICY "employee_payments_delete" ON public.employee_payments FOR DELETE TO authenticated USING (has_role(auth.uid(),'accounts') OR has_role(auth.uid(),'admin'));

-- admin_assets
DROP POLICY IF EXISTS "admin_assets_select" ON public.admin_assets;
DROP POLICY IF EXISTS "admin_assets_insert" ON public.admin_assets;
DROP POLICY IF EXISTS "admin_assets_update" ON public.admin_assets;
DROP POLICY IF EXISTS "admin_assets_delete" ON public.admin_assets;
CREATE POLICY "admin_assets_select" ON public.admin_assets FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'director'));
CREATE POLICY "admin_assets_insert" ON public.admin_assets FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "admin_assets_update" ON public.admin_assets FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE POLICY "admin_assets_delete" ON public.admin_assets FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));

-- inward_outward
DROP POLICY IF EXISTS "inward_outward_select" ON public.inward_outward;
DROP POLICY IF EXISTS "inward_outward_insert" ON public.inward_outward;
DROP POLICY IF EXISTS "inward_outward_update" ON public.inward_outward;
DROP POLICY IF EXISTS "inward_outward_delete" ON public.inward_outward;
CREATE POLICY "inward_outward_select" ON public.inward_outward FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'director'));
CREATE POLICY "inward_outward_insert" ON public.inward_outward FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "inward_outward_update" ON public.inward_outward FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE POLICY "inward_outward_delete" ON public.inward_outward FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));

-- it_assets
DROP POLICY IF EXISTS "it_assets_select" ON public.it_assets;
DROP POLICY IF EXISTS "it_assets_insert" ON public.it_assets;
DROP POLICY IF EXISTS "it_assets_update" ON public.it_assets;
DROP POLICY IF EXISTS "it_assets_delete" ON public.it_assets;
CREATE POLICY "it_assets_select" ON public.it_assets FOR SELECT TO authenticated USING (has_role(auth.uid(),'ithead') OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'director'));
CREATE POLICY "it_assets_insert" ON public.it_assets FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'ithead') OR has_role(auth.uid(),'admin'));
CREATE POLICY "it_assets_update" ON public.it_assets FOR UPDATE TO authenticated USING (has_role(auth.uid(),'ithead') OR has_role(auth.uid(),'admin'));
CREATE POLICY "it_assets_delete" ON public.it_assets FOR DELETE TO authenticated USING (has_role(auth.uid(),'ithead') OR has_role(auth.uid(),'admin'));

-- it_passwords
DROP POLICY IF EXISTS "it_passwords_select" ON public.it_passwords;
DROP POLICY IF EXISTS "it_passwords_insert" ON public.it_passwords;
DROP POLICY IF EXISTS "it_passwords_update" ON public.it_passwords;
DROP POLICY IF EXISTS "it_passwords_delete" ON public.it_passwords;
CREATE POLICY "it_passwords_select" ON public.it_passwords FOR SELECT TO authenticated USING (has_role(auth.uid(),'ithead'));
CREATE POLICY "it_passwords_insert" ON public.it_passwords FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'ithead'));
CREATE POLICY "it_passwords_update" ON public.it_passwords FOR UPDATE TO authenticated USING (has_role(auth.uid(),'ithead'));
CREATE POLICY "it_passwords_delete" ON public.it_passwords FOR DELETE TO authenticated USING (has_role(auth.uid(),'ithead'));

-- it_network_images
DROP POLICY IF EXISTS "it_network_images_select" ON public.it_network_images;
DROP POLICY IF EXISTS "it_network_images_insert" ON public.it_network_images;
DROP POLICY IF EXISTS "it_network_images_update" ON public.it_network_images;
DROP POLICY IF EXISTS "it_network_images_delete" ON public.it_network_images;
CREATE POLICY "it_network_images_select" ON public.it_network_images FOR SELECT TO authenticated USING (has_role(auth.uid(),'ithead') OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'director'));
CREATE POLICY "it_network_images_insert" ON public.it_network_images FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'ithead'));
CREATE POLICY "it_network_images_update" ON public.it_network_images FOR UPDATE TO authenticated USING (has_role(auth.uid(),'ithead'));
CREATE POLICY "it_network_images_delete" ON public.it_network_images FOR DELETE TO authenticated USING (has_role(auth.uid(),'ithead'));

-- operations tables
DROP POLICY IF EXISTS "ops_brochures_all" ON public.operations_brochures;
CREATE POLICY "ops_brochures_all" ON public.operations_brochures FOR ALL TO authenticated USING (has_role(auth.uid(),'operations')) WITH CHECK (has_role(auth.uid(),'operations'));

DROP POLICY IF EXISTS "ops_events_all" ON public.operations_events;
CREATE POLICY "ops_events_all" ON public.operations_events FOR ALL TO authenticated USING (has_role(auth.uid(),'operations')) WITH CHECK (has_role(auth.uid(),'operations'));

DROP POLICY IF EXISTS "ops_gr_all" ON public.operations_gr;
CREATE POLICY "ops_gr_all" ON public.operations_gr FOR ALL TO authenticated USING (has_role(auth.uid(),'operations')) WITH CHECK (has_role(auth.uid(),'operations'));

DROP POLICY IF EXISTS "ops_inwards_select" ON public.operations_inwards;
DROP POLICY IF EXISTS "ops_inwards_insert" ON public.operations_inwards;
DROP POLICY IF EXISTS "ops_inwards_update" ON public.operations_inwards;
DROP POLICY IF EXISTS "ops_inwards_delete" ON public.operations_inwards;
CREATE POLICY "ops_inwards_select" ON public.operations_inwards FOR SELECT TO authenticated USING (has_role(auth.uid(),'operations') OR has_role(auth.uid(),'director'));
CREATE POLICY "ops_inwards_insert" ON public.operations_inwards FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'operations'));
CREATE POLICY "ops_inwards_update" ON public.operations_inwards FOR UPDATE TO authenticated USING (has_role(auth.uid(),'operations'));
CREATE POLICY "ops_inwards_delete" ON public.operations_inwards FOR DELETE TO authenticated USING (has_role(auth.uid(),'operations'));

DROP POLICY IF EXISTS "ops_media_all" ON public.operations_media;
CREATE POLICY "ops_media_all" ON public.operations_media FOR ALL TO authenticated USING (has_role(auth.uid(),'operations')) WITH CHECK (has_role(auth.uid(),'operations'));

DROP POLICY IF EXISTS "ops_notes_all" ON public.operations_notes;
CREATE POLICY "ops_notes_all" ON public.operations_notes FOR ALL TO authenticated USING (has_role(auth.uid(),'operations')) WITH CHECK (has_role(auth.uid(),'operations'));

DROP POLICY IF EXISTS "ops_presentations_all" ON public.operations_presentations;
CREATE POLICY "ops_presentations_all" ON public.operations_presentations FOR ALL TO authenticated USING (has_role(auth.uid(),'operations')) WITH CHECK (has_role(auth.uid(),'operations'));

DROP POLICY IF EXISTS "ops_proposals_select" ON public.operations_proposals;
DROP POLICY IF EXISTS "ops_proposals_insert" ON public.operations_proposals;
DROP POLICY IF EXISTS "ops_proposals_update" ON public.operations_proposals;
DROP POLICY IF EXISTS "ops_proposals_delete" ON public.operations_proposals;
CREATE POLICY "ops_proposals_select" ON public.operations_proposals FOR SELECT TO authenticated USING (has_role(auth.uid(),'operations') OR has_role(auth.uid(),'director'));
CREATE POLICY "ops_proposals_insert" ON public.operations_proposals FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'operations'));
CREATE POLICY "ops_proposals_update" ON public.operations_proposals FOR UPDATE TO authenticated USING (has_role(auth.uid(),'operations') OR has_role(auth.uid(),'director'));
CREATE POLICY "ops_proposals_delete" ON public.operations_proposals FOR DELETE TO authenticated USING (has_role(auth.uid(),'operations'));

DROP POLICY IF EXISTS "ops_reminders_all" ON public.operations_reminders;
CREATE POLICY "ops_reminders_all" ON public.operations_reminders FOR ALL TO authenticated USING (has_role(auth.uid(),'operations')) WITH CHECK (has_role(auth.uid(),'operations'));

DROP POLICY IF EXISTS "ops_settings_all" ON public.operations_settings;
CREATE POLICY "ops_settings_all" ON public.operations_settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- purchase tables
DROP POLICY IF EXISTS "purchase_contacts_all" ON public.purchase_contacts;
CREATE POLICY "purchase_contacts_all" ON public.purchase_contacts FOR ALL TO authenticated USING (has_role(auth.uid(),'purchase')) WITH CHECK (has_role(auth.uid(),'purchase'));

DROP POLICY IF EXISTS "purchase_dispatches_all" ON public.purchase_dispatches;
CREATE POLICY "purchase_dispatches_all" ON public.purchase_dispatches FOR ALL TO authenticated USING (has_role(auth.uid(),'purchase')) WITH CHECK (has_role(auth.uid(),'purchase'));

DROP POLICY IF EXISTS "purchase_documents_all" ON public.purchase_documents;
CREATE POLICY "purchase_documents_all" ON public.purchase_documents FOR ALL TO authenticated USING (has_role(auth.uid(),'purchase')) WITH CHECK (has_role(auth.uid(),'purchase'));

DROP POLICY IF EXISTS "purchase_events_all" ON public.purchase_events;
CREATE POLICY "purchase_events_all" ON public.purchase_events FOR ALL TO authenticated USING (has_role(auth.uid(),'purchase')) WITH CHECK (has_role(auth.uid(),'purchase'));

DROP POLICY IF EXISTS "purchase_installations_all" ON public.purchase_installations;
CREATE POLICY "purchase_installations_all" ON public.purchase_installations FOR ALL TO authenticated USING (has_role(auth.uid(),'purchase')) WITH CHECK (has_role(auth.uid(),'purchase'));

DROP POLICY IF EXISTS "purchase_products_all" ON public.purchase_products;
CREATE POLICY "purchase_products_all" ON public.purchase_products FOR ALL TO authenticated USING (has_role(auth.uid(),'purchase')) WITH CHECK (has_role(auth.uid(),'purchase'));

DROP POLICY IF EXISTS "purchase_project_images_all" ON public.purchase_project_images;
CREATE POLICY "purchase_project_images_all" ON public.purchase_project_images FOR ALL TO authenticated USING (has_role(auth.uid(),'purchase')) WITH CHECK (has_role(auth.uid(),'purchase'));

DROP POLICY IF EXISTS "purchase_projects_all" ON public.purchase_projects;
CREATE POLICY "purchase_projects_all" ON public.purchase_projects FOR ALL TO authenticated USING (has_role(auth.uid(),'purchase')) WITH CHECK (has_role(auth.uid(),'purchase'));

DROP POLICY IF EXISTS "purchase_quotes_all" ON public.purchase_quotes;
CREATE POLICY "purchase_quotes_all" ON public.purchase_quotes FOR ALL TO authenticated USING (has_role(auth.uid(),'purchase')) WITH CHECK (has_role(auth.uid(),'purchase'));

DROP POLICY IF EXISTS "purchase_settings_all" ON public.purchase_settings;
CREATE POLICY "purchase_settings_all" ON public.purchase_settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "purchase_support_tickets_all" ON public.purchase_support_tickets;
CREATE POLICY "purchase_support_tickets_all" ON public.purchase_support_tickets FOR ALL TO authenticated USING (has_role(auth.uid(),'purchase')) WITH CHECK (has_role(auth.uid(),'purchase'));

DROP POLICY IF EXISTS "purchase_tasks_all" ON public.purchase_tasks;
CREATE POLICY "purchase_tasks_all" ON public.purchase_tasks FOR ALL TO authenticated USING (has_role(auth.uid(),'purchase')) WITH CHECK (has_role(auth.uid(),'purchase'));

DROP POLICY IF EXISTS "purchase_vendors_all" ON public.purchase_vendors;
CREATE POLICY "purchase_vendors_all" ON public.purchase_vendors FOR ALL TO authenticated USING (has_role(auth.uid(),'purchase')) WITH CHECK (has_role(auth.uid(),'purchase'));

DROP POLICY IF EXISTS "purchase_work_completions_all" ON public.purchase_work_completions;
CREATE POLICY "purchase_work_completions_all" ON public.purchase_work_completions FOR ALL TO authenticated USING (has_role(auth.uid(),'purchase')) WITH CHECK (has_role(auth.uid(),'purchase'));

-- email tables
DROP POLICY IF EXISTS "Service role can insert send log" ON public.email_send_log;
DROP POLICY IF EXISTS "Service role can read send log" ON public.email_send_log;
DROP POLICY IF EXISTS "Service role can update send log" ON public.email_send_log;
CREATE POLICY "Service role can insert send log" ON public.email_send_log FOR INSERT TO public WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role can read send log" ON public.email_send_log FOR SELECT TO public USING (auth.role() = 'service_role');
CREATE POLICY "Service role can update send log" ON public.email_send_log FOR UPDATE TO public USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can manage send state" ON public.email_send_state;
CREATE POLICY "Service role can manage send state" ON public.email_send_state FOR ALL TO public USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can insert tokens" ON public.email_unsubscribe_tokens;
DROP POLICY IF EXISTS "Service role can read tokens" ON public.email_unsubscribe_tokens;
DROP POLICY IF EXISTS "Service role can mark tokens as used" ON public.email_unsubscribe_tokens;
CREATE POLICY "Service role can insert tokens" ON public.email_unsubscribe_tokens FOR INSERT TO public WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role can read tokens" ON public.email_unsubscribe_tokens FOR SELECT TO public USING (auth.role() = 'service_role');
CREATE POLICY "Service role can mark tokens as used" ON public.email_unsubscribe_tokens FOR UPDATE TO public USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- ==========================================
-- STORAGE BUCKETS
-- ==========================================
INSERT INTO storage.buckets (id, name, public) VALUES ('tender-files', 'tender-files', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('purchase-files', 'purchase-files', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('operations-files', 'operations-files', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('tender-payments', 'tender-payments', false) ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "tender_files_select" ON storage.objects;
DROP POLICY IF EXISTS "tender_files_insert" ON storage.objects;
DROP POLICY IF EXISTS "tender_files_update" ON storage.objects;
DROP POLICY IF EXISTS "tender_files_delete" ON storage.objects;
CREATE POLICY "tender_files_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'tender-files' AND (has_role(auth.uid(),'tender_head') OR has_role(auth.uid(),'tender_executive') OR has_role(auth.uid(),'director')));
CREATE POLICY "tender_files_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'tender-files' AND (has_role(auth.uid(),'tender_head') OR has_role(auth.uid(),'tender_executive')));
CREATE POLICY "tender_files_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'tender-files' AND (has_role(auth.uid(),'tender_head') OR has_role(auth.uid(),'tender_executive')));
CREATE POLICY "tender_files_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'tender-files' AND (has_role(auth.uid(),'tender_head') OR has_role(auth.uid(),'tender_executive')));

DROP POLICY IF EXISTS "purchase_files_select" ON storage.objects;
DROP POLICY IF EXISTS "purchase_files_insert" ON storage.objects;
DROP POLICY IF EXISTS "purchase_files_update" ON storage.objects;
DROP POLICY IF EXISTS "purchase_files_delete" ON storage.objects;
CREATE POLICY "purchase_files_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'purchase-files' AND (has_role(auth.uid(),'purchase') OR has_role(auth.uid(),'director')));
CREATE POLICY "purchase_files_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'purchase-files' AND has_role(auth.uid(),'purchase'));
CREATE POLICY "purchase_files_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'purchase-files' AND has_role(auth.uid(),'purchase'));
CREATE POLICY "purchase_files_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'purchase-files' AND has_role(auth.uid(),'purchase'));

DROP POLICY IF EXISTS "operations_files_select" ON storage.objects;
DROP POLICY IF EXISTS "operations_files_insert" ON storage.objects;
DROP POLICY IF EXISTS "operations_files_update" ON storage.objects;
DROP POLICY IF EXISTS "operations_files_delete" ON storage.objects;
CREATE POLICY "operations_files_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'operations-files' AND (has_role(auth.uid(),'operations') OR has_role(auth.uid(),'director')));
CREATE POLICY "operations_files_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'operations-files' AND has_role(auth.uid(),'operations'));
CREATE POLICY "operations_files_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'operations-files' AND has_role(auth.uid(),'operations'));
CREATE POLICY "operations_files_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'operations-files' AND has_role(auth.uid(),'operations'));

DROP POLICY IF EXISTS "tender_payments_select" ON storage.objects;
DROP POLICY IF EXISTS "tender_payments_insert" ON storage.objects;
DROP POLICY IF EXISTS "tender_payments_update" ON storage.objects;
DROP POLICY IF EXISTS "tender_payments_delete" ON storage.objects;
CREATE POLICY "tender_payments_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'tender-payments' AND (has_role(auth.uid(),'tender_head') OR has_role(auth.uid(),'tender_executive') OR has_role(auth.uid(),'accounts') OR has_role(auth.uid(),'director')));
CREATE POLICY "tender_payments_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'tender-payments' AND (has_role(auth.uid(),'tender_head') OR has_role(auth.uid(),'tender_executive') OR has_role(auth.uid(),'accounts')));
CREATE POLICY "tender_payments_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'tender-payments' AND (has_role(auth.uid(),'tender_head') OR has_role(auth.uid(),'tender_executive') OR has_role(auth.uid(),'accounts')));
CREATE POLICY "tender_payments_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'tender-payments' AND (has_role(auth.uid(),'tender_head') OR has_role(auth.uid(),'tender_executive')));

-- ==========================================
-- REALTIME
-- ==========================================
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.employees; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.approval_requests; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.leave_requests; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.director_tasks; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_reports; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.notices; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.products; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_payments; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.employee_payments; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_assets; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.inward_outward; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.it_assets; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.it_passwords; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.it_network_images; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.operations_proposals; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.operations_inwards; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_dispatches; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_support_tickets; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_tasks; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Default email state
INSERT INTO public.email_send_state (id, batch_size, send_delay_ms, auth_email_ttl_minutes, transactional_email_ttl_minutes) VALUES (1, 10, 200, 15, 60) ON CONFLICT (id) DO NOTHING;
