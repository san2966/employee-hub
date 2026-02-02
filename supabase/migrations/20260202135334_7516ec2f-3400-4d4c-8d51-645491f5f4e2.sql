-- Create tickets table for IT Head support system
CREATE TABLE public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Closed')),
  problem_cause TEXT,
  solution_provided TEXT,
  resolution_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create tickets (public contact form)
CREATE POLICY "Anyone can create tickets"
ON public.tickets
FOR INSERT
WITH CHECK (true);

-- Allow anyone to read tickets (IT Head reads from localStorage auth for now)
CREATE POLICY "Anyone can read tickets"
ON public.tickets
FOR SELECT
USING (true);

-- Allow updates for ticket resolution
CREATE POLICY "Anyone can update tickets"
ON public.tickets
FOR UPDATE
USING (true);

-- Enable realtime for tickets
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;