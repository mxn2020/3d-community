// src/clients/supabase/index.ts
// Barrel file for all Supabase utilities and clients

// Export key management utilities
export * from './supabase/keys';

// Export client implementations
export * from './supabase/browser';
export * from './supabase/server';
export * from './supabase/admin';

// Export helper utilities
export * from './supabase/auth';
export * from './supabase/storage';
export * from './supabase/server-action-wrapper';

// Re-export the SupabaseClient type for convenience
import type { SupabaseClient } from '@supabase/supabase-js';
export type { SupabaseClient };

// Also export Server-specific types from the server module
export type { 
  CookieStore,
  ServerClientOptions
} from './supabase/server';