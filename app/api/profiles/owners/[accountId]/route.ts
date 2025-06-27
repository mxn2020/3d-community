// app/api/profiles/owners/[accountId]/route.ts (updated)
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/db';
import { OwnerProfileService } from '@/lib/services/owner-profile-service';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ prefix: '[API /api/profiles/owners/[accountId]]' });

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  const { accountId } = await params;
  try {
    
    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    logger.debug('Fetching owner profile by account ID:', { accountId });
    
    const supabase = await createSupabaseServerClient();
    const supabaseAdmin = createSupabaseAdminClient();
    const ownerProfileService = new OwnerProfileService(supabaseAdmin);
    
    const ownerProfile = await ownerProfileService.getOwnerProfile(accountId);
    
    if (!ownerProfile) {
      return NextResponse.json(
        { error: 'Owner profile not found' },
        { status: 404 }
      );
    }
    
    logger.debug('Owner profile retrieved successfully:', { accountId });
    return NextResponse.json(ownerProfile);
    
  } catch (error: any) {
    logger.error('Error in GET /api/profiles/owners/[accountId]:', { 
      accountId,
      message: error?.message 
    });
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch owner profile.' },
      { status: 500 }
    );
  }
}