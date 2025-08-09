import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fvahcgubddynggktqklz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2YWhjZ3ViZGR5bmdna3Rxa2x6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NzI0MDcsImV4cCI6MjA3MDM0ODQwN30.M08VvM756YpAAUfpX0WLUK3FyQFLD5wgutkHQyWWbpY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})