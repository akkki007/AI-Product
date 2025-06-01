/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = "https://anxhpmvpzlvlkylttzub.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFueGhwbXZwemx2bGt5bHR0enViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwNTA2MjMsImV4cCI6MjA2MzYyNjYyM30.ngKFH2gRAaIcoJn2fz7wnOTxEV8xT_RONUw225ZJNsw";
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to handle new message insertions
const handleNewMessage = (payload: any) => {
    console.log('New message received:', payload.new);
 
};

// Subscribe to realtime changes
const subscription = supabase
    .channel('messages-channel')
    .on(
        'postgres_changes',
        {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
        },
        handleNewMessage
    )
    .subscribe();



// Cleanup function to remove subscription when needed
process.on('SIGTERM', () => {
    subscription.unsubscribe();
    process.exit(0);
});

console.log('Background worker started - listening for new messages...');