// app/api/profiles/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/db';
import { UpdateProfileSchema, UserProfile } from '@/lib/types/account-schemas'; // UserProfile for typing response
import { z } from 'zod';
import { getUserAccount } from '@/lib/utils/account';
import { ProfileService } from '@/lib/services/profile-service';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ prefix: '[API /api/profiles/me]' });

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const authResult = await getUserAccount(supabase);

  if (authResult.error || !authResult.userId) {
    logger.error('Auth check failed in GET /api/profiles/me:', { error: authResult.error, status: authResult.status });
    return NextResponse.json({ error: authResult.error || 'Authentication required.' }, { status: authResult.status || 401 });
  }
  
  try {
    const profileService = new ProfileService(supabase);
    const profile: UserProfile = await profileService.getProfile(authResult.userId);
    return NextResponse.json({ profile }); // Returns { "profile": UserProfile }
  } catch (error: any) {
    logger.error('Error in GET /api/profiles/me:', { message: error?.message });
    return NextResponse.json({ error: error.message || 'Failed to fetch profile.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) { // Use NextRequest for consistency
  const supabase = await createSupabaseServerClient();
  const authResult = await getUserAccount(supabase);

  if (authResult.error || !authResult.userId) {
    logger.error('Auth check failed in PUT /api/profiles/me:', { error: authResult.error, status: authResult.status });
    return NextResponse.json({ error: authResult.error || 'Authentication required.' }, { status: authResult.status || 401 });
  }

  try {
    const json = await request.json();
    const validatedData = UpdateProfileSchema.parse(json);

    const profileService = new ProfileService(supabase);
    const updatedProfile: UserProfile = await profileService.updateProfile(authResult.userId, validatedData);
    return NextResponse.json({ profile: updatedProfile }); // Returns { "profile": UserProfile }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      logger.warn('Validation error in PUT /api/profiles/me:', { errors: error.errors });
      return NextResponse.json({ error: "Invalid input data.", details: error.errors }, { status: 400 });
    }
    logger.error('Error in PUT /api/profiles/me:', { message: error?.message });
    return NextResponse.json({ error: error.message || 'Failed to update profile.' }, { status: 500 });
  }
}