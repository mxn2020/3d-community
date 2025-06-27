// Define shared types, e.g., from Supabase auth or your own user profile structure
import type { User as SupabaseUser, Session as SupabaseSession } from '@supabase/supabase-js';

// Re-export or define your own types based on Supabase or other sources
export type User = SupabaseUser;
export type Session = SupabaseSession;

// Example custom type
export interface UserProfile {
	id: string; // Usually matches User ID
	username: string | null;
	full_name: string | null;
	avatar_url: string | null;
	// Add other profile fields
}

// Generic type for server action results with potential errors
export type ActionResult<T = null> =
	| { success: true; data: T }
	| { success: false; error: { message: string; code?: string } };
