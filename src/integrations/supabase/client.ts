// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://hwztwucqzfwzcitdkgpn.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3enR3dWNxemZ3emNpdGRrZ3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MjczNzUsImV4cCI6MjA2NjQwMzM3NX0.JdOMZjdvq5O1I90EUVAsPcqtfLmJjTHFdXFrcZ4W3Rc";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);