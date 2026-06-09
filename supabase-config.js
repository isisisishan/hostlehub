// Supabase Client Initialization
const SUPABASE_URL = 'https://bpaeuxwbnxptwirpfimt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwYWV1eHdibnhwdHdpcnBmaW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMDc0MTgsImV4cCI6MjA5NjU4MzQxOH0.SQ7waC_1lrAjPsERG6BvWcy34lmAGZBZH-Yrq9P02Lk';

if (typeof supabase === 'undefined') {
  console.error('Supabase CDN library not loaded! Check index.html CDN script tag.');
}

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabaseClient = supabaseClient;
console.log("Supabase Client initialized successfully!");
