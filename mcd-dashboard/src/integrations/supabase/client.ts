import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://jrjakjwwliwsktmostby.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyamFrand3bGl3c2t0bW9zdGJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMjE2NDksImV4cCI6MjA5Mzg5NzY0OX0.e54QOOB3rGWAGpg9Dj2V-UcnXuPd717P3qUHKRLqxI0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});