DO $$
BEGIN
  BEGIN ALTER TABLE public.daily_reports     ADD CONSTRAINT daily_reports_employee_id_fkey     FOREIGN KEY (employee_id)  REFERENCES public.employees(id) ON DELETE SET NULL NOT VALID; EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL; END;
  BEGIN ALTER TABLE public.leave_requests    ADD CONSTRAINT leave_requests_employee_id_fkey    FOREIGN KEY (employee_id)  REFERENCES public.employees(id) ON DELETE SET NULL NOT VALID; EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL; END;
  BEGIN ALTER TABLE public.employee_payments ADD CONSTRAINT employee_payments_employee_id_fkey FOREIGN KEY (employee_id)  REFERENCES public.employees(id) ON DELETE SET NULL NOT VALID; EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL; END;
  BEGIN ALTER TABLE public.attendance        ADD CONSTRAINT attendance_employee_id_fkey        FOREIGN KEY (employee_id)  REFERENCES public.employees(id) ON DELETE SET NULL NOT VALID; EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL; END;
  BEGIN ALTER TABLE public.approval_requests ADD CONSTRAINT approval_requests_employee_id_fkey FOREIGN KEY (employee_id)  REFERENCES public.employees(id) ON DELETE SET NULL NOT VALID; EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL; END;
  BEGIN ALTER TABLE public.requirements      ADD CONSTRAINT requirements_requested_by_fkey     FOREIGN KEY (requested_by) REFERENCES public.employees(id) ON DELETE SET NULL NOT VALID; EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL; END;
  BEGIN ALTER TABLE public.vehicles          ADD CONSTRAINT vehicles_assigned_to_fkey          FOREIGN KEY (assigned_to)  REFERENCES public.employees(id) ON DELETE SET NULL NOT VALID; EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL; END;
  BEGIN ALTER TABLE public.admin_assets      ADD CONSTRAINT admin_assets_assigned_to_fkey      FOREIGN KEY (assigned_to)  REFERENCES public.employees(id) ON DELETE SET NULL NOT VALID; EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL; END;
  BEGIN ALTER TABLE public.it_assets         ADD CONSTRAINT it_assets_assigned_to_fkey         FOREIGN KEY (assigned_to)  REFERENCES public.employees(id) ON DELETE SET NULL NOT VALID; EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL; END;
  BEGIN ALTER TABLE public.tasks             ADD CONSTRAINT tasks_assigned_to_fkey             FOREIGN KEY (assigned_to)  REFERENCES public.employees(id) ON DELETE SET NULL NOT VALID; EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL; END;
  BEGIN ALTER TABLE public.tasks             ADD CONSTRAINT tasks_assigned_by_fkey             FOREIGN KEY (assigned_by)  REFERENCES public.employees(id) ON DELETE SET NULL NOT VALID; EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL; END;
END $$;

NOTIFY pgrst, 'reload schema';