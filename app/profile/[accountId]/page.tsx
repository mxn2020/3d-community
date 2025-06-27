// app/profile/[accountId]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/db';
import { OwnerProfileService } from '@/lib/services/owner-profile-service';
import PublicProfilePage from '@/components/profile/PublicProfilePage';
import { OwnerProfile } from '@/lib/types/owner-profile-schemas';

interface Props {
  params: Promise<{
    accountId: string;
  }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { accountId } = await params;

  if (!accountId) {
    return {
      title: 'Profile - Futurama Community',
      description: 'Community member profile',
    };
  }

  try {
    const supabase = await createSupabaseAdminClient();
    const ownerProfileService = new OwnerProfileService(supabase);
    const profile = await ownerProfileService.getOwnerProfile(accountId);

    if (!profile) {
      return {
        title: 'Profile Not Found - Futurama Community',
        description: 'The requested profile could not be found.',
      };
    }

    return {
      title: `${profile.name || 'Community Member'} - Futurama Community`,
      description: profile.bio || `${profile.name || 'Community member'} is part of the Futurama Community. Explore their profile and connect with them.`,
      openGraph: {
        title: `${profile.name || 'Community Member'} - Futurama Community`,
        description: profile.bio || `${profile.name || 'Community member'} is part of the Futurama Community.`,
        images: profile.avatarUrl ? [{ url: profile.avatarUrl }] : [],
        type: 'profile',
      },
      twitter: {
        card: 'summary',
        title: `${profile.name || 'Community Member'} - Futurama Community`,
        description: profile.bio || `${profile.name || 'Community member'} is part of the Futurama Community.`,
        images: profile.avatarUrl ? [profile.avatarUrl] : [],
      },
    };
  } catch {
    return {
      title: 'Profile - Futurama Community',
      description: 'Community member profile',
    };
  }
}

export default async function ProfilePage({ params }: Props) {
  const { accountId } = await params;

  if (!accountId) {
    notFound();
  }

  try {
    const supabase = await createSupabaseAdminClient();
    const ownerProfileService = new OwnerProfileService(supabase);
    const profile = await ownerProfileService.getOwnerProfile(accountId);

    if (!profile) {
      notFound();
    }

    return <PublicProfilePage profile={profile} />;
  } catch (error) {
    console.error('Error loading profile:', error);
    notFound();
  }
}

