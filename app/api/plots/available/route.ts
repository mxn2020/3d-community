// app/api/plots/available/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/db';
import { PlotService } from '@/lib/services/plot-service';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ prefix: '[API /api/plots/available]' });

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const plotService = new PlotService(supabase);
    
    const plots = await plotService.getAvailablePlots();
    
    return NextResponse.json(plots);
  } catch (error: any) {
    logger.error('Error in GET /api/plots/available:', { message: error?.message });
    return NextResponse.json(
      { error: error.message || 'Failed to fetch available plots.' },
      { status: 500 }
    );
  }
}
