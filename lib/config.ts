/**
 * Futurama Community Configuration
 * Centralized configuration file for the Futurama Community mapping application
 */

// =============================================================================
// CORE SETTINGS
// =============================================================================

export const UNIT_SIZE = 1;
export const DEFAULT_ITEM_COLOR = '#999999';

// =============================================================================
// MAP CONFIGURATION
// =============================================================================

export const MAP_CONFIG = {
  // Grid settings
  SQUARE_SIZE: 30,
  TOTAL_ROWS: 11,
  TOTAL_COLUMNS: 10,
  SPECIAL_ROW: 5, // Middle row (0-indexed)
  
  // Camera settings
  DEFAULT_CAMERA_POSITION: [0, 50, 50] as const,
  DEFAULT_CAMERA_TARGET: [0, 0, 0] as const,
  
  // Performance settings
  MAX_RENDER_DISTANCE: 200,
  LOD_DISTANCES: {
    HIGH: 50,
    MEDIUM: 100,
    LOW: 150
  }
} as const;

// =============================================================================
// ITEM CATEGORIES
// =============================================================================

export const ITEM_CATEGORIES = {
  PLOT: 'plot',
  BUILDING: 'building',
  LANDMARK: 'landmark',
  DECORATIVE: 'decorative',
  STREET: 'street',
  GROUND: 'ground',
} as const;

// =============================================================================
// ITEM TYPES
// =============================================================================

export const ITEM_TYPES = {
  // Plot types
  PLOT_STANDARD: 'plot-standard',
  PLOT_PREMIUM: 'plot-premium',
  PLOT_COMMERCIAL: 'plot-commercial',
  PLOT_RESIDENTIAL: 'plot-residential',
  PLOT_SPECIAL: 'plot-special',
  
  // Ground types
  GROUND_GRASS: 'ground-grass',
  GROUND_WATER: 'ground-water',
  GROUND_SAND: 'ground-sand',
  GROUND_PARK: 'ground-park',
  GROUND_DIRT: 'ground-dirt',
  GROUND_SNOW: 'ground-snow',
  GROUND_LAVA: 'ground-lava',
  GROUND_TOXIC: 'ground-toxic',
  GROUND_STREET: 'ground-street',
  
  // Street types
  STREET_MAIN: 'street-main',
  STREET_SECONDARY: 'street-secondary',
  STREET_DIAGONAL: 'street-diagonal',
  STREET_PATH: 'street-path',
  STREET_ROUNDED: 'street-rounded',
  STREET_ELLIPSE: 'street-ellipse',
  STREET_ROUNDABOUT: 'street-roundabout',
  STREET_JUNCTION: 'street-junction',
  STREET_PARKING_LOT: 'street-parking-lot',
  STREET_SIDEWALK: 'street-sidewalk',
  
  // Building types
  BUILDING_COMMUNITY_CENTER: 'building-community-center',
  BUILDING_DIRECTORY: 'building-directory',
  BUILDING_FEEDBACK: 'building-feedback',
  BUILDING_PLANET_EXPRESS: 'building-planet-express',
  
  // Decorative types
  DECORATIVE_TREE_PINE: 'decorative-tree-pine',
  DECORATIVE_TREE_MUSHROOM: 'decorative-tree-mushroom',
  DECORATIVE_TREE_CRYSTAL: 'decorative-tree-crystal',
  DECORATIVE_TREE_FLOATING: 'decorative-tree-floating',
  DECORATIVE_TREE_BONSAI: 'decorative-tree-bonsai',
  DECORATIVE_TREE_TREE: 'decorative-tree-tree',
  DECORATIVE_TREE_FOREST: 'decorative-tree-forest',
  DECORATIVE_MAILBOX: 'decorative-mailbox',
  DECORATIVE_BENCH: 'decorative-bench',
  DECORATIVE_LAMP: 'decorative-lamp',
  DECORATIVE_BILLBOARD: 'decorative-billboard',
  DECORATIVE_ROBOT_PET: 'decorative-robot-pet',
  
  // Landmark types
  LANDMARK_CENTRAL_PARK: 'landmark-central-park',
  LANDMARK_FUTURAMA_MONUMENT: 'landmark-futurama-monument',
  LANDMARK_MOUNTAIN: 'landmark-mountain',
  LANDMARK_MOUNTAIN_WITH_WATERFALL: 'landmark-mountain-with-waterfall',
  LANDMARK_RIVER_WALKWAY: 'landmark-river-walkway',
  LANDMARK_TRANSPORT_TUBE: 'landmark-transport-tube',
  LANDMARK_DONUT_STATUE: 'landmark-donut-statue',
  LANDMARK_VAPORATOR: 'landmark-vaporator',
  LANDMARK_ENERGY_CUBE: 'landmark-energy-cube',
  LANDMARK_ARCADE: 'landmark-arcade',
  LANDMARK_FLOATING_ISLAND: 'landmark-floating-island',
  LANDMARK_DINER: 'landmark-diner',
  LANDMARK_OBSERVATORY: 'landmark-observatory',
  LANDMARK_CLOCK_TOWER: 'landmark-clock-tower',
  LANDMARK_SPACE_STATION: 'landmark-space-station',
  LANDMARK_FESTIVAL_AREA: 'landmark-festival-area',
  LANDMARK_FARMERS_MARKET: 'landmark-farmers-market',
  LANDMARK_LIBRARY: 'landmark-library',
  LANDMARK_TREEHOUSE: 'landmark-treehouse',
} as const;

// =============================================================================
// COLOR CONFIGURATION
// =============================================================================

export const COLORS = {
  // Default colors
  DEFAULT: DEFAULT_ITEM_COLOR,
  
  // Plot colors
  PLOT_STANDARD: '#d5e8d4',
  PLOT_PREMIUM: '#b5e7a0',
  PLOT_COMMERCIAL: '#e1d5e7',
  PLOT_RESIDENTIAL: '#a0c4ff',
  PLOT_SPECIAL: '#ffd6a5',
  
  // Ground colors
  GROUND_GRASS: '#8CC084',
  GROUND_WATER: '#5da9e9',
  GROUND_SAND: '#e6d2b5',
  GROUND_PARK: '#7FB069',
  GROUND_DIRT: '#8B4513',
  GROUND_SNOW: '#FFFAFA',
  GROUND_LAVA: '#FF4500',
  GROUND_TOXIC: '#ADFF2F',
  GROUND_STREET: '#AAAAAA',
  
  // Street colors
  STREET_MAIN: '#555555',
  STREET_SECONDARY: '#777777',
  STREET_PATH: '#999999',
  STREET_PARKING_LOT: '#696969',
  STREET_SIDEWALK: '#C0C0C0',
  
  // Building colors
  BUILDING_COMMUNITY_CENTER: '#4ECDC4',
  BUILDING_DIRECTORY: '#FF6B6B',
  BUILDING_FEEDBACK: '#C7B3E5',
  BUILDING_PLANET_EXPRESS: '#FF9F40',
  
  // Decorative colors
  TREE_PINE: '#2d6a4f',
  TREE_MUSHROOM: '#d8315b',
  TREE_CRYSTAL: '#9896f1',
  TREE_FLOATING: '#70d6ff',
  TREE_BONSAI: '#48bfe3',
  TREE_TREE: '#40916c',
  TREE_FOREST: '#52b788',
  DECORATIVE_MAILBOX: '#CD5C5C',
  DECORATIVE_BENCH: '#A0522D',
  DECORATIVE_LAMP: '#FFD700',
  DECORATIVE_BILLBOARD: '#FF69B4',
  DECORATIVE_ROBOT_PET: '#32CD32',
  
  // Landmark colors
  LANDMARK_CENTRAL_PARK: '#8CC084',
  LANDMARK_MONUMENT: '#FFD700',
  LANDMARK_MOUNTAIN: '#8B7355',
  LANDMARK_WATER_FEATURE: '#1e88e5',
  LANDMARK_SPECIAL: '#FF6B35',
} as const;

// =============================================================================
// ITEM TYPE DEFAULT COLORS (Legacy support)
// =============================================================================

export const ITEM_TYPE_DEFAULT_COLORS: { [key: string]: string } = {
  // Plots
  [ITEM_TYPES.PLOT_RESIDENTIAL]: COLORS.PLOT_RESIDENTIAL,
  [ITEM_TYPES.PLOT_COMMERCIAL]: COLORS.PLOT_COMMERCIAL,
  [ITEM_TYPES.PLOT_SPECIAL]: COLORS.PLOT_SPECIAL,
  [ITEM_TYPES.PLOT_STANDARD]: COLORS.PLOT_STANDARD,
  [ITEM_TYPES.PLOT_PREMIUM]: COLORS.PLOT_PREMIUM,
  
  // Ground
  [ITEM_TYPES.GROUND_GRASS]: COLORS.GROUND_GRASS,
  [ITEM_TYPES.GROUND_WATER]: COLORS.GROUND_WATER,
  [ITEM_TYPES.GROUND_SAND]: COLORS.GROUND_SAND,
  [ITEM_TYPES.GROUND_PARK]: COLORS.GROUND_PARK,
  [ITEM_TYPES.GROUND_STREET]: COLORS.GROUND_STREET,
  
  // Streets
  [ITEM_TYPES.STREET_MAIN]: COLORS.STREET_MAIN,
  [ITEM_TYPES.STREET_SECONDARY]: COLORS.STREET_SECONDARY,
  [ITEM_TYPES.STREET_PATH]: COLORS.STREET_PATH,
  [ITEM_TYPES.STREET_PARKING_LOT]: COLORS.STREET_PARKING_LOT,
  [ITEM_TYPES.STREET_SIDEWALK]: COLORS.STREET_SIDEWALK,
  
  // Buildings
  [ITEM_TYPES.BUILDING_COMMUNITY_CENTER]: COLORS.BUILDING_COMMUNITY_CENTER,
  [ITEM_TYPES.BUILDING_DIRECTORY]: COLORS.BUILDING_DIRECTORY,
  [ITEM_TYPES.BUILDING_FEEDBACK]: COLORS.BUILDING_FEEDBACK,
  [ITEM_TYPES.BUILDING_PLANET_EXPRESS]: COLORS.BUILDING_PLANET_EXPRESS,
  
  // Decorative trees
  [ITEM_TYPES.DECORATIVE_TREE_PINE]: COLORS.TREE_PINE,
  [ITEM_TYPES.DECORATIVE_TREE_MUSHROOM]: COLORS.TREE_MUSHROOM,
  [ITEM_TYPES.DECORATIVE_TREE_CRYSTAL]: COLORS.TREE_CRYSTAL,
  [ITEM_TYPES.DECORATIVE_TREE_FLOATING]: COLORS.TREE_FLOATING,
  [ITEM_TYPES.DECORATIVE_TREE_BONSAI]: COLORS.TREE_BONSAI,
  [ITEM_TYPES.DECORATIVE_TREE_TREE]: COLORS.TREE_TREE,
  [ITEM_TYPES.DECORATIVE_TREE_FOREST]: COLORS.TREE_FOREST,
  
  // Other decorative items
  [ITEM_TYPES.DECORATIVE_MAILBOX]: COLORS.DECORATIVE_MAILBOX,
  [ITEM_TYPES.DECORATIVE_BENCH]: COLORS.DECORATIVE_BENCH,
  [ITEM_TYPES.DECORATIVE_LAMP]: COLORS.DECORATIVE_LAMP,
  [ITEM_TYPES.DECORATIVE_BILLBOARD]: COLORS.DECORATIVE_BILLBOARD,
  [ITEM_TYPES.DECORATIVE_ROBOT_PET]: COLORS.DECORATIVE_ROBOT_PET,
  
  // Landmarks
  [ITEM_TYPES.LANDMARK_CENTRAL_PARK]: COLORS.LANDMARK_CENTRAL_PARK,
  [ITEM_TYPES.LANDMARK_MOUNTAIN_WITH_WATERFALL]: COLORS.LANDMARK_MONUMENT,
  [ITEM_TYPES.LANDMARK_MOUNTAIN]: COLORS.LANDMARK_MOUNTAIN,
};

// =============================================================================
// ITEM DEFINITIONS
// =============================================================================

export interface ItemDefinition {
  id: string;
  name: string;
  category: string;
  color: string;
  defaultWidth?: number;
  defaultHeight?: number;
  elevationOffset?: number;
  description?: string;
}

export const ITEM_DEFINITIONS: Record<string, ItemDefinition> = {
  // Plots
  [ITEM_TYPES.PLOT_STANDARD]: {
    id: ITEM_TYPES.PLOT_STANDARD,
    name: 'Standard Plot',
    category: ITEM_CATEGORIES.PLOT,
    color: COLORS.PLOT_STANDARD,
    defaultWidth: 10,
    defaultHeight: 10,
    description: 'A standard residential plot for community members'
  },
  [ITEM_TYPES.PLOT_PREMIUM]: {
    id: ITEM_TYPES.PLOT_PREMIUM,
    name: 'Premium Plot',
    category: ITEM_CATEGORIES.PLOT,
    color: COLORS.PLOT_PREMIUM,
    defaultWidth: 15,
    defaultHeight: 10,
    description: 'A larger premium plot with additional features'
  },
  [ITEM_TYPES.PLOT_COMMERCIAL]: {
    id: ITEM_TYPES.PLOT_COMMERCIAL,
    name: 'Commercial Plot',
    category: ITEM_CATEGORIES.PLOT,
    color: COLORS.PLOT_COMMERCIAL,
    defaultWidth: 20,
    defaultHeight: 15,
    description: 'A commercial plot for businesses and services'
  },
  
  // Ground elements
  [ITEM_TYPES.GROUND_GRASS]: {
    id: ITEM_TYPES.GROUND_GRASS,
    name: 'Grass',
    category: ITEM_CATEGORIES.GROUND,
    color: COLORS.GROUND_GRASS,
    defaultWidth: 5,
    defaultHeight: 5,
    elevationOffset: 0.00,
    description: 'Natural grass ground covering'
  },
  [ITEM_TYPES.GROUND_WATER]: {
    id: ITEM_TYPES.GROUND_WATER,
    name: 'Water',
    category: ITEM_CATEGORIES.GROUND,
    color: COLORS.GROUND_WATER,
    defaultWidth: 10,
    defaultHeight: 10,
    elevationOffset: 0.04,
    description: 'Water feature or lake'
  },
  
  // Streets
  [ITEM_TYPES.STREET_MAIN]: {
    id: ITEM_TYPES.STREET_MAIN,
    name: 'Main Street',
    category: ITEM_CATEGORIES.STREET,
    color: COLORS.STREET_MAIN,
    defaultWidth: 6,
    defaultHeight: 30,
    elevationOffset: 0.01,
    description: 'Primary street for major traffic'
  },
  
  // Buildings
  [ITEM_TYPES.BUILDING_COMMUNITY_CENTER]: {
    id: ITEM_TYPES.BUILDING_COMMUNITY_CENTER,
    name: 'Community Center',
    category: ITEM_CATEGORIES.BUILDING,
    color: COLORS.BUILDING_COMMUNITY_CENTER,
    defaultWidth: 8,
    defaultHeight: 6,
    description: 'Central hub for community activities'
  },
  
  // Landmarks
  [ITEM_TYPES.LANDMARK_CENTRAL_PARK]: {
    id: ITEM_TYPES.LANDMARK_CENTRAL_PARK,
    name: 'Central Park',
    category: ITEM_CATEGORIES.LANDMARK,
    color: COLORS.LANDMARK_CENTRAL_PARK,
    defaultWidth: 20,
    defaultHeight: 15,
    description: 'Large central park for recreation'
  },
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get the color for an item type
 */
export function getItemColor(itemType: string): string {
  return ITEM_TYPE_DEFAULT_COLORS[itemType] || COLORS.DEFAULT;
}

/**
 * Get item definition by type
 */
export function getItemDefinition(itemType: string): ItemDefinition | undefined {
  return ITEM_DEFINITIONS[itemType];
}

/**
 * Get all items by category
 */
export function getItemsByCategory(category: string): ItemDefinition[] {
  return Object.values(ITEM_DEFINITIONS).filter(item => item.category === category);
}

/**
 * Check if an item type exists
 */
export function isValidItemType(itemType: string): boolean {
  return itemType in ITEM_TYPE_DEFAULT_COLORS;
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type ItemCategory = typeof ITEM_CATEGORIES[keyof typeof ITEM_CATEGORIES];
export type ItemType = typeof ITEM_TYPES[keyof typeof ITEM_TYPES];
export type ColorKey = keyof typeof COLORS;