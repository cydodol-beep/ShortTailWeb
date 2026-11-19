import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://gggpkciminardekbmpyk.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnZ3BrY2ltaW5hcmRla2JtcHlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMzk0MzcsImV4cCI6MjA3OTgxNTQzN30.2mx1CKUBZDnhyNpeZ1JlwDk_OJ7MAwyW_VBVDIBQMKc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: (...args: Parameters<typeof fetch>) => window.fetch(...args),
  },
});
