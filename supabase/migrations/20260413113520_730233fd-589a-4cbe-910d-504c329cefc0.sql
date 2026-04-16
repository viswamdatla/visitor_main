
CREATE TABLE public.visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_name TEXT NOT NULL,
  visitor_company TEXT NOT NULL DEFAULT '',
  visitor_mobile TEXT NOT NULL DEFAULT '',
  visitor_type TEXT NOT NULL DEFAULT 'visitor',
  purpose TEXT NOT NULL DEFAULT '',
  host_id TEXT NOT NULL DEFAULT '',
  host_name TEXT NOT NULL DEFAULT '',
  host_department TEXT NOT NULL DEFAULT '',
  scheduled_date TEXT NOT NULL,
  scheduled_time TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  otp TEXT NOT NULL DEFAULT '',
  otp_expires_at TEXT,
  secure_token TEXT NOT NULL DEFAULT '',
  check_in_time TEXT,
  check_out_time TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visits are publicly readable" ON public.visits FOR SELECT USING (true);
CREATE POLICY "Anyone can create visits" ON public.visits FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update visits" ON public.visits FOR UPDATE USING (true);
