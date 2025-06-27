// lib/types/social-links-schemas.ts
import { z } from 'zod';

export const SocialLinksSchema = z.object({
  website: z.string().url().nullable().optional(),
  websites: z.array(z.string().url()).default([]).optional(),
  twitter: z.string().nullable().optional(),
  twitterHandles: z.array(z.string()).default([]).optional(),
  github: z.string().nullable().optional(),
  linkedin: z.string().nullable().optional(),
  instagram: z.string().nullable().optional(),
  youtube: z.string().nullable().optional(),
  tiktok: z.string().nullable().optional(),
  discord: z.string().nullable().optional(),
});

export type SocialLinks = z.infer<typeof SocialLinksSchema>;

export const UpdateSocialLinksSchema = SocialLinksSchema.partial();
export type UpdateSocialLinksInput = z.infer<typeof UpdateSocialLinksSchema>;