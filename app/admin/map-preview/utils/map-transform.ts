// lib/utils/map-transform.ts

import type { MapItem as FullMapItem, MapData as FullMapData } from '@/lib/types/map-schemas'; // Use the full types

/**
 * Transforms the admin-created map data to be compatible with the Neighborhood component
 * This function converts generic shapes and objects to specific neighborhood types
 */
export function transformMapToNeighborhood(mapData: FullMapData): FullMapData {
  if (!mapData || !mapData.items) {
    console.warn("transformMapToNeighborhood: mapData or mapData.items is undefined");
    return mapData; // Or return a default empty map structure
  }

  return {
    ...mapData, // Spread all mapData properties, including layers, width, height etc.
    items: mapData.items.map(transformItem)
  };
}

/**
 * Transform a single map item to a neighborhood-compatible format
 */
function transformItem(item: FullMapItem): FullMapItem {
  // Create a new item with the same base properties
  const transformedItem: FullMapItem = { ...item };

  // Based on the shape and category, determine the appropriate neighborhood type
  switch (item.category) {
    case 'PLOT':
      switch (item.type) {
        case 'rectangle':
          transformedItem.type = 'plot-standard';
          break;
        case 'hexagon':
          transformedItem.type = 'plot-premium';
          break;
        default:
          transformedItem.type = 'plot-standard';
      }
      break;

    case 'BUILDING':
      switch (item.type) {
        case 'rectangle':
          // Determine which building type based on location or properties
          if (item.properties?.buildingType) {
            transformedItem.type = `building-${item.properties.buildingType}`;
          } else {
            // Default to community center if no specific type
            transformedItem.type = 'building-community-center';
          }
          break;
        default:
          transformedItem.type = 'building-community-center';
      }
      break;

    case 'DECORATIVE':
      switch (item.type) {
        case 'triangle':
          transformedItem.type = 'decorative-tree-pine';
          break;
        case 'circle':
          // Randomly choose between decorative objects for circles
          const decorativeTypes = [
            'decorative-mailbox',
            'decorative-bench',
            'decorative-lamp',
            'decorative-billboard',
            'decorative-robot-pet'
          ];
          const randomIndex = Math.floor(Math.random() * decorativeTypes.length);
          transformedItem.type = decorativeTypes[randomIndex];
          break;
        default:
          transformedItem.type = 'decorative-tree-pine';
      }
      break;

    case 'STREET':
      switch (item.type) {
        case 'path':
          transformedItem.type = 'street-path';
          break;
        case 'rectangle':
          // Determine if it's a main or secondary street based on size or properties
          if (item.scale > 1.2) {
            transformedItem.type = 'street-main';
          } else {
            transformedItem.type = 'street-secondary';
          }
          break;
        default:
          transformedItem.type = 'street-secondary';
      }
      break;

    case 'GROUND':
      switch (item.type) {
        case 'rectangle':
          transformedItem.type = 'ground-grass';
          break;
        case 'circle':
          transformedItem.type = 'ground-water';
          break;
        case 'hexagon':
          transformedItem.type = 'ground-park';
          break;
        default:
          transformedItem.type = 'ground-grass';
      }
      break;

    default:
      // For any other categories, keep the original type
      break;
  }

  return transformedItem;
}

// Define the unit size ratio between neighborhood and map editor
const UNIT_SIZE_NEIGHBORHOOD = 1; // This should match the value used in NeighborhoodModePreview.tsx

/**
 * Helper function to convert map coordinates to neighborhood coordinates
 * In the neighborhood, the origin is at the center, while in the map editor
 * the origin is at the top-left corner
 */
export function convertMapToNeighborhoodCoordinates(
  mapData: FullMapData
): FullMapData {
  if (!mapData || !mapData.items || typeof mapData.width !== 'number' || typeof mapData.height !== 'number') {
    console.warn("convertMapToNeighborhoodCoordinates: mapData or essential properties missing");
    return mapData;
  }

  const centerX = mapData.width / 2;
  const centerY = mapData.height / 2;

  return {
    ...mapData,
    items: mapData.items.map(item => {
      const itemWidth = item.width || 1;
      const itemHeight = item.height || 1;

      // Calculate the center point of the item in the original coordinates
      const itemCenterX = item.x + (itemWidth / 2);
      const itemCenterY = item.y + (itemHeight / 2);

      // Convert from absolute position to position relative to map center
      const relativeX = itemCenterX - centerX;
      const relativeY = itemCenterY - centerY;

      return {
        ...item,
        // Store the centered coordinates
        x: relativeX,
        y: relativeY,
        // Preserve original dimensions
        width: itemWidth,
        height: itemHeight,
      };
    })
  };
}

/**
 * Helper function to get all unique item types from a map
 * Useful for debugging and development
 */
export function getUniqueItemTypes(mapData: FullMapData): string[] {
  if (!mapData || !mapData.items) {
    return [];
  }
  const types = new Set<string>();
  mapData.items.forEach(item => types.add(item.type));
  return Array.from(types);
}

// Add this function near the top of your component file or inside the component
export function calculateZLevelOffset(itemType: string, itemCategory: string): number {
  // Extract the category and specific type
  const category = itemCategory.toLowerCase();
  const type = itemType.toLowerCase();

  // Apply specific offsets based on category and type
  switch (category) {
    case 'ground':
      if (
        type.includes('sand') ||
        type.includes('dirt')
      ) {
        return 0.30; // Slightly above ground
      }
      else if (        type.includes('park')) {
        return 0.30; // Above ground
      }
      else if (        type.includes('water')) {
        return 0.50; // Above ground
      }
      else if (type.includes('grass')) {
        return 0.05; // Just above ground
      }
      return 0.00; // Base level

    case 'street':
      if (
        type.includes('junction') ||
        type.includes('roundabout') ||
        type.includes('path') ||
        type.includes('bridge') ||
        type.includes('parking-lot')
      ) {
        return 0.56; // Slightly above ground
      }
      return 0.50; // Just above ground

    case 'plot':
      return 0.50; // Above street

    case 'building':
      return 0.50; // Above plot

    case 'house':
      return 0.50; // Above plot

    case 'landmark':
      return 0.50; // Above plot

    case 'decorative':
      if (type.includes('tree')) {
        return 0.50; // Trees slightly above other decorative items
      }
      return 0.50; // Above building base

    default:
      return 0.50; // Unknown items at highest level
  }
}