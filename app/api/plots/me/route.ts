// app/api/plots/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/db';
import { PlotService } from '@/lib/services/plot-service';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ prefix: '[API /api/plots/me]' });

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  // Get accountId from query param
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('accountId');

  if (!accountId) {
    return NextResponse.json(
      { error: 'Missing accountId parameter.' },
      { status: 400 }
    );
  }

  try {
    const plotService = new PlotService(supabase);
    const plots = await plotService.getUserPlots(accountId);
    if (!plots || plots.length === 0) {
      return NextResponse.json(
        { error: 'User does not own any plots.' },
        { status: 404 }
      );
    }
    return NextResponse.json(plots);
  } catch (error: any) {
    logger.error('Error in GET /api/plots/me:', { message: error?.message });
    return NextResponse.json(
      { error: error.message || 'Failed to fetch user plots.' },
      { status: 500 }
    );
  }
}
