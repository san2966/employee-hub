-- Fix public SELECT policies to require authentication

-- Tickets table - restrict to authenticated users (IT Head and Admin can manage, all authenticated can view)
DROP POLICY IF EXISTS tickets_select ON public.tickets;
CREATE POLICY tickets_select ON public.tickets
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Contacts table - restrict to authenticated users only
DROP POLICY IF EXISTS contacts_select ON public.contacts;
CREATE POLICY contacts_select ON public.contacts
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Telephone directory - restrict to authenticated users only
DROP POLICY IF EXISTS telephone_directory_select ON public.telephone_directory;
CREATE POLICY telephone_directory_select ON public.telephone_directory
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Notices table - restrict to authenticated users only
DROP POLICY IF EXISTS notices_select ON public.notices;
CREATE POLICY notices_select ON public.notices
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);