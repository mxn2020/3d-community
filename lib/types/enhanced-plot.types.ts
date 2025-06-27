// lib/types/enhanced-plot.types.ts
import type { HouseType } from '@/lib/types';
import type { Plot } from '@/lib/types/plot-schemas';
import type { OwnerProfile } from '@/lib/types/owner-profile-schemas';

export interface EnhancedPlotData {
  // Plot identification
  id: string;
  plotId: string; // Same as id for compatibility
  
  // Plot state from database
  ownerId: string;
  isOwned: boolean;
  
  houseType: HouseType;
  houseColor: string;
  likesCount: number;
  purchaseDate: string | null;
  
  // Map item properties (from community map)
  mapPosition: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  rotation: number; // Plot's facing direction in degrees
  facingDirection: number; // Alias for rotation
  scale: number;
  color: string;
  layerId: string;
  properties: any;
  
  // 3D world position (calculated)
  worldPosition: [number, number, number];
  
  // Owner profile (loaded when needed)
  ownerProfile?: OwnerProfile | null;
  isProfileLoading?: boolean;
  
  // Status flags
  isUserOwned: boolean;
  isSelected: boolean;
  isHighlighted: boolean;
}