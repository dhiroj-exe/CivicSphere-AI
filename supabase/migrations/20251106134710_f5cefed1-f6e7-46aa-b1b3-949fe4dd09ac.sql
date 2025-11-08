-- Create table for caching local data from various APIs
CREATE TABLE IF NOT EXISTS public.local_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location TEXT NOT NULL,
  api_source TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '1 hour')
);

-- Create index for faster lookups
CREATE INDEX idx_local_data_location_source ON public.local_data(location, api_source);
CREATE INDEX idx_local_data_expires ON public.local_data(expires_at);

-- Enable RLS
ALTER TABLE public.local_data ENABLE ROW LEVEL SECURITY;

-- Public read policy for cached data
CREATE POLICY "Anyone can read cached local data"
  ON public.local_data
  FOR SELECT
  USING (true);

-- Create table for AI-generated local insights
CREATE TABLE IF NOT EXISTS public.local_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  summarized_insight TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster user queries
CREATE INDEX idx_local_insights_user ON public.local_insights(user_id);
CREATE INDEX idx_local_insights_location ON public.local_insights(location);

-- Enable RLS
ALTER TABLE public.local_insights ENABLE ROW LEVEL SECURITY;

-- Users can view their own insights
CREATE POLICY "Users can view their own insights"
  ON public.local_insights
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own insights
CREATE POLICY "Users can create their own insights"
  ON public.local_insights
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create table for user preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_location TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'en',
  notification_settings JSONB DEFAULT '{"weather": true, "aqi": true, "news": true, "alerts": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert their own preferences"
  ON public.user_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_preferences_timestamp
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_preferences_updated_at();

-- Function to clean up expired cached data
CREATE OR REPLACE FUNCTION public.cleanup_expired_local_data()
RETURNS void AS $$
BEGIN
  DELETE FROM public.local_data WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;