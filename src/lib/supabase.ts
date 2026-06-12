import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bnuqtpqkddvqmmuyvgoy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJudXF0cHFrZGR2cW1tdXl2Z295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NzA1MjgsImV4cCI6MjA5MzM0NjUyOH0.FB1lpM6mYiJjywwhLwAO_0Fg4qnfkKU-F5pWIOG8vnM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);