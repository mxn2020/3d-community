// app/sitemap.ts - Generate sitemap for SEO
import { MetadataRoute } from 'next';
import { createSupabaseServerClient } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get all accounts that have profiles for sitemap
    const { data: accounts } = await supabase
      .from('accounts')
      .select('id, updated_at')
      .is('deleted_at', null)
      .limit(1000); // Limit to prevent huge sitemaps

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://happy-house.casa';
    
    const profileUrls = accounts?.map((account) => ({
      url: `${baseUrl}/profile/${account.id}`,
      lastModified: account.updated_at ? new Date(account.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })) || [];

    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
      {
        url: `${baseUrl}/community`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
      ...profileUrls,
    ];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    
    // Return basic sitemap if there's an error
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://happy-house.casa';
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
    ];
  }
}
