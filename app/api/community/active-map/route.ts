// app/api/community/active-map/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/db';
import { CommunityService } from '@/lib/services/community-service';
import { createLogger } from '@/lib/logger';
import { MapDataSchema } from '@/lib/types/map-schemas';

const logger = createLogger({ prefix: '[API /api/community/active-map]' });

// GET: Retrieve active community map
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const communityService = new CommunityService(supabase);
    
    const activeMap = await communityService.getActiveMap();
    
    if (!activeMap) {
      return NextResponse.json(null, { status: 404 });
    }

    try {
      // Validate and parse map_data if it exists
      if (activeMap.mapData) {
        const parsedMapData = MapDataSchema.parse(activeMap.mapData);
        activeMap.mapData = parsedMapData;
      }
    } catch (parseError) {
      logger.error('Failed to parse active map data:', parseError);
      return NextResponse.json(
        { error: 'Active map data is invalid.' },
        { status: 422 }
      );
    }
    
    return NextResponse.json(activeMap);
  } catch (error: any) {
    logger.error('Error in GET /api/community/active-map:', { message: error?.message });
    return NextResponse.json(
      { error: error.message || 'Failed to fetch active community map.' },
      { status: 500 }
    );
  }
}
