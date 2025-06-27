import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/db';
import { getUserAccount } from '@/lib/utils/account';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ prefix: '[API /api/plots/[id]/like]' });

// GET: Check if the current user has liked a plot
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: plotId } = await params;

  const supabase = await createSupabaseServerClient();

  // Get current user
  const authResult = await getUserAccount(supabase);

  if (authResult.error || !authResult.userId) {
    return NextResponse.json(
      { error: authResult.error || 'Authentication required' },
      { status: authResult.status || 401 }
    );
  }

  try {
    // Check if the user has liked the plot
    const { data, error } = await supabase
      .from('plot_likes')
      .select('*')
      .eq('plot_id', plotId)
      .eq('user_id', authResult.userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" which is ok
      throw error;
    }

    return NextResponse.json({ liked: !!data });
  } catch (error: any) {
    logger.error('Error checking like status:', { message: error.message, plotId });
    return NextResponse.json(
      { error: error.message || 'Failed to check like status' },
      { status: 500 }
    );
  }
}

// POST: Toggle like status for a plot
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const plotId = params.id;
  const supabase = await createSupabaseServerClient();

  // Get current user
  const authResult = await getUserAccount(supabase);

  if (authResult.error || !authResult.userId) {
    return NextResponse.json(
      { error: authResult.error || 'Authentication required' },
      { status: authResult.status || 401 }
    );
  }

  const userId = authResult.userId;

  try {
    // Begin transaction manually (ideally would use supabase functions for this)
    // Check if like exists
    const { data: existingLike, error: checkError } = await supabase
      .from('plot_likes')
      .select('*')
      .eq('plot_id', plotId)
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    // Toggle like status
    if (existingLike) {
      // Unlike: Remove the like
      const { error: unlikeError } = await supabase
        .from('plot_likes')
        .delete()
        .eq('plot_id', plotId)
        .eq('user_id', userId);

      if (unlikeError) throw unlikeError;

      // Decrement like count
      const { error: updateError } = await supabase.rpc('decrement_plot_likes', { p_plot_id: plotId });
      if (updateError) throw updateError;
    } else {
      // Like: Add a new like
      const { error: likeError } = await supabase
        .from('plot_likes')
        .insert({ plot_id: plotId, user_id: userId });

      if (likeError) throw likeError;

      // Increment like count
      const { error: updateError } = await supabase.rpc('increment_plot_likes', { p_plot_id: plotId });
      if (updateError) throw updateError;
    }

    // Get updated like count
    const { data: plot, error: plotError } = await supabase
      .from('plots')
      .select('likes_count')
      .eq('id', plotId)
      .single();

    if (plotError) throw plotError;

    return NextResponse.json({
      liked: !existingLike,
      likesCount: plot.likes_count
    });
  } catch (error: any) {
    logger.error('Error toggling like:', { message: error.message, plotId, userId });
    return NextResponse.json(
      { error: error.message || 'Failed to toggle like' },
      { status: 500 }
    );
  }
}