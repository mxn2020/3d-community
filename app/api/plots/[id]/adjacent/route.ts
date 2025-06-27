// app/api/plots/[plotId]/adjacent/route.ts
import { createSupabaseServerClient } from '@/lib/db';
import { PlotService } from '@/lib/services/plot-service';
import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ prefix: '[API /plots/[id]/adjacent]' });

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: plotId } = await params;
  try {
    logger.debug(`Finding adjacent plots for plot ID: ${plotId}`);
    
    if (!plotId) {
      return NextResponse.json({ error: 'Plot ID is required' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const plotService = new PlotService(supabase);
    
    try {
      const adjacentPlots = await plotService.getAdjacentPlots(plotId);
      
      logger.debug(`Found ${adjacentPlots.length} adjacent plots for plot ID: ${plotId}`);
      
      return NextResponse.json({ 
        success: true, 
        plotId,
        adjacentPlotsCount: adjacentPlots.length,
        adjacentPlots
      });
    } catch (error: any) {
      logger.error(`Error finding adjacent plots: ${error.message}`, { plotId, error });
      return NextResponse.json({ 
        success: false, 
        plotId,
        error: error.message || 'Failed to find adjacent plots',
        adjacentPlotsCount: 0,
        adjacentPlots: []
      });
    }
  } catch (error: any) {
    console.error('Error fetching adjacent plots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch adjacent plots' },
      { status: 500 }
    );
  }
}
