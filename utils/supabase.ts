import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://anxhpmvpzlvlkylttzub.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFueGhwbXZwemx2bGt5bHR0enViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwNTA2MjMsImV4cCI6MjA2MzYyNjYyM30.ngKFH2gRAaIcoJn2fz7wnOTxEV8xT_RONUw225ZJNsw";

export const supabase = createClient(supabaseUrl, supabaseKey, {
 auth: {
    flowType: 'implicit', // Changed from 'pkce' - that's it!
    autoRefreshToken: true,
    detectSessionInUrl: true,
    persistSession: true,
  },
  db: {
    schema: 'public',
  },
});

// Vector extension configuration
export const enableVectorExtension = async () => {
  await supabase.rpc('create_extension', { extname: 'vector' });
};