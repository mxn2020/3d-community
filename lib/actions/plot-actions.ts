// lib/actions/plot-actions.ts
'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/db';
import { createSupabaseAdminClient } from '@/lib/db/supabase/admin';
import { PlotService } from '@/lib/services/plot-service';
import { PlotPurchaseInput, PlotPurchaseSchema, UpdatePlotInput, UpdatePlotSchema, PlotSaleSchema, PlotSaleInput, CACHE_TAGS } from '@/lib/types/plot-schemas';
import { getUserAccount } from '@/lib/utils/account';
import { ActionResponse } from '@/lib/types/response';
import { z } from 'zod';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ prefix: '[plot-actions]' });

/**
 * Server action to purchase one or more plots
 * Accepts accountId and userId as arguments
 */
export async function purchasePlotAction(accountId: string, userId: string, input: PlotPurchaseInput): Promise<ActionResponse<any>> {
  try {
    const validatedData = PlotPurchaseSchema.parse(input);

    // Use the admin client to bypass RLS for plot purchases
    const supabaseAdmin = createSupabaseAdminClient();
    const plotService = new PlotService(supabaseAdmin);
    const plot = await plotService.purchasePlot(accountId, userId, validatedData);

    // Revalidate cache
    revalidatePath('/');
    revalidateTag(CACHE_TAGS.PLOTS);
    
    // Revalidate each individual plot
    for (const plotId of input.plotIds) {
      revalidateTag(CACHE_TAGS.PLOT(plotId));
    }
    
    // Revalidate user-related cache
    revalidateTag(CACHE_TAGS.USER_PLOTS(accountId));
    revalidateTag(CACHE_TAGS.USER_PLOT_SETS(accountId));
    revalidateTag(CACHE_TAGS.AVAILABLE_PLOTS);

    return { success: true, data: plot };
  } catch (error) {
    logger.error('[purchasePlotAction] Error:', { error });
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors, validationError: true };
    }
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Server action to update a plot
 * Accepts accountId and userId as arguments
 */
export async function updatePlotAction(id: string, accountId: string, userId: string, input: UpdatePlotInput): Promise<ActionResponse<any>> {
  try {
    const validatedId = z.string().uuid().parse(id);
    const validatedData = UpdatePlotSchema.parse(input);

    const supabase = await createSupabaseServerClient();
    const plotService = new PlotService(supabase);
    const plot = await plotService.updatePlot(validatedId, accountId, userId, validatedData);

    // Revalidate cache
    revalidatePath('/');
    revalidateTag(CACHE_TAGS.PLOTS);
    revalidateTag(CACHE_TAGS.PLOT(plot.id));
    revalidateTag(CACHE_TAGS.USER_PLOTS(accountId));

    return { success: true, data: plot };
  } catch (error) {
    logger.error('[updatePlotAction] Error:', { error });
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors, validationError: true };
    }
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Server action to sell a plot, making it available again
 */
export async function sellPlotAction(plotId: string, accountId: string, userId: string): Promise<ActionResponse<any>> {
  try {
    const validatedPlotId = z.string().uuid().parse(plotId);

    // Use the admin client to bypass RLS for plot operations
    const supabaseAdmin = createSupabaseAdminClient();
    const plotService = new PlotService(supabaseAdmin);
    const plot = await plotService.sellPlot(validatedPlotId, accountId, userId);

    // Revalidate cache
    revalidatePath('/');
    revalidateTag(CACHE_TAGS.PLOTS);
    revalidateTag(CACHE_TAGS.PLOT(plot.id));
    revalidateTag(CACHE_TAGS.USER_PLOTS(accountId));
    revalidateTag(CACHE_TAGS.USER_PLOT_SETS(accountId));
    revalidateTag(CACHE_TAGS.AVAILABLE_PLOTS);
    revalidateTag(CACHE_TAGS.PLOT_TRANSACTIONS);

    return { success: true, data: plot };
  } catch (error) {
    logger.error('[sellPlotAction] Error:', { error });
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors, validationError: true };
    }
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Server action to get plot transaction history
 */
export async function getPlotTransactionsAction(plotId: string): Promise<ActionResponse<any>> {
  try {
    const validatedPlotId = z.string().uuid().parse(plotId);

    const supabase = await createSupabaseServerClient();
    const plotService = new PlotService(supabase);
    const transactions = await plotService.getPlotTransactions(validatedPlotId);

    return { success: true, data: transactions };
  } catch (error) {
    logger.error('[getPlotTransactionsAction] Error:', { error });
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors, validationError: true };
    }
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Server action to get adjacent plots
 */
export async function getAdjacentPlotsAction(plotId: string): Promise<ActionResponse<any>> {
  try {
    const validatedPlotId = z.string().uuid().parse(plotId);

    const supabase = await createSupabaseServerClient();
    const plotService = new PlotService(supabase);
    const adjacentPlots = await plotService.getAdjacentPlots(validatedPlotId);

    return { success: true, data: adjacentPlots };
  } catch (error) {
    logger.error('[getAdjacentPlotsAction] Error:', { error });
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors, validationError: true };
    }
    return { success: false, error: (error as Error).message };
  }
}

