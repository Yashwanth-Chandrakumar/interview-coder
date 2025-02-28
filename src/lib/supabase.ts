import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://zclzftjwjmwselbzyqqz.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjbHpmdGp3am13c2VsYnp5cXF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA3NjE1MzQsImV4cCI6MjA1NjMzNzUzNH0.M_hel6YEwr-FEs2lwUM-5zsN5fN373sAHcOMttM9SU4"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: "pkce",
    detectSessionInUrl: true
  }
})
