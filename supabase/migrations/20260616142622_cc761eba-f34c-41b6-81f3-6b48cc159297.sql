
CREATE POLICY "employee_payments_receipts_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'employee-payments');
CREATE POLICY "employee_payments_receipts_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'employee-payments');
CREATE POLICY "employee_payments_receipts_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'employee-payments');
CREATE POLICY "employee_payments_receipts_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'employee-payments');
