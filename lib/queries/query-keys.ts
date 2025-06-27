// lib/queries/query-keys.ts
export const plotKeys = {
  all: ['plots'] as const,
  lists: () => [...plotKeys.all, 'list'] as const,

  // Updated 'available' and 'availableLists' as per your request
  available: () => [...plotKeys.all, 'available'] as const,
  availableLists: () => [...plotKeys.all, 'available'] as const, // Kept for backward compatibility, resolves to the same key as 'available'

  detail: (id: string | null | undefined) => [...plotKeys.all, 'detail', id] as const, // Allowing null/undefined for consistency with hook usage

  // Modified userPlot to include accountId for dynamic key generation
  userPlot: (accountId: string | null | undefined) => [...plotKeys.all, 'user', accountId] as const,

  byMap: (mapId: string) => [...plotKeys.all, 'byMap', mapId] as const,

  // New keys for plot transactions and adjacent plots
  transactions: (plotId: string) => [...plotKeys.all, 'transactions', plotId] as const,
  adjacent: (plotId: string) => [...plotKeys.all, 'adjacent', plotId] as const,
  
  // Key for user plot sets (groups of adjacent plots)
  userPlotSets: (accountId: string | null | undefined) => [...plotKeys.all, 'userPlotSets', accountId] as const,
};

export const mapKeys = {
  all: ['maps'] as const,
  lists: () => [...mapKeys.all, 'list'] as const,
  detail: (id: string) => [...mapKeys.all, 'detail', id] as const,
  active: () => [...mapKeys.all, 'active'] as const,
};

/**
 * Query keys for user-related queries
 */
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  detail: (id: string) => [...userKeys.all, 'detail', id] as const,
  current: () => [...userKeys.all, 'current'] as const,
};

/**
 * Query keys for community-related queries
 */
export const communityKeys = {
  all: ['community'] as const,
  stats: () => [...communityKeys.all, 'stats'] as const,
  activities: () => [...communityKeys.all, 'activities'] as const,
  plots: () => [...communityKeys.all, 'plots'] as const,
  maps: () => [...communityKeys.all, 'maps'] as const,
  activeMap: () => [...communityKeys.all, 'activeMap'] as const,
  publicUrl: (mapId: string) => [...communityKeys.all, 'publicUrl', mapId] as const,
  plotTypes: () => [...communityKeys.all, 'plotTypes'] as const,
};
