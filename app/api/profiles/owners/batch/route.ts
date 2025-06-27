// app/api/profiles/owners/batch/route.ts (updated)
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/db';
import { OwnerProfileService } from '@/lib/services/owner-profile-service';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ prefix: '[API /api/profiles/owners/batch]' });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountIds } = body; // Changed from ownerIds to accountIds
    
    if (!Array.isArray(accountIds) || accountIds.length === 0) {
      return NextResponse.json(
        { error: 'Account IDs array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Validate all IDs are strings
    if (!accountIds.every(id => typeof id === 'string')) {
      return NextResponse.json(
        { error: 'All account IDs must be strings' },
        { status: 400 }
      );
    }

    logger.debug('Batch fetching owner profiles by account IDs:', { count: accountIds.length });
    
    const supabase = createSupabaseAdminClient();
    const ownerProfileService = new OwnerProfileService(supabase);
    
    const ownerProfiles = await ownerProfileService.getBatchOwnerProfiles(accountIds);
    
    logger.debug('Batch owner profiles retrieved successfully:', { 
      requested: accountIds.length,
      found: Object.keys(ownerProfiles).length
    });
    
    return NextResponse.json(ownerProfiles);
    
  } catch (error: any) {
    logger.error('Error in POST /api/profiles/owners/batch:', { 
      message: error?.message 
    });
    
    return NextResponse.json(
      { error: error.message || 'Failed to batch fetch owner profiles.' },
      { status: 500 }
    );
  }
}

