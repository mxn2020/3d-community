// app/api/community/activities/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/db';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ prefix: '[API /api/community/activities]' });

// GET: Retrieve recent community activities
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get recent plot purchases
    const { data: purchases, error: purchasesError } = await supabase
      .from('plots')
      .select(`
        id,
        plot_number,
        plot_type,
        house_type,
        house_color,
        updated_at,
        profiles:owner_id (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .is('deleted_at', null)
      .not('owner_id', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(10);
    
    if (purchasesError) {
      throw purchasesError;
    }
    
    // Transform purchases into activity items
    const activities = purchases.map(purchase => ({
      id: purchase.id,
      type: 'plot_purchase',
      timestamp: purchase.updated_at,
      plotNumber: purchase.plot_number,
      plotType: purchase.plot_type,
      houseType: purchase.house_type,
      houseColor: purchase.house_color,
      user: purchase.profiles ? {
        id: purchase.profiles.id,
        username: purchase.profiles.username,
        fullName: purchase.profiles.full_name,
        avatarUrl: purchase.profiles.avatar_url,
      } : null,
    }));
    
    return NextResponse.json(activities);
  } catch (error: any) {
    logger.error('Error in GET /api/community/activities:', { message: error?.message });
    return NextResponse.json(
      { error: error.message || 'Failed to fetch community activities.' },
      { status: 500 }
    );
  }
}
