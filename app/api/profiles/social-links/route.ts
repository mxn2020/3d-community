// app/api/profile/social-links/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/db';
import { UpdateSocialLinksSchema } from '@/lib/types/social-links-schemas';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ prefix: '[API /api/profile/social-links]' });

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = UpdateSocialLinksSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: validation.error.errors.map(e => ({ 
            field: e.path.join('.'), 
            message: e.message 
          }))
        },
        { status: 400 }
      );
    }

    const socialLinksData = validation.data;

    // Update the user's metadata with social links
    const { data: updatedUser, error: updateError } = await supabase.auth.updateUser({
      data: {
        social_links: socialLinksData
      }
    });

    if (updateError) {
      logger.error('Error updating user social links:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update social links' },
        { status: 500 }
      );
    }

    // Also update the profiles table if it exists
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        raw_user_meta_data: {
          ...updatedUser.user?.user_metadata,
          social_links: socialLinksData
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (profileUpdateError) {
      logger.warn('Could not update profiles table:', profileUpdateError);
      // Don't fail the request if profiles table update fails
    }

    // Return updated profile data
    const userProfile = {
      id: user.id,
      email: user.email,
      name: updatedUser.user?.user_metadata?.name || null,
      avatarUrl: null, // Would come from separate avatar upload
      theme: updatedUser.user?.user_metadata?.theme || 'system',
      language: updatedUser.user?.user_metadata?.language || 'en',
      timezone: updatedUser.user?.user_metadata?.timezone || 'UTC',
      createdAt: user.created_at,
      socialLinks: socialLinksData,
    };

    logger.debug('Social links updated successfully:', { userId: user.id });

    return NextResponse.json({
      success: true,
      data: userProfile
    });

  } catch (error: any) {
    logger.error('Error in PATCH /api/profile/social-links:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

