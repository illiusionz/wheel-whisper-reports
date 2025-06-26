
-- Create table for storing historical unusual options activity
CREATE TABLE public.unusual_options_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  strike NUMERIC NOT NULL,
  expiration DATE NOT NULL,
  contract_type TEXT NOT NULL CHECK (contract_type IN ('call', 'put')),
  volume INTEGER NOT NULL,
  volume_ratio NUMERIC NOT NULL,
  price NUMERIC NOT NULL,
  open_interest INTEGER,
  sentiment TEXT NOT NULL,
  context TEXT NOT NULL,
  ai_analysis TEXT,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  week_start DATE NOT NULL,
  is_unusual BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for weekly sentiment aggregation
CREATE TABLE public.weekly_options_sentiment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  total_unusual_count INTEGER NOT NULL DEFAULT 0,
  bullish_count INTEGER NOT NULL DEFAULT 0,
  bearish_count INTEGER NOT NULL DEFAULT 0,
  bullish_volume BIGINT NOT NULL DEFAULT 0,
  bearish_volume BIGINT NOT NULL DEFAULT 0,
  dominant_sentiment TEXT NOT NULL CHECK (dominant_sentiment IN ('bullish', 'bearish', 'neutral')),
  sentiment_strength NUMERIC NOT NULL DEFAULT 0 CHECK (sentiment_strength >= 0 AND sentiment_strength <= 100),
  key_strikes JSONB DEFAULT '[]'::jsonb,
  week_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, symbol, week_start)
);

-- Add indexes for better query performance
CREATE INDEX idx_unusual_options_user_symbol ON public.unusual_options_activity(user_id, symbol);
CREATE INDEX idx_unusual_options_detected_at ON public.unusual_options_activity(detected_at);
CREATE INDEX idx_unusual_options_week_start ON public.unusual_options_activity(week_start);
CREATE INDEX idx_weekly_sentiment_user_symbol ON public.weekly_options_sentiment(user_id, symbol);
CREATE INDEX idx_weekly_sentiment_week_start ON public.weekly_options_sentiment(week_start);

-- Enable Row Level Security
ALTER TABLE public.unusual_options_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_options_sentiment ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for unusual_options_activity
CREATE POLICY "Users can view their own unusual options activity" 
  ON public.unusual_options_activity 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own unusual options activity" 
  ON public.unusual_options_activity 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own unusual options activity" 
  ON public.unusual_options_activity 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own unusual options activity" 
  ON public.unusual_options_activity 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create RLS policies for weekly_options_sentiment
CREATE POLICY "Users can view their own weekly sentiment" 
  ON public.weekly_options_sentiment 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own weekly sentiment" 
  ON public.weekly_options_sentiment 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weekly sentiment" 
  ON public.weekly_options_sentiment 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weekly sentiment" 
  ON public.weekly_options_sentiment 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Function to calculate week start (Monday) for any given date
CREATE OR REPLACE FUNCTION public.get_week_start(input_date DATE)
RETURNS DATE AS $$
BEGIN
  RETURN input_date - INTERVAL '1 day' * (EXTRACT(DOW FROM input_date) - 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate week end (Sunday) for any given date
CREATE OR REPLACE FUNCTION public.get_week_end(input_date DATE)
RETURNS DATE AS $$
BEGIN
  RETURN public.get_week_start(input_date) + INTERVAL '6 days';
END;
$$ LANGUAGE plpgsql IMMUTABLE;
