// admin/map-preview/components/NeighborhoodModePreview.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Sky, Stars, Text, Plane, Box } from '@react-three/drei';
import { transformMapToNeighborhood, convertMapToNeighborhoodCoordinates, calculateZLevelOffset } from '../utils/map-transform';
import { MapDataSchema, type MapData as FullMapData, type MapItem as FullMapItem, type MapLayer } from '@/lib/types/map-schemas';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, X } from 'lucide-react';

// Import game object components
import {
  CommunityCenterBuilding,
  DirectoryBuilding,
  FeedbackBuilding
} from '@/components/community-buildings';

import {
  PineTree,
  MushroomTree,
  CrystalTree,
  FloatingTree,
  BonsaiTree,
  Tree, // Generic Tree component
  Forest, // Forest component
  FuturamaMailbox,
  HoverBench,
  StreetLamp,
  HologramBillboard,
  RobotPet
} from '@/components/decorative-objects';
import { CentralPark, FuturamaMonument, PlanetExpressBuilding, PixelatedMountainWithWaterfall, PixelClockTower } from '@/components/landmarks';
import { CustomOrbitControls } from '../components/CustomOrbitControls';
import { House } from '@/components/house';

// Import HouseType from type definitions
import type { HouseType } from "@/lib/types";
import { Slider } from '@/components/ui/slider';

// Assuming these landmark components exist as per the old neighborhood file
// Add actual imports if these are available in your project structure
// For example: import { CentralPark } from '@/components/landmarks/CentralPark';
// If not, they will be rendered as placeholder boxes.
const PlaceholderLandmark = ({ name, position, scale }: { name: string, position: [number, number, number], scale: number }) => (
  <group position={position}>
    <Box args={[5 * scale, 5 * scale, 5 * scale]}>
      <meshStandardMaterial color="purple" />
    </Box>
    <Text position={[0, 3 * scale, 0]} fontSize={0.5 * scale} color="white" anchorX="center">
      {name}
    </Text>
  </group>
);

// Placeholder components for landmarks until actual components are integrated
const PixelatedRiverWalkway = (props: any) => <PlaceholderLandmark name="River Walkway" {...props} />;
const PixelatedTubeTransportSegment = (props: any) => <PlaceholderLandmark name="Tube Transport" {...props} />;
const PixelatedDonutStatue = (props: any) => <PlaceholderLandmark name="Donut Statue" {...props} />;
const PixelatedMoistureVaporator = (props: any) => <PlaceholderLandmark name="Moisture Vaporator" {...props} />;
const PixelatedEnergyCube = (props: any) => <PlaceholderLandmark name="Energy Cube" {...props} />;
const RetroArcadeCabinet = (props: any) => <PlaceholderLandmark name="Arcade Cabinet" {...props} />;
const FloatingIsland = (props: any) => <PlaceholderLandmark name="Floating Island" {...props} />;
const PixelDiner = (props: any) => <PlaceholderLandmark name="Pixel Diner" {...props} />;
const PixelObservatory = (props: any) => <PlaceholderLandmark name="Observatory" {...props} />;
const PixelSpaceStation = (props: any) => <PlaceholderLandmark name="Space Station" {...props} />;
const PixelFestivalArea = (props: any) => <PlaceholderLandmark name="Festival Area" {...props} />;
const PixelFarmersMarket = (props: any) => <PlaceholderLandmark name="Farmers Market" {...props} />;
const PixelLibrary = (props: any) => <PlaceholderLandmark name="Library" {...props} />;
const PixelTreehouseVillage = (props: any) => <PlaceholderLandmark name="Treehouse Village" {...props} />;

// Array of available house types to choose from randomly for plots
const AVAILABLE_HOUSE_TYPES: HouseType[] = [
  "type1", "type2", "type3", "type4", "type5", "type6", "type7", "type8", "type9", "type10",
  "type11", "type12", "type13", "type14", "type15", "type16", "type17", "type18", "type19", "type20",
  "simpson1", "simpson2", "simpson3", "simpson4", "simpson5", "simpson6", "simpson7", "simpson8",
  "avenger1", "avenger2", "avenger3", "avenger4", "avenger5", "avenger6", "avenger7", "avenger8"
];

// Create a seeded random function to maintain consistent random selections
function seededRandom(seed: string) {
  let hash = Array.from(seed).reduce((hash, char) => {
    return ((hash << 5) - hash) + char.charCodeAt(0) | 0;
  }, 0);

  return function () {
    const x = Math.sin(hash++) * 10000;
    return x - Math.floor(x);
  };
}

// Get a random house type based on item id as seed
function getRandomHouseType(itemId: string): HouseType {
  const random = seededRandom(itemId);
  const index = Math.floor(random() * AVAILABLE_HOUSE_TYPES.length);
  return AVAILABLE_HOUSE_TYPES[index];
}

// Get a deterministic but "random" color based on itemId
function getRandomHouseColor(itemId: string): string {
  const random = seededRandom(itemId + "color");
  const hue = Math.floor(random() * 360);
  const saturation = 60 + Math.floor(random() * 30); // 60-90%
  const lightness = 65 + Math.floor(random() * 20); // 65-85%

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

interface NeighborhoodModePreviewProps {
  mapData: FullMapData;
}

// Unit size for neighborhood. Defines how many 3D world units one map unit represents.
const UNIT_SIZE_NEIGHBORHOOD = 1;

// Default color for items if not specified
const DEFAULT_ITEM_COLOR = '#999999';

// Define PREVIEW_ITEM_TYPE_STYLES locally or import from a shared constants file
// This is used for default coloring if item.color is not provided.
const PREVIEW_ITEM_TYPE_STYLES: Record<string, { defaultColor: string }> = {
  'plot-standard': { defaultColor: '#d5e8d4' },
  'plot-premium': { defaultColor: '#b5e7a0' },
  'plot-commercial': { defaultColor: '#e1d5e7' },
  'building-community-center': { defaultColor: '#4ECDC4' },
  'building-directory': { defaultColor: '#FF6B6B' },
  'building-feedback': { defaultColor: '#C7B3E5' },
  'landmark-centralpark': { defaultColor: '#8CC084' },
  'landmark-mountain-with-waterfall': { defaultColor: '#FFD700' },
  'landmark-clock-tower': { defaultColor: '#1e88e5' },
  'decorative-tree-pine': { defaultColor: '#6B8E23' },
  'decorative-tree-mushroom': { defaultColor: '#8B4513' },
  'decorative-tree-crystal': { defaultColor: '#87CEEB' },
  'decorative-tree-floating': { defaultColor: '#9370DB' },
  'decorative-tree-bonsai': { defaultColor: '#8B0000' },
  'decorative-tree-tree': { defaultColor: '#228B22' },
  'decorative-tree-forest': { defaultColor: '#2E8B57' },
  'decorative-mailbox': { defaultColor: '#CD5C5C' },
  'decorative-bench': { defaultColor: '#A0522D' },
  'decorative-lamp': { defaultColor: '#FFD700' },
  'decorative-billboard': { defaultColor: '#00CED1' },
  'decorative-robot-pet': { defaultColor: '#C0C0C0' },
  'street-main': { defaultColor: '#555555' },
  'street-secondary': { defaultColor: '#666666' },
  'street-path': { defaultColor: '#d2b48c' },
  'ground-grass': { defaultColor: '#8CC084' },
  'ground-water': { defaultColor: '#1e88e5' },
  // Add other types if needed
};

// Scene setup component to handle background, lighting, and environment
function SceneSetup({ mapEnvironment, neighborhoodSize }: { mapEnvironment: FullMapData['environment'], neighborhoodSize: number }) {
  const { scene, camera } = useThree();

  useEffect(() => {
    scene.background = new THREE.Color(mapEnvironment?.backgroundColor || '#87CEEB');

    const ambientLight = scene.getObjectByName('ambientLight');
    if (ambientLight instanceof THREE.AmbientLight) {
      ambientLight.color.set(mapEnvironment?.ambientLightColor || '#FFFFFF');
      ambientLight.intensity = mapEnvironment?.ambientLightIntensity ?? 0.7;
    }

    const directionalLight = scene.getObjectByName('directionalLight');
    if (directionalLight instanceof THREE.DirectionalLight) {
      directionalLight.color.set(mapEnvironment?.directionalLightColor || '#FFFFFF');
      directionalLight.intensity = mapEnvironment?.directionalLightIntensity ?? 1.3;
      directionalLight.position.set(neighborhoodSize * 0.6, neighborhoodSize * 0.8, neighborhoodSize * 0.5);
    }

    // Adjust camera based on neighborhood size
    const cameraDistance = neighborhoodSize * 1.3;
    camera.position.set(0, cameraDistance * 0.7, cameraDistance);
    camera.lookAt(0, 0, 0);

  }, [scene, camera, mapEnvironment, neighborhoodSize]);

  return null;
}

// Empty handler functions for interactive buildings (can be expanded later)
const handleOpenBoard = () => console.log("Preview: Community Board opened");
const handleOpenDirectory = () => console.log("Preview: Directory opened");
const handleOpenFeedback = () => console.log("Preview: Feedback opened");
const handleNavigateToHouse = (position: [number, number, number]) => console.log("Preview: Navigate to house at", position);
const handleHouseClick = () => console.log("Preview: House clicked");

// The main scene rendering component
function NeighborhoodPreviewScene({
  mapData,
  renderPlotsAsHouses,
  filterLayerId,
  filterItemType,
  houseScaleFactor,
}: {
  mapData: FullMapData,
  renderPlotsAsHouses: boolean,
  filterLayerId: string,
  filterItemType: string,
  houseScaleFactor: number,
}) {

  const renderItemComponent = (item: FullMapItem) => {
    const layer = mapData.layers.find(l => l.id === item.layerId);
    if (!layer || !layer.visible) {
      return null;
    }

    // Apply filters
    if (filterLayerId !== 'all' && layer.id !== filterLayerId) {
      return null;
    }

    if (filterItemType !== 'all' && item.type !== filterItemType) {
      return null;
    }

    const itemScale = item.scale || 1;
    const rotationY = (item.rotation || 0) * Math.PI / 180;
    const rotation: [number, number, number] = [0, rotationY, 0];

    // Use item.color, then type-specific default, then overall default
    const itemColor = item.color || PREVIEW_ITEM_TYPE_STYLES[item.type]?.defaultColor || DEFAULT_ITEM_COLOR;

    // Extract category from item type (e.g., 'ground-water' -> 'ground')
    const category = item.type.split('-')[0] || '';

    // Get zLevelOffset based on item type and category
    const zLevelOffset = calculateZLevelOffset(item.type, category);

    // Base Y position considering layer zIndex and item's elevationOffset
    const baseElevation = (layer.zIndex + (item.elevationOffset || 0)) * UNIT_SIZE_NEIGHBORHOOD + zLevelOffset;

    // Position in 3D world
    const position3D: [number, number, number] = [
      item.x * UNIT_SIZE_NEIGHBORHOOD,
      baseElevation,
      item.y * UNIT_SIZE_NEIGHBORHOOD
    ];

    // Dimensions for primitives (plots, ground, streets)
    // Apply UNIT_SIZE_NEIGHBORHOOD to get the correct dimensions in 3D world space
    const footprintWidth = (item.width || 1) * UNIT_SIZE_NEIGHBORHOOD * itemScale;
    const footprintDepth = (item.height || 1) * UNIT_SIZE_NEIGHBORHOOD * itemScale;

    // Check if this item is a plot type and we should render it as a house
    const isPlotType = item.type.startsWith('plot-');

    // If this is a plot and we should render plots as houses, we'll render both the plot and a house
    if (isPlotType && renderPlotsAsHouses) {
      const houseType = getRandomHouseType(item.id);
      const houseColor = getRandomHouseColor(item.id);

      // House scale should be proportional to plot size, but not too large
      // We make the house slightly smaller than the plot to ensure it fits nicely
      const houseScale = Math.min(itemScale * houseScaleFactor, houseScaleFactor + 1.0) * Math.min(
        Math.sqrt((item.width || 1) * (item.height || 1)) * 0.8,
        4.0
      );

      // House position (slightly elevated from the plot)
      const housePosition: [number, number, number] = [
        position3D[0],
        position3D[1] + 0.05 * UNIT_SIZE_NEIGHBORHOOD, // Increased elevation
        position3D[2]
      ];


      return (
        <group key={item.id}>
          {/* Render the base plot first */}
          <group position={[position3D[0], position3D[1] + 0.05 * UNIT_SIZE_NEIGHBORHOOD / 2, position3D[2]]} rotation={rotation}>
            <Box args={[footprintWidth, 0.05 * UNIT_SIZE_NEIGHBORHOOD, footprintDepth]} castShadow receiveShadow>
              <meshStandardMaterial color={itemColor} opacity={0.65} transparent />
            </Box>
            {/* We don't render the plot name when showing houses */}
          </group>

          {/* Then render the house on top */}
          <House
            position={housePosition}
            houseType={houseType}
            color={houseColor}
            onClick={handleHouseClick}
            scale={houseScale}
          />
        </group>
      );
    }

    switch (item.type) {
      // Buildings
      case 'building-community-center':
        return <CommunityCenterBuilding key={item.id} position={position3D} scale={itemScale} onOpenBoard={handleOpenBoard} rotation={rotation} />;
      case 'building-directory':
        return <DirectoryBuilding key={item.id} position={position3D} scale={itemScale} onNavigateToHouse={handleNavigateToHouse} onOpenDirectory={handleOpenDirectory} rotation={rotation} />;
      case 'building-feedback':
        return <FeedbackBuilding key={item.id} position={position3D} scale={itemScale} onOpenFeedback={handleOpenFeedback} rotation={rotation} />;

      // Decorative Trees
      case 'decorative-tree-pine':
        return <PineTree key={item.id} position={position3D} scale={itemScale} rotation={rotation} />;
      case 'decorative-tree-mushroom':
        return <MushroomTree key={item.id} position={position3D} scale={itemScale} rotation={rotation} />;
      case 'decorative-tree-crystal':
        return <CrystalTree key={item.id} position={position3D} scale={itemScale} rotation={rotation} />;
      case 'decorative-tree-floating':
        return <FloatingTree key={item.id} position={position3D} scale={itemScale} rotation={rotation} />;
      case 'decorative-tree-bonsai':
        return <BonsaiTree key={item.id} position={position3D} scale={itemScale} rotation={rotation} />;
      case 'decorative-tree-tree': // Generic tree
        return <Tree key={item.id} position={position3D} scale={itemScale} trunkColor={itemColor} foliageColor={itemColor} rotation={rotation} />;
      case 'decorative-tree-forest':
        return <Forest
          key={item.id}
          count={item.properties?.treeCount as number || 10} // Example: allow custom count via properties
          radius={(item.width || 5) * UNIT_SIZE_NEIGHBORHOOD * itemScale * 0.45} // Radius based on item width
          centerPosition={position3D}
          baseScale={itemScale}
          foliageColor={itemColor}
        />;

      // Other Decorative Items
      case 'decorative-mailbox':
        return <FuturamaMailbox key={item.id} position={position3D} scale={itemScale} rotation={rotation} />;
      case 'decorative-bench':
        return <HoverBench key={item.id} position={position3D} scale={itemScale} rotation={rotation} />;
      case 'decorative-lamp':
        return <StreetLamp key={item.id} position={position3D} scale={itemScale} rotation={rotation} />;
      case 'decorative-billboard':
        return <HologramBillboard key={item.id} position={position3D} scale={itemScale} rotation={rotation} />;
      case 'decorative-robot-pet':
        return <RobotPet key={item.id} position={position3D} scale={itemScale} rotation={rotation} />;

      // Landmarks (Using placeholders, replace with actual components)
      case 'landmark-centralpark':
        return <CentralPark key={item.id} position={position3D} scale={itemScale} rotation={rotation} />;
      case 'landmark-mountain-with-waterfall':
        return <PixelatedMountainWithWaterfall key={item.id} position={position3D} scale={itemScale} rotation={rotation} />;
      case 'landmark-clock-tower':
        return <PixelClockTower key={item.id} position={position3D} scale={itemScale} rotation={rotation} />;
      case 'landmark-futurama-monument':
        return <FuturamaMonument key={item.id} position={position3D} scale={itemScale} rotation={rotation} />;
      case 'landmark-planet-express':
        return <PlanetExpressBuilding key={item.id} position={position3D} scale={itemScale} rotation={rotation} />;
      // Add other landmark cases here...
      // e.g. case 'landmark-pixel-diner': return <PixelDiner ... />

      // Plots (rendered as simple boxes with text)
      case 'plot-standard':
      case 'plot-premium':
      case 'plot-commercial':
        const plotVisualHeight = 0.1 * UNIT_SIZE_NEIGHBORHOOD; // Very thin base for plots
        return (
          <group key={item.id} position={[position3D[0], position3D[1] + plotVisualHeight / 2, position3D[2]]} rotation={rotation}>
            <Box args={[footprintWidth, plotVisualHeight, footprintDepth]} castShadow receiveShadow>
              <meshStandardMaterial color={itemColor} opacity={0.65} transparent />
            </Box>
            {item.properties?.name && (
              <Text
                position={[0, plotVisualHeight / 2 + 0.2 * UNIT_SIZE_NEIGHBORHOOD, 0]}
                fontSize={Math.max(0.1, 0.15 * UNIT_SIZE_NEIGHBORHOOD * Math.min(itemScale, 2))} // Dynamic font size
                color="#000000"
                anchorX="center"
                anchorY="middle"
                rotation={[-Math.PI / 2, 0, 0]} // Text flat on the plot
              >
                {String(item.properties.name)}
              </Text>
            )}
          </group>
        );

      // Streets and Ground (rendered as flat planes)
      // Note: All street and ground types are grouped for simplicity. Specific geometries (e.g. curves) would require more complex components.
      case 'street-main':
      case 'street-secondary':
      case 'street-path':
      case 'street-rounded':
      case 'street-ellipse':
      case 'street-roundabout':
      case 'street-junction':
      case 'street-diagonal':
      case 'street-bridge': // Bridges might need special handling for height
      case 'street-railroad':
      case 'street-curve':
      case 'street-traffic-circle':
      case 'street-parking-lot':
      case 'street-sidewalk':
      case 'ground-grass':
      case 'ground-street': // Ground that looks like a street
      case 'ground-water':
      case 'ground-sand':
      case 'ground-park':
      case 'ground-dirt':
      case 'ground-rock':
      case 'ground-snow':
      case 'ground-lava':
      case 'ground-toxic':
        const isWater = item.type === 'ground-water';
        const planeElevationOffset = (isWater ? -0.01 : 0.005) * UNIT_SIZE_NEIGHBORHOOD;

        // No need for separate planeElevationOffset now, we'll use the calculated baseElevation
        return (
          <group key={item.id}>
            <Plane
              args={[footprintWidth, footprintDepth]}
              position={[
                position3D[0],
                position3D[1], // Using the baseElevation that includes zLevelOffset
                position3D[2]
              ]}
              rotation={[-Math.PI / 2, 0, rotationY]}
              receiveShadow
            >
              <meshStandardMaterial
                color={itemColor}
                transparent={isWater || item.type.includes('lava') || item.type.includes('toxic')}
                opacity={(isWater || item.type.includes('lava')) ? 0.75 : 1}
                side={THREE.DoubleSide}
              />
            </Plane>

            {/* Debug markers if needed */}
            {/* ... */}
          </group>
        );

      // Default fallback for unrecognized item types
      default:
        const defaultVisualHeight = UNIT_SIZE_NEIGHBORHOOD * itemScale * 0.5; // Generic height
        return (
          <group key={item.id} position={[position3D[0], position3D[1] + defaultVisualHeight / 2, position3D[2]]} rotation={rotation}>
            <Box args={[footprintWidth, defaultVisualHeight, footprintDepth]} castShadow>
              <meshStandardMaterial color="red" wireframe />
            </Box>
            <Text
              position={[0, defaultVisualHeight / 2 + 0.1 * UNIT_SIZE_NEIGHBORHOOD, 0]}
              fontSize={0.2 * UNIT_SIZE_NEIGHBORHOOD}
              color="white"
              anchorX="center"
              anchorY="middle"
            >
              {item.type.split('-').pop() || 'Unknown'}
            </Text>
          </group>
        );
    }
  };

  // Determine the overall size of the map for camera and lighting setup
  const mapWorldWidth = mapData.width * UNIT_SIZE_NEIGHBORHOOD;
  const mapWorldDepth = mapData.height * UNIT_SIZE_NEIGHBORHOOD;
  const neighborhoodVisualSize = Math.max(mapWorldWidth, mapWorldDepth, 50); // Ensure a minimum size

  // Find the lowest Z-index for the base plane
  const lowestLayerZ = Math.min(0, ...mapData.layers.map(l => l.zIndex));
  const basePlaneY = (lowestLayerZ - 0.1) * UNIT_SIZE_NEIGHBORHOOD; // Position base plane slightly below lowest layer item

  return (
    <group>
      {/* Base ground plane for the entire neighborhood */}
      <Plane
        args={[neighborhoodVisualSize * 1.5, neighborhoodVisualSize * 1.5]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, basePlaneY, 0]} // Centered at world origin, slightly below all content
        receiveShadow
      >
        <meshStandardMaterial color={mapData.environment?.groundColor || "#5C6D57"} />
      </Plane>

      {/* Optional Grid helper - centered at world origin, at base plane level */}
      <gridHelper
        args={[
          neighborhoodVisualSize * 1.5,
          Math.floor(neighborhoodVisualSize * 1.5 / UNIT_SIZE_NEIGHBORHOOD), // Match grid to units
          '#AAAAAA',
          '#BBBBBB'
        ]}
        position={[0, basePlaneY + 0.01 * UNIT_SIZE_NEIGHBORHOOD, 0]} // Slightly above base plane
      />

      {/* Render all map items */}
      {mapData.items.map(renderItemComponent)}
    </group>
  );
}

export function NeighborhoodModePreview({ mapData: rawMapData }: NeighborhoodModePreviewProps) {
  const [processedMapData, setProcessedMapData] = useState<FullMapData | null>(null);
  const [renderPlotsAsHouses, setRenderPlotsAsHouses] = useState<boolean>(false);
  const [filterLayerId, setFilterLayerId] = useState<string>('all');
  const [filterItemType, setFilterItemType] = useState<string>('all');
  const [houseScaleFactor, setHouseScaleFactor] = useState<number>(2.0);

  // Extract unique item types in the map
  const uniqueItemTypesInMap = useMemo(() => {
    if (!processedMapData?.items) return [];
    const types = new Set<string>();
    processedMapData.items.forEach(item => types.add(item.type));
    return Array.from(types).sort();
  }, [processedMapData]);

  useEffect(() => {
    if (rawMapData && rawMapData.items && rawMapData.layers && rawMapData.environment) {
      // Ensure layers exist, providing a default if necessary
      let mapDataWithLayers = rawMapData;
      if (!rawMapData.layers || rawMapData.layers.length === 0) {
        console.warn("NeighborhoodModePreview: mapData missing layers. Applying default layer.");
        const defaultLayer: MapLayer = {
          id: 'default-layer',
          name: 'Default Layer',
          zIndex: 0,
          visible: true,
        };
        mapDataWithLayers = {
          ...rawMapData,
          layers: [defaultLayer, ...(MapDataSchema.parse({ name: "", width: 1, height: 1, items: [] }).layers || [])], // Add default if none
        };
      }

      // First, transform the item types to neighborhood-compatible types
      const transformedForNeighborhoodTypes = transformMapToNeighborhood(mapDataWithLayers);

      // Then, convert the coordinates from top-left origin to center origin
      const convertedCoords = convertMapToNeighborhoodCoordinates(transformedForNeighborhoodTypes);

      setProcessedMapData(convertedCoords);

    } else if (rawMapData) {
      console.warn("NeighborhoodModePreview: Raw map data is missing critical parts (items, layers, or environment). Using raw data.", rawMapData);
      // Fallback to using rawMapData if processing fails but data exists, though it might not be centered.
      // This ensures that if transform functions fail, we still try to render something.
      setProcessedMapData(rawMapData);
    }
  }, [rawMapData]);

  const clearFilters = () => {
    setFilterLayerId('all');
    setFilterItemType('all');
  };

  if (!processedMapData) {
    return <div className="flex justify-center items-center h-full text-muted-foreground">Preparing neighborhood preview...</div>;
  }

  if (!processedMapData.items || !processedMapData.layers || !processedMapData.environment) {
    return <div className="flex justify-center items-center h-full text-destructive">Error: Processed map data is incomplete for rendering.</div>;
  }

  const neighborhoodSize = Math.max(processedMapData.width, processedMapData.height, 10) * UNIT_SIZE_NEIGHBORHOOD;
  const skyDistance = neighborhoodSize * 4;

  return (
    <div className="relative h-full w-full" style={{ background: processedMapData.environment.backgroundColor || '#87CEEB' }}>
      {/* Control overlay */}
      <div className="absolute top-3 left-3 z-10 bg-black/20 backdrop-blur-sm p-3 rounded-lg shadow-lg flex flex-col gap-3 max-w-xs">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="render-plots-toggle" className="text-xs font-semibold text-white">
            Render Plots as Houses
          </Label>
          <Switch
            id="render-plots-toggle"
            checked={renderPlotsAsHouses}
            onCheckedChange={setRenderPlotsAsHouses}
          />
        </div>
        {renderPlotsAsHouses && (
          <div className="flex items-center justify-between gap-2 mt-2">
            <Label htmlFor="house-scale-slider" className="text-xs font-semibold text-white">
              House Size
            </Label>
            <div className="w-32">
              <Slider
          id="house-scale-slider"
          min={0.5}
          max={5}
          step={0.1}
          value={[houseScaleFactor]}
          onValueChange={([value]) => setHouseScaleFactor(value)}
              />
            </div>
            <span className="text-xs text-white w-8 text-right">{houseScaleFactor.toFixed(1)}x</span>
          </div>
        )}

        <div className="mt-2 pt-2 border-t border-white/20">
          <Label className="flex items-center text-xs font-semibold text-white mb-2">
            <Filter className="w-3.5 h-3.5 mr-1" />Filters:
          </Label>

          <div className="flex flex-col gap-2">
            <Select value={filterLayerId} onValueChange={setFilterLayerId}>
              <SelectTrigger className="h-8 text-xs bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Layer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Layers</SelectItem>
                {processedMapData.layers.filter(l => l.name !== 'Map Background' && l.visible).map(layer => (
                  <SelectItem key={layer.id} value={layer.id}>{layer.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterItemType} onValueChange={setFilterItemType}>
              <SelectTrigger className="h-8 text-xs bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Item Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Item Types</SelectItem>
                {uniqueItemTypesInMap.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(filterLayerId !== 'all' || filterItemType !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs h-8 px-2 mt-1 bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-3 h-3 mr-1" /> Clear Filters
              </Button>
            )}
          </div>
        </div>
      </div>

      <Canvas
        shadows
        camera={{
          fov: 50,
          near: 0.1 * UNIT_SIZE_NEIGHBORHOOD,
          far: neighborhoodSize * 10 // Increased far plane
        }}
      >
        <Sky
          distance={skyDistance}
          sunPosition={[
            neighborhoodSize * 0.5, // Adjust sun position based on map size
            (processedMapData.environment.starsIntensity && processedMapData.environment.starsIntensity > 0.6 ? skyDistance * 0.1 : skyDistance * 0.4),
            neighborhoodSize * 0.3
          ]}
          rayleigh={processedMapData.environment.skyRayleigh ?? 1}
          turbidity={processedMapData.environment.skyTurbidity ?? 10}
          mieCoefficient={0.005}
          mieDirectionalG={0.8}
        />

        <ambientLight
          name="ambientLight"
          intensity={processedMapData.environment.ambientLightIntensity ?? 0.7}
          color={new THREE.Color(processedMapData.environment.ambientLightColor || '#FFFFFF')}
        />

        <directionalLight
          name="directionalLight"
          castShadow
          position={[neighborhoodSize * 0.6, neighborhoodSize * 0.8, neighborhoodSize * 0.5]}
          intensity={processedMapData.environment.directionalLightIntensity ?? 1.3}
          color={new THREE.Color(processedMapData.environment.directionalLightColor || '#FFFFFF')}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={neighborhoodSize * 3}
          shadow-camera-left={-neighborhoodSize * 1.5}
          shadow-camera-right={neighborhoodSize * 1.5}
          shadow-camera-top={neighborhoodSize * 1.5}
          shadow-camera-bottom={-neighborhoodSize * 1.5}
        />

        {(processedMapData.environment.starsIntensity ?? 0) > 0 && (
          <Stars
            radius={skyDistance * 0.8}
            depth={skyDistance / 3}
            count={(processedMapData.environment.starsIntensity ?? 0.5) * 5000}
            factor={Math.max(4, neighborhoodSize * 0.05)}
            saturation={0}
            fade
            speed={0.5}
          />
        )}

        <SceneSetup mapEnvironment={processedMapData.environment} neighborhoodSize={neighborhoodSize} />

        <NeighborhoodPreviewScene
          mapData={processedMapData}
          renderPlotsAsHouses={renderPlotsAsHouses}
          filterLayerId={filterLayerId}
          filterItemType={filterItemType}
          houseScaleFactor={houseScaleFactor}
        />

        <CustomOrbitControls
          target={[0, 0, 0]}
          maxPolarAngle={Math.PI / 2.05}
          minDistance={UNIT_SIZE_NEIGHBORHOOD * 2}
          maxDistance={neighborhoodSize * 3}
          enablePan={true}
          enableZoom={true}
          moveSpeed={10}
          rotateSpeed={0.01} // Adjust this value to control turn sensitivity
        />
      </Canvas>
    </div>
  );
}