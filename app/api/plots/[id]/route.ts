// /app/api/plots/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/db';
import { PlotService } from '@/lib/services/plot-service';
import { createLogger } from '@/lib/logger';
import { getUserAccount } from '@/lib/utils/account';

const logger = createLogger({ prefix: '[API /api/plots/[id]]' });

// GET: Retrieve a specific plot by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: plotId } = await params;
  
  try {
    const supabase = await createSupabaseServerClient();
    const plotService = new PlotService(supabase);
    
    let plot;
    try {
      // First try to get it from the plots table (already purchased plots)
      plot = await plotService.getPlotById(plotId);
    } catch (error: any) {
      logger.debug('Plot not found in plots table, trying unsold plots:', { id: plotId });
      // If not found in plots table or there was an error, try get it as an unsold plot
      plot = await plotService.getUnsoldPlotById(plotId);
    }
    
    return NextResponse.json(plot);
  } catch (error: any) {
    logger.error('Error in GET /api/plots/[id]:', { id: plotId, message: error?.message });
    return NextResponse.json(
      { error: error.message || 'Failed to fetch plot.', plotId },
      { status: 500 }
    );
  }
}

// PUT: Update a plot (for customizing house details)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: plotId } = await params;
  try {
    const supabase = await createSupabaseServerClient();
    const { userId } = await getUserAccount(supabase);
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 }
      );
    }
    // Look up the user's account (accounts.owner_user_id = userId)
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id')
      .eq('owner_user_id', userId)
      .is('deleted_at', null)
      .maybeSingle();
    if (accountError) {
      logger.error('[PUT] Account lookup error:', { error: accountError });
      return NextResponse.json(
        { error: 'Failed to look up user account' },
        { status: 500 }
      );
    }
    if (!account) {
      return NextResponse.json(
        { error: 'No account found for user' },
        { status: 404 }
      );
    }
    const accountId = account.id;
    const data = await request.json();
    const plotService = new PlotService(supabase);
    const plot = await plotService.updatePlot(plotId, accountId, userId, data);
    return NextResponse.json(plot);
  } catch (error: any) {
    logger.error('Error in PUT /api/plots/[id]:', { id: plotId, message: error?.message });
    return NextResponse.json(
      { error: error.message || 'Failed to update plot.' },
      { status: 500 }
    );
  }
}

