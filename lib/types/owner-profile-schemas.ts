// lib/types/owner-profile-schemas.ts
import * as z from 'zod';

// Enhanced owner profile schema
export const OwnerProfileSchema = z.object({
  id: z.string().uuid(),
  name: z.string().nullable(),
  email: z.string().email().nullable(),
  avatarUrl: z.string().url().nullable(),
  level: z.number().int().min(1).default(1),
  bio: z.string().nullable(),
  socialLinks: z.object({
    website: z.string().url().nullable().optional(),
    websites: z.array(z.string().url()).default([]).optional(),
    twitter: z.string().nullable().optional(),
    twitterHandles: z.array(z.string()).default([]).optional(),
    github: z.string().nullable().optional(),
    linkedin: z.string().url().nullable().optional(),
    facebook: z.string().url().nullable().optional(),
    instagram: z.string().url().nullable().optional(),
    youtube: z.string().url().nullable().optional(),
  }).default({}),
  rawUserMetaData: z.any().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type OwnerProfile = z.infer<typeof OwnerProfileSchema>;