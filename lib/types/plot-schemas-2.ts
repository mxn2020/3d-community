// lib/types/plot-schemas.ts

// Type definition for plot data
export interface Plot {
  id: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  ownerId?: string; // Will be undefined/null for available plots
  houseType?: string;
  houseColor?: string;
  createdAt: Date;
  updatedAt: Date;
  // Additional metadata
  gridPosition: {
    squareX: number;
    squareY: number;
    plotIndex: number; // 0-3 for regular squares, 0-1 for special row
  };
  price: number;
  type: 'standard' | 'premium' | 'commercial';
}

// Type definitions for the house
export type HouseType = 'type1' | 'type2' | 'type3' | 'type4' | 'type5';

export interface HouseConfig {
  type: HouseType;
  color: string;
  customizations?: {
    roofStyle?: string;
    windowStyle?: string;
    doorStyle?: string;
    gardenStyle?: string;
  };
}

// Map configuration types
export interface MapItem {
  id: string;
  type: string;
  x: number;
  y: number;
  [key: string]: any; // Additional properties based on the type
}

export interface MapConfig {
  id: string;
  name: string;
  description: string;
  version: string;
  items: MapItem[];
  meta: {
    totalPlots: number;
    gridSize: {
      rows: number;
      columns: number;
    };
    squareSize: number;
    specialRow: number;
  };
}

// District types
export type DistrictType = 
  | 'residential'
  | 'commercial'
  | 'entertainment'
  | 'tech'
  | 'academic'
  | 'nature'
  | 'community'
  | 'special';

export interface District {
  id: string;
  name: string;
  type: DistrictType;
  description: string;
  boundaries: {
    // Inclusive grid coordinates that define the district
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
  themeColor: string;
  specialFeatures: string[];
}

// Plot purchase types
export interface PlotPurchaseRequest {
  plotId: string;
  userId: string;
  houseConfig: HouseConfig;
}

export interface PlotPurchaseResponse {
  success: boolean;
  message: string;
  plot?: Plot;
  error?: string;
}

// User types related to plot ownership
export interface UserPlotPreferences {
  preferredDistricts: DistrictType[];
  preferredHouseTypes: HouseType[];
  maxPrice: number;
}

export interface PlotFilters {
  districts?: DistrictType[];
  priceRange?: {
    min: number;
    max: number;
  };
  availability?: boolean;
  types?: ('standard' | 'premium' | 'commercial')[];
  nearFeatures?: string[]; // E.g., 'park', 'river', 'community center'
}

// Square types for the modular grid
export interface MapSquare {
  id: string;
  gridX: number;
  gridY: number;
  type: 'regular' | 'special';
  centerPosition: [number, number, number];
  plots: {
    id: string;
    position: [number, number, number];
    index: number;
  }[];
  features: {
    id: string;
    type: string;
    position: [number, number, number];
  }[];
}

// Generation helpers
export interface MapGenerationOptions {
  totalRows: number;
  totalColumns: number;
  specialRowIndex: number;
  squareSize: number;
  riverEnabled: boolean;
  riverWidth: number;
  riverCurve: number; // 0-1 value indicating how much the river curves
  districts: {
    [key in DistrictType]?: {
      enabled: boolean;
      size: number; // Relative size (0-1)
    }
  };
  landmarks: {
    centralPark: boolean;
    mountains: boolean;
    river: boolean;
    lake: boolean;
  };
  streetPattern: 'grid' | 'radial' | 'organic' | 'mixed';
}

export default Plot;
