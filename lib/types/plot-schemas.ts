// lib/types/plot-schemas.ts
import { z } from 'zod';
import { HouseType } from '@/lib/types';
import { Database } from './database.types';
import { CamelCaseKeys } from '../utils/case-converters';

// =========================================================
// Plot schemas
// =========================================================

export const PlotSchema = z.object({
  id: z.string().uuid(),
  name: z.string().nullable(),
  position: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number()
  }),
  ownerId: z.string().uuid().nullable(),
  plotSetId: z.string().uuid().nullable(),
  houseType: z.string().nullable(),
  houseColor: z.string().nullable(),
  likesCount: z.number().default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().uuid().nullable(),
  updatedBy: z.string().uuid().nullable(),
  deletedAt: z.string().datetime().nullable(),
  deletedBy: z.string().uuid().nullable()
});

export const CreatePlotSchema = z.object({
  name: z.string().optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number()
  }),
  houseType: z.enum(['type1', 'type2', 'type3', 'type4', 'type5'] as [HouseType, ...HouseType[]]).optional(),
  houseColor: z.string().optional()
});

export const UpdatePlotSchema = CreatePlotSchema.partial();

export const PlotPurchaseSchema = z.object({
  plotIds: z.array(z.string().uuid()).min(1).max(4),
  houseType: z.enum(['type1', 'type2', 'type3', 'type4', 'type5'] as [HouseType, ...HouseType[]]),
  houseColor: z.string(),

   websiteUrl: z.string().url().optional().or(z.literal('')),
  websiteTitle: z.string().max(100).optional().or(z.literal('')),
  websiteDescription: z.string().max(200).optional().or(z.literal('')),
  twitterHandle: z.string().max(50).optional().or(z.literal('')),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  githubUsername: z.string().max(50).optional().or(z.literal('')),
});

// =========================================================
// Type exports
// =========================================================

export type Plot = z.infer<typeof PlotSchema>;
export type CreatePlotInput = z.infer<typeof CreatePlotSchema>;
export type UpdatePlotInput = z.infer<typeof UpdatePlotSchema>;
export type PlotPurchaseInput = z.infer<typeof PlotPurchaseSchema>;
export type PlotSet = z.infer<typeof PlotSetSchema>;
export type PlotTransaction = z.infer<typeof PlotTransactionSchema>;
export type PlotSaleInput = z.infer<typeof PlotSaleSchema>;

// =========================================================
// Cache tags for revalidation
// =========================================================

// Plot set schemas
export const PlotSetSchema = z.object({
  id: z.string().uuid(),
  name: z.string().nullable(),
  ownerId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().uuid().nullable(),
  updatedBy: z.string().uuid().nullable(),
  deletedAt: z.string().datetime().nullable(),
  deletedBy: z.string().uuid().nullable()
});

// Plot transaction schemas
export const PlotTransactionSchema = z.object({
  id: z.string().uuid(),
  plotId: z.string().uuid(),
  transactionType: z.enum(['purchase', 'sale']),
  previousOwnerId: z.string().uuid().nullable(),
  newOwnerId: z.string().uuid().nullable(),
  price: z.number().optional(),
  transactionDate: z.string().datetime(),
  userId: z.string().uuid().nullable()
});

// Plot sale schema
export const PlotSaleSchema = z.object({
  plotId: z.string().uuid()
});

export const CACHE_TAGS = {
  PLOTS: 'plots',
  PLOT: (id: string) => `plot-${id}`,
  USER_PLOTS: (userId: string) => `user-plots-${userId}`,
  USER_PLOT_SETS: (userId: string) => `user-plot-sets-${userId}`,
  AVAILABLE_PLOTS: 'available-plots',
  PLOT_TRANSACTIONS: 'plot-transactions',
  PLOT_TRANSACTION: (id: string) => `plot-transaction-${id}`,
  ADJACENT_PLOTS: (plotId: string) => `adjacent-plots-${plotId}`
} as const;

