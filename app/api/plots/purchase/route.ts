// /app/api/plots/purchase/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/db';
import { getUserAccount } from '@/lib/utils/account';
import { PlotService } from '@/lib/services/plot-service';
import { PlotPurchaseSchema } from '@/lib/types/plot-schemas';
import { createLogger } from '@/lib/logger';
import { z } from 'zod';

const logger = createLogger({ prefix: '[API /api/plots/purchase]' });

// POST: Purchase a plot
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const authResult = await getUserAccount(supabase);

  if (authResult.error || !authResult.userId) {
    return NextResponse.json(
      { error: authResult.error || 'Authentication required.' },
      { status: authResult.status || 401 }
    );
  }

  try {
    const data = await request.json();
    
    // Validate input
    try {
      PlotPurchaseSchema.parse(data);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid input', details: validationError.errors },
          { status: 400 }
        );
      }
    }
    
    // Look up the user's account (accounts.owner_user_id = auth.userId)
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id')
      .eq('owner_user_id', authResult.userId)
      .is('deleted_at', null)
      .maybeSingle();
    if (accountError) {
      logger.error('[purchase] Account lookup error:', { error: accountError });
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
    const userId = authResult.userId;
    const plotService = new PlotService(supabase);
    const plot = await plotService.purchasePlot(accountId, userId, data);
    
    return NextResponse.json(plot);
  } catch (error: any) {
    logger.error('Error in POST /api/plots/purchase:', { message: error?.message });
    
    // Handle specific error for user already owning a plot
    if (error.message.includes('already owns a plot')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 } // Conflict
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to purchase plot.' },
      { status: 500 }
    );
  }
}

