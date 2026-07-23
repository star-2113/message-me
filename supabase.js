// Message Me Supabase Connection

const SUPABASE_URL = "https://tuazxbdjbjzdquhldqso.supabase.co";

const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1YXp4YmRqYmp6ZHF1aGxkcXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NjQyNjAsImV4cCI6MjEwMDI0MDI2MH0.9IJyk1mN3cwzuocSNj7OhABkXrjHvuUR_1PrbEdER0c";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);