import { createClient } from '@supabase/supabase-js'

/*const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
*/
const supabaseUrl = 'https://bkitemxgibjafjlqriei.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJraXRlbXhnaWJqYWZqbHFyaWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MTcyNzEsImV4cCI6MjA3NjI5MzI3MX0.Gqh8U5r5Cildwk-_nx3hYwN7T0xzwUIBBA2sJYnV-Vk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Engagement {
  id: string
  created_at: string
  company_name: string
  industry: string
  business_context: string
  current_challenges: string
  strategic_goals: string
  technical_landscape: string
  constraints: string
  timeline: string
  budget: string
  artifacts: any
}
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Loaded' : 'Missing')