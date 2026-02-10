// ============================================
// Supabase Client - Best Practices Uygulamalı
// ============================================
// Next.js App Router için client/server ayrımı
// ============================================

// Re-export the browser client for backward compatibility
// Services: auth.service.ts, customers.service.ts, dashboard.service.ts, transactions.service.ts
// These services use the singleton supabase client instance
export { supabase, createClient as createBrowserClient } from './supabase/client'

// Note: For Server Components, import directly from '@/lib/supabase/server'
// This prevents server-only code from being bundled into client components