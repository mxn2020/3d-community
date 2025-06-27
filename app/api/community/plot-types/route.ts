// app/api/community/plot-types/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/db';
import { CommunityService } from '@/lib/services/community-service';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ prefix: '[API /api/community/plot-types]' });

// GET: Retrieve plot types with colors from constants
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const communityService = new CommunityService(supabase);
    
    // Get plot types with colors from the service
    const plotTypes = communityService.getPlotTypeInfo();
    
    return NextResponse.json(plotTypes);
  } catch (error: any) {
    logger.error('Error in GET /api/community/plot-types:', { message: error?.message });
    return NextResponse.json(
      { error: error.message || 'Failed to fetch plot types.' },
      { status: 500 }
    );
  }
}
