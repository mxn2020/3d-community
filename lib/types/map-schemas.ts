import * as z from 'zod';
import { Database } from './database.types';

export type Json<D extends number = 9, DA extends any[] = []> =
    | string
    | number
    | boolean
    | null
    | (D extends DA['length'] ? any : { [key: string]: Json<D, [0, ...DA]> | undefined })
    | (D extends DA['length'] ? any : Json<D, [0, ...DA]>[]);

export const jsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.record(z.string(), jsonSchema),
    z.array(jsonSchema),
  ])
);

// New schema for map layers
export const MapLayerSchema = z.object({
  id: z.string().uuid(), // Unique ID for the layer
  name: z.string(),
  zIndex: z.number(), // Base Z-level for items in this layer
  visible: z.boolean().default(true).optional(),
  // Potentially add other layer-specific properties here, like lock status, type: 'background' | 'standard' etc.
});
export type MapLayer = z.infer<typeof MapLayerSchema>;

// Schema for map environment settings
export const MapEnvironmentSchema = z.object({
  backgroundColor: z.string().default('#DDDDDD').optional(),
  starsIntensity: z.number().min(0).max(1).default(0.5).optional(),
  ambientLightColor: z.string().default('#FFFFFF').optional(),
  ambientLightIntensity: z.number().min(0).max(2).default(0.8).optional(),
  directionalLightColor: z.string().default('#FFFFFF').optional(),
  directionalLightIntensity: z.number().min(0).max(2).default(1).optional(),
  // fog: z.object({
  //   color: z.string().optional(),
  //   near: z.number().optional(),
  //   far: z.number().optional(),
  // }).optional(),
});
export type MapEnvironment = z.infer<typeof MapEnvironmentSchema>;

// Base schema for map items that will be part of the map configuration
export const MapItemSchema = z.object({
  id: z.string(),
  type: z.string(), // e.g., 'plot-standard', 'street-main', 'decorative-tree-pine'
  category: z.string(), // e.g., 'plot', 'street', 'decorative'
  x: z.number(), // X coordinate in map units
  y: z.number(), // Y coordinate in map units
  width: z.number().min(0.1).default(1).optional(), // Width in map units
  height: z.number().min(0.1).default(1).optional(), // Height in map units
  rotation: z.number().default(0).optional(), // Rotation in degrees
  scale: z.number().min(0.1).default(1).optional(), // General scale factor (can be used if width/height are relative)
  color: z.string().optional(), // Override color for the item
  layerId: z.string(), // ID of the layer this item belongs to
  elevationOffset: z.number().default(0).optional(), // Additional Z offset relative to the layer's zIndex
  properties: jsonSchema.optional(), // For custom data like plot name, street material, etc.
});
export type MapItem = z.infer<typeof MapItemSchema>;

// Schema for the entire map data structure
export const MapDataSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string(),
  description: z.string().optional(),
  width: z.number().min(1), // Map width in units
  height: z.number().min(1), // Map height in units
  environment: MapEnvironmentSchema.default({}), // Global environment settings
  layers: z.array(MapLayerSchema).default([ // Default layers
    // Background layer is now primarily for global background color, not for items.
    // Its zIndex should be conceptually lowest.
    { id: crypto.randomUUID(), name: 'Map Background', zIndex: -10, visible: true },
    { id: crypto.randomUUID(), name: 'Ground', zIndex: 0.00, visible: true },
    { id: crypto.randomUUID(), name: 'Streets', zIndex: 0.02, visible: true },
    { id: crypto.randomUUID(), name: 'Water Features', zIndex: 0.04, visible: true },
    { id: crypto.randomUUID(), name: 'Plots', zIndex: 0.08, visible: true },
    { id: crypto.randomUUID(), name: 'Objects & Structures', zIndex: 0.10, visible: true },
  ]),
  items: z.array(MapItemSchema),
});
export type MapData = z.infer<typeof MapDataSchema>;

// Schema for community maps stored in the database
export const CommunityMapSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string(),
  description: z.string().nullable(),
  mapData: MapDataSchema,
  isActive: z.boolean().default(false).nullable(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
export type CommunityMap = z.infer<typeof CommunityMapSchema>;
export type DbCommunityMap = Database['public']['Tables']['community_maps']['Row'];

// Input schema for creating/updating maps
export const SaveMapInputSchema = CommunityMapSchema;
export type SaveMapInput = z.infer<typeof SaveMapInputSchema>;


// Cache tags for revalidation
export const CACHE_TAGS = {
  MAPS: 'maps',
  MAP: (id: string) => `map-${id}`,
  ACTIVE_MAP: 'active-map',
};