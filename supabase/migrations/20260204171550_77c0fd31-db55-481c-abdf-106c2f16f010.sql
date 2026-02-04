-- Create enum for portal roles
CREATE TYPE public.portal_role AS ENUM ('director', 'hr', 'accounts', 'admin', 'ithead', 'employee');

-- Create enum for leave types
CREATE TYPE public.leave_type AS ENUM ('paid', 'medical', 'exchange');

-- Create enum for leave status
CREATE TYPE public.leave_status AS ENUM ('pending', 'approved', 'rejected');

-- Create enum for task priority
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high');

-- Create enum for task status
CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'completed');

-- Create enum for payment status
CREATE TYPE public.payment_status AS ENUM ('pending', 'approved', 'rejected');

-- ==========================================
-- PORTAL USERS TABLE (Authentication)
-- ==========================================
CREATE TABLE public.portal_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role portal_role NOT NULL,
  employee_id UUID,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ==========================================
-- EMPLOYEES TABLE (HR Managed)
-- ==========================================
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Basic Information
  name TEXT NOT NULL,
  photo TEXT,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  aadhaar_number TEXT NOT NULL,
  pan_number TEXT NOT NULL,
  blood_group TEXT NOT NULL,
  father_name TEXT NOT NULL,
  father_mobile TEXT,
  mother_name TEXT NOT NULL,
  mother_mobile TEXT,
  -- Educational Information
  highest_education TEXT NOT NULL,
  degree_name TEXT NOT NULL,
  specialization TEXT,
  school_college TEXT NOT NULL,
  board_university TEXT NOT NULL,
  year_of_passing TEXT NOT NULL,
  passed_or_appearing TEXT NOT NULL CHECK (passed_or_appearing IN ('passed', 'appearing')),
  marks_percentage TEXT,
  certifications TEXT,
  -- Experience Information
  is_fresher BOOLEAN DEFAULT true,
  organization_name TEXT,
  post_held TEXT,
  job_period_from DATE,
  job_period_to DATE,
  reason_of_leaving TEXT,
  previous_ctc TEXT,
  total_experience TEXT,
  -- Office Use
  date_of_joining DATE NOT NULL,
  designation TEXT NOT NULL,
  additional_charge TEXT,
  responsibilities TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  -- Leave Balances
  paid_leave_balance INTEGER DEFAULT 12,
  medical_leave_balance INTEGER DEFAULT 6,
  exchange_leave_balance INTEGER DEFAULT 0,
  -- System
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ==========================================
-- LEAVE REQUESTS TABLE
-- ==========================================
CREATE TABLE public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  reason TEXT NOT NULL,
  leave_type leave_type NOT NULL,
  status leave_status DEFAULT 'pending',
  rejection_reason TEXT,
  medical_certificate TEXT,
  working_date DATE,
  working_reason TEXT,
  is_add_leave BOOLEAN DEFAULT false,
  approved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ==========================================
-- TASKS TABLE
-- ==========================================
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  assigned_by UUID,
  priority task_priority DEFAULT 'medium',
  status task_status DEFAULT 'pending',
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ==========================================
-- DAILY REPORTS TABLE
-- ==========================================
CREATE TABLE public.daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ==========================================
-- PAYMENTS TABLE (Admin managed)
-- ==========================================
CREATE TABLE public.admin_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  paid_to TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  purpose TEXT NOT NULL,
  payment_mode TEXT NOT NULL,
  remarks TEXT,
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ==========================================
-- EMPLOYEE PAYMENTS TABLE (Misc & Traveling)
-- ==========================================
CREATE TABLE public.employee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('miscellaneous', 'traveling')),
  description TEXT NOT NULL,
  status payment_status DEFAULT 'pending',
  approved_by UUID,
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ==========================================
-- VISITORS TABLE
-- ==========================================
CREATE TABLE public.visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  purpose TEXT NOT NULL,
  person_to_meet TEXT NOT NULL,
  check_in TIMESTAMP WITH TIME ZONE DEFAULT now(),
  check_out TIMESTAMP WITH TIME ZONE,
  photo TEXT,
  id_proof TEXT,
  badge_number TEXT,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ==========================================
-- VEHICLES TABLE
-- ==========================================
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_number TEXT UNIQUE NOT NULL,
  vehicle_type TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  fuel_type TEXT NOT NULL,
  assigned_to UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  insurance_expiry DATE,
  puc_expiry DATE,
  fitness_expiry DATE,
  last_service_date DATE,
  next_service_due DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ==========================================
-- ADMIN ASSETS TABLE
-- ==========================================
CREATE TABLE public.admin_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  location TEXT,
  purchase_date DATE,
  purchase_price DECIMAL(12,2),
  vendor TEXT,
  warranty_till DATE,
  assigned_to UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ==========================================
-- IT ASSETS TABLE
-- ==========================================
CREATE TABLE public.it_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_number TEXT UNIQUE NOT NULL,
  asset_type TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  serial_number TEXT NOT NULL,
  purchase_date DATE NOT NULL,
  invoice_url TEXT,
  processor TEXT,
  ram_size TEXT,
  ram_serial TEXT,
  storage_type TEXT,
  storage_size TEXT,
  storage_serial TEXT,
  motherboard_model TEXT,
  motherboard_serial TEXT,
  display_model TEXT,
  display_serial TEXT,
  mac_address TEXT,
  warranty_till DATE NOT NULL,
  assigned_to UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ==========================================
-- IT PASSWORDS TABLE
-- ==========================================
CREATE TABLE public.it_passwords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal TEXT NOT NULL,
  username TEXT NOT NULL,
  encrypted_password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ==========================================
-- IT NETWORK IMAGES TABLE
-- ==========================================
CREATE TABLE public.it_network_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  image_type TEXT NOT NULL CHECK (image_type IN ('network', 'telephone')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ==========================================
-- TELEPHONE DIRECTORY TABLE
-- ==========================================
CREATE TABLE public.telephone_directory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department TEXT NOT NULL,
  intercom TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ==========================================
-- NOTICES TABLE
-- ==========================================
CREATE TABLE public.notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  expires_at DATE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ==========================================
-- CONTACTS TABLE (Organization Directory)
-- ==========================================
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  designation TEXT NOT NULL,
  department TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  extension TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ==========================================
-- PRODUCTS TABLE
-- ==========================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  price DECIMAL(12,2),
  stock_quantity INTEGER DEFAULT 0,
  unit TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ==========================================
-- REQUIREMENTS TABLE
-- ==========================================
CREATE TABLE public.requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requested_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  priority task_priority DEFAULT 'medium',
  status task_status DEFAULT 'pending',
  approved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ==========================================
-- INWARD OUTWARD REGISTER TABLE
-- ==========================================
CREATE TABLE public.inward_outward (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  register_type TEXT NOT NULL CHECK (register_type IN ('inward', 'outward')),
  date DATE NOT NULL,
  sender_receiver TEXT NOT NULL,
  subject TEXT NOT NULL,
  reference_number TEXT,
  document_type TEXT NOT NULL,
  remarks TEXT,
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ==========================================
-- LEAVE RESET AUDIT LOG TABLE
-- ==========================================
CREATE TABLE public.leave_reset_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  reset_year INTEGER NOT NULL,
  paid_leaves_reset INTEGER NOT NULL,
  medical_leaves_reset INTEGER NOT NULL,
  exchange_leaves_reset INTEGER NOT NULL,
  reset_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ==========================================
-- ENABLE ROW LEVEL SECURITY
-- ==========================================
ALTER TABLE public.portal_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.it_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.it_passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.it_network_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telephone_directory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inward_outward ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_reset_audit ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- RLS POLICIES - Public Read for most tables
-- (This app uses portal-based auth, not user-specific RLS)
-- ==========================================

-- Portal Users - Read/Write for all (authenticated via portal login)
CREATE POLICY "Allow all operations on portal_users" ON public.portal_users FOR ALL USING (true) WITH CHECK (true);

-- Employees
CREATE POLICY "Allow all operations on employees" ON public.employees FOR ALL USING (true) WITH CHECK (true);

-- Leave Requests
CREATE POLICY "Allow all operations on leave_requests" ON public.leave_requests FOR ALL USING (true) WITH CHECK (true);

-- Tasks
CREATE POLICY "Allow all operations on tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);

-- Daily Reports
CREATE POLICY "Allow all operations on daily_reports" ON public.daily_reports FOR ALL USING (true) WITH CHECK (true);

-- Admin Payments
CREATE POLICY "Allow all operations on admin_payments" ON public.admin_payments FOR ALL USING (true) WITH CHECK (true);

-- Employee Payments
CREATE POLICY "Allow all operations on employee_payments" ON public.employee_payments FOR ALL USING (true) WITH CHECK (true);

-- Visitors
CREATE POLICY "Allow all operations on visitors" ON public.visitors FOR ALL USING (true) WITH CHECK (true);

-- Vehicles
CREATE POLICY "Allow all operations on vehicles" ON public.vehicles FOR ALL USING (true) WITH CHECK (true);

-- Admin Assets
CREATE POLICY "Allow all operations on admin_assets" ON public.admin_assets FOR ALL USING (true) WITH CHECK (true);

-- IT Assets
CREATE POLICY "Allow all operations on it_assets" ON public.it_assets FOR ALL USING (true) WITH CHECK (true);

-- IT Passwords (Sensitive - IT Head only access enforced at app level)
CREATE POLICY "Allow all operations on it_passwords" ON public.it_passwords FOR ALL USING (true) WITH CHECK (true);

-- IT Network Images
CREATE POLICY "Allow all operations on it_network_images" ON public.it_network_images FOR ALL USING (true) WITH CHECK (true);

-- Telephone Directory
CREATE POLICY "Allow all operations on telephone_directory" ON public.telephone_directory FOR ALL USING (true) WITH CHECK (true);

-- Notices
CREATE POLICY "Allow all operations on notices" ON public.notices FOR ALL USING (true) WITH CHECK (true);

-- Contacts
CREATE POLICY "Allow all operations on contacts" ON public.contacts FOR ALL USING (true) WITH CHECK (true);

-- Products
CREATE POLICY "Allow all operations on products" ON public.products FOR ALL USING (true) WITH CHECK (true);

-- Requirements
CREATE POLICY "Allow all operations on requirements" ON public.requirements FOR ALL USING (true) WITH CHECK (true);

-- Inward Outward
CREATE POLICY "Allow all operations on inward_outward" ON public.inward_outward FOR ALL USING (true) WITH CHECK (true);

-- Leave Reset Audit
CREATE POLICY "Allow all operations on leave_reset_audit" ON public.leave_reset_audit FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- TRIGGERS FOR UPDATED_AT
-- ==========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON public.leave_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employee_payments_updated_at BEFORE UPDATE ON public.employee_payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_admin_assets_updated_at BEFORE UPDATE ON public.admin_assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_it_assets_updated_at BEFORE UPDATE ON public.it_assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_it_passwords_updated_at BEFORE UPDATE ON public.it_passwords FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_telephone_directory_updated_at BEFORE UPDATE ON public.telephone_directory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_requirements_updated_at BEFORE UPDATE ON public.requirements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- ENABLE REALTIME FOR KEY TABLES
-- ==========================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.employees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leave_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notices;