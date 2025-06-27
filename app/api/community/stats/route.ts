// app/api/community/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/db';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ prefix: '[API /api/community/stats]' });

// GET: Retrieve community statistics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get count of users
    const { count: usersCount, error: usersError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (usersError) {
      throw usersError;
    }
    
    // Get count of plots
    const { count: totalPlotsCount, error: plotsError } = await supabase
      .from('plots')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null);
    
    if (plotsError) {
      throw plotsError;
    }
    
    // Get count of owned plots
    const { count: ownedPlotsCount, error: ownedError } = await supabase
      .from('plots')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)
      .not('owner_id', 'is', null);
    
    if (ownedError) {
      throw ownedError;
    }
    
    // Calculate percentage of owned plots
    const percentageOwned = totalPlotsCount > 0 
      ? Math.round((ownedPlotsCount / totalPlotsCount) * 100) 
      : 0;
    
    return NextResponse.json({
      usersCount,
      totalPlotsCount,
      ownedPlotsCount,
      availablePlotsCount: totalPlotsCount - ownedPlotsCount,
      percentageOwned,
    });
  } catch (error: any) {
    logger.error('Error in GET /api/community/stats:', { message: error?.message });
    return NextResponse.json(
      { error: error.message || 'Failed to fetch community statistics.' },
      { status: 500 }
    );
  }
}
