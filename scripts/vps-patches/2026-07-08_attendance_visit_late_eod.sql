-- Adds Visit Location + Late status to public.attendance for the Admin Attendance
-- upgrade and Director EOD page. Safe to run repeatedly.

ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS visit_location text;

ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_status_check;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_status_check
  CHECK (status = ANY (ARRAY['Pending'::text, 'Approved'::text, 'Rejected'::text, 'Late'::text]));