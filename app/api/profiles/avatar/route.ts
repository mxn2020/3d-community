// app/api/profile/avatar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/db';
import { getUserAccount } from '@/lib/utils/account';
import { ProfileService } from '@/lib/services/profile-service';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ prefix: '[API /api/profiles/avatar]' });
const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const authResult = await getUserAccount(supabase);

  if (authResult.error || !authResult.userId) {
    logger.error('Auth check failed in POST /api/profiles/avatar:', { error: authResult.error, status: authResult.status });
    return NextResponse.json({ error: authResult.error || 'Authentication required.' }, { status: authResult.status || 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'File must be an image.' }, { status: 400 });
    // Updated file size check
    if (file.size > MAX_AVATAR_SIZE_BYTES) {
        return NextResponse.json({ error: `File size must be less than ${MAX_AVATAR_SIZE_BYTES / (1024 * 1024)}MB.` }, { status: 400 });
    }

    const profileService = new ProfileService(supabase);
    const avatarUrlString = await profileService.uploadAvatar(authResult.userId, file);
    
    return NextResponse.json({ avatarUrl: avatarUrlString });
  } catch (error: any) {
    logger.error('Error in POST /api/profiles/avatar:', { message: error?.message });
    return NextResponse.json({ error: error.message || 'Failed to upload avatar.' }, { status: 500 });
  }
}