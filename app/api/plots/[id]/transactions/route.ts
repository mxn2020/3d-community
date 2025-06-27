// app/api/plots/[plotId]/transactions/route.ts
import { createSupabaseServerClient } from '@/lib/db';
import { PlotService } from '@/lib/services/plot-service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: plotId } = await params;
  try {

    if (!plotId) {
      return NextResponse.json({ error: 'Plot ID is required' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const plotService = new PlotService(supabase);

    const transactions = await plotService.getPlotTransactions(plotId);

    return NextResponse.json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error('Error fetching plot transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plot transactions' },
      { status: 500 }
    );
  }
}
