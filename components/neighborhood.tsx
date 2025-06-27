// components/neighborhood.tsx (corrected - remove duplicate plot rendering)
"use client"

import { useRef, useState, useEffect, useMemo } from "react"
import { Text, Plane, Box } from "@react-three/drei"
import * as THREE from "three"
import {
  PineTree,
  MushroomTree,
  CrystalTree,
  FloatingTree,
  BonsaiTree,
  FuturamaMailbox,
  HoverBench,
  StreetLamp,
  HologramBillboard,
  RobotPet,
  Tree,
  Forest,
} from "@/components/decorative-objects"
import { CommunityCenterBuilding, DirectoryBuilding, FeedbackBuilding } from "@/components/community-buildings"
import type { MapData, MapItem, MapLayer } from '@/lib/types/map-schemas';
import { useAuth } from '@/components/providers/auth-provider';
import {
  CentralPark,
  PlanetExpressBuilding,
  PixelatedMountainWithWaterfall,
  RetroArcadeCabinet,
  PixelDiner,
} from "./landmarks"
import { useActiveCommunityMap } from "@/lib/queries/community-queries";
import { PlotHoverManager } from "@/lib/plot-hover-manager"
import { calculateZLevelOffset } from "../app/admin/map-preview/utils/map-transform";
import { useEnhancedPlots } from "@/lib/hooks/use-enhanced-plots";
import { useBatchOwnerProfiles } from "@/lib/queries/owner-profile-queries";
import { DEFAULT_ITEM_COLOR, ITEM_TYPE_DEFAULT_COLORS, UNIT_SIZE } from "@/lib/config"
import { EnhancedPlotRenderer } from "./neighborhood-renderer"
import { EnhancedPlotData } from "@/lib/types/enhanced-plot.types"

// Coordinate transformation utility
export const getWorldPosition = (item: MapItem, mapWidth: number, mapHeight: number) => {
  const itemWidth = item.width || 1;
  const itemHeight = item.height || 1;
  const itemCenterX = item.x + (itemWidth / 2);
  const itemCenterY = item.y + (itemHeight / 2);
  const centerX = mapWidth / 2;
  const centerY = mapHeight / 2;
  const worldX = (itemCenterX - centerX) * UNIT_SIZE;
  const worldZ = (itemCenterY - centerY) * UNIT_SIZE;
  return { worldX, worldZ };
};

interface NeighborhoodProps {
  onSelectHouse: (house: EnhancedPlotData) => void;
  userId?: string | null;
  userPlotId?: string | null;
  onOpenFeedback: () => void;
  onOpenCommunityBoard: () => void;
  onOpenDirectorySearch: () => void;
  onOpenPlotPurchase: (plotId: string) => void;
  onShowPlotDetails: (plotItem: any, plotState: any) => void;
  setCameraTarget: (position: [number, number, number] | null) => void;
  selectedPlotId?: string | null;
}

export function Neighborhood({
  onSelectHouse,
  userId,
  userPlotId,
  onOpenFeedback,
  onOpenCommunityBoard,
  onOpenDirectorySearch,
  onOpenPlotPurchase,
  onShowPlotDetails,
  setCameraTarget,
  selectedPlotId,
}: NeighborhoodProps) {
  const { enhancedPlots, isLoading: isLoadingEnhancedPlots } = useEnhancedPlots(userId);
  const ownedPlots = enhancedPlots.filter(plot => plot.isOwned);
  const availablePlots = enhancedPlots.filter(plot => !plot.isOwned);

  // Use the batch owner profiles hook for efficiency
  const batchOwnerProfileQuery = useBatchOwnerProfiles(
    ownedPlots.map(plot => plot.ownerId),
    { enabled: ownedPlots.length > 0 }
  );

  // Hover manager singleton
  const hoverManager = useMemo(() => new PlotHoverManager(), []);

  useEffect(() => {
    return () => {
      hoverManager.cleanup();
    };
  }, [hoverManager]);

  // Get authentication state
  const { user, isAuthenticated } = useAuth();

  // Get map data
  const { data: activeMapConfig, isLoading: isLoadingMap, error: mapError } = useActiveCommunityMap();

  // Combine plot data with owner profiles
  const plotsWithProfiles = useMemo(() => {
    if (!batchOwnerProfileQuery.data) {
      return ownedPlots.map(plot => ({
        ...plot,
        ownerProfile: null,
        isProfileLoading: batchOwnerProfileQuery.isLoading,
      }));
    }
    
    return ownedPlots.map(plot => ({
      ...plot,
      ownerProfile: batchOwnerProfileQuery.data[plot.ownerId] || null,
      isProfileLoading: false,
    }));
  }, [ownedPlots, batchOwnerProfileQuery.data, batchOwnerProfileQuery.isLoading]);

  const handleNavigateToHouseViaDirectory = (plotPositionInMapUnits: { x: number, y: number, width?: number, height?: number, zOffset?: number }) => {
    if (!activeMapConfig?.mapData) return;
    const { worldX, worldZ } = getWorldPosition({
      x: plotPositionInMapUnits.x,
      y: plotPositionInMapUnits.y,
      width: plotPositionInMapUnits.width ?? 1,
      height: plotPositionInMapUnits.height ?? 1,
      id: '', type: '', category: '', layerId: ''
    } as any, activeMapConfig.mapData.width, activeMapConfig.mapData.height);
    setCameraTarget([worldX, (plotPositionInMapUnits.zOffset || 0) + 2 * UNIT_SIZE, worldZ]);
    setTimeout(() => setCameraTarget(null), 5000);
  };

  if (isLoadingMap || (isAuthenticated && isLoadingEnhancedPlots)) {
    return <Text position={[0, 2, 0]} fontSize={0.5} color="white">Loading neighborhood...</Text>;
  }

  if (mapError) {
    return <Text position={[0, 2, 0]} fontSize={0.5} color="red">Error loading map: {mapError.message}</Text>;
  }

  if (!activeMapConfig || !activeMapConfig.mapData) {
    return <Text position={[0, 2, 0]} fontSize={0.5} color="orange">No active map configured.</Text>;
  }

  const { mapData } = activeMapConfig;
  const mapWidth = mapData.width;
  const mapHeight = mapData.height;

  // Determine overall ground plane size and position
  const groundSize = Math.max(mapWidth, mapHeight) * UNIT_SIZE * 1.5;
  const lowestLayerZ = mapData.layers?.length > 0 ? Math.min(0, ...mapData.layers.map(l => l.zIndex)) : 0;
  const basePlaneY = (lowestLayerZ - 1) * UNIT_SIZE * 0.1;

  return (
    <group>
      {/* Base Ground Plane */}
      <Plane
        args={[groundSize, groundSize]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, basePlaneY, 0]}
        receiveShadow
      >
        <meshStandardMaterial color="#8CC084" />
      </Plane>

      {/* Render owned plots with houses */}
      {plotsWithProfiles.map((plot) => (
        <EnhancedPlotRenderer
          key={plot.id}
          plotData={plot}
          onSelectHouse={onSelectHouse}
          onShowPlotDetails={onShowPlotDetails}
          selectedPlotId={selectedPlotId}
          userPlotId={userPlotId}
          userId={userId}
          hoverManager={hoverManager}
        />
      ))}
      
      {/* Render available plots */}
      {availablePlots.map((plot) => (
        <EnhancedPlotRenderer
          key={plot.id}
          plotData={plot}
          onSelectHouse={onSelectHouse}
          onShowPlotDetails={onShowPlotDetails}
          selectedPlotId={selectedPlotId}
          userPlotId={userPlotId}
          userId={userId}
          hoverManager={hoverManager}
        />
      ))}

      {/* Render other map items (non-plots) */}
      {mapData.items
        .filter(item => !item.type.startsWith('plot-')) // Only non-plot items
        .map((item) => {
          const layer = mapData.layers.find(l => l.id === item.layerId);
          if (!layer || !layer.visible) return null;

          const { worldX, worldZ } = getWorldPosition(item, mapWidth, mapHeight);
          const category = item.type.split('-')[0] || '';

          const itemElevation = (layer.zIndex + (item.elevationOffset || 0)) * UNIT_SIZE * 0.2;
          const yOffset = calculateZLevelOffset(item.type, category);
          const finalYPosition = itemElevation + yOffset;

          const itemScale = item.scale || 1;
          const rotationY = (item.rotation || 0) * Math.PI / 180;
          const itemColor = item.color || ITEM_TYPE_DEFAULT_COLORS[item.type] || DEFAULT_ITEM_COLOR;

          const position: [number, number, number] = [worldX, finalYPosition, worldZ];
          const rotation: [number, number, number] = [0, rotationY, 0];
          const itemWidth = (item.width || 1) * UNIT_SIZE * itemScale;
          const itemHeight = (item.height || 1) * UNIT_SIZE * itemScale;

          switch (item.type) {
            // Buildings
            case 'building-community-center':
              return (
                <CommunityCenterBuilding
                  key={item.id}
                  position={position}
                  scale={itemScale * 5}
                  onOpenBoard={onOpenCommunityBoard}
                  rotation={rotation}
                />
              );
            case 'building-directory':
              return (
                <DirectoryBuilding
                  key={item.id}
                  position={position}
                  scale={itemScale * 5}
                  onNavigateToHouse={(plotPos) => handleNavigateToHouseViaDirectory(plotPos as any)}
                  onOpenDirectory={onOpenDirectorySearch}
                  rotation={rotation}
                />
              );
            case 'building-feedback':
              return (
                <FeedbackBuilding
                  key={item.id}
                  position={position}
                  scale={itemScale * 5}
                  onOpenFeedback={onOpenFeedback}
                  rotation={rotation}
                />
              );
            case 'building-planet-express':
              return <PlanetExpressBuilding key={item.id} position={position} scale={[itemScale, itemScale, itemScale]} />;

            // Decorative items
            case 'decorative-lamp': return <StreetLamp key={item.id} position={position} scale={itemScale * 2} />;
            case 'decorative-tree-bonsai': return <BonsaiTree key={item.id} position={position} scale={itemScale * 2} />;
            case 'decorative-tree-crystal': return <CrystalTree key={item.id} position={position} scale={itemScale * 2} />;
            case 'decorative-tree-floating': return <FloatingTree key={item.id} position={position} scale={itemScale * 2} />;
            case 'decorative-tree-pine': return <PineTree key={item.id} position={position} scale={itemScale * 2} />;
            case 'decorative-tree-mushroom': return <MushroomTree key={item.id} position={position} scale={itemScale * 2} />;
            case 'decorative-tree-tree': return <Tree key={item.id} position={position} scale={itemScale * 2} foliageColor={itemColor} trunkColor={new THREE.Color(itemColor).offsetHSL(0, -0.1, -0.2).getStyle()} />;
            case 'decorative-tree-forest':
              const treeCount = (typeof item.properties === 'object' && item.properties !== null && (
                (item.properties as any).treeCount ?? (item.properties as any).tree_count
              )) || 10;
              return (
                <Forest
                  key={item.id}
                  count={treeCount as number}
                  radius={itemWidth * 0.45}
                  centerPosition={position}
                  minScale={itemScale * 1}
                  maxScale={itemScale * 3}
                  foliageColor={itemColor}
                />
              );

            case 'decorative-mailbox': return <FuturamaMailbox key={item.id} position={position} scale={itemScale * 2} />;
            case 'decorative-hologram': return <HologramBillboard key={item.id} position={position} scale={itemScale * 2} />;
            case 'decorative-robot': return <RobotPet key={item.id} position={position} scale={itemScale * 2} />;
            case 'decorative-bench': return <HoverBench key={item.id} position={position} scale={itemScale * 2} />;
            case 'decorative-arcade': return <RetroArcadeCabinet key={item.id} position={position} scale={itemScale * 2} />;
            case 'decorative-diner': return <PixelDiner key={item.id} position={position} scale={itemScale * 2} />;

            // Landmarks
            case 'landmark-centralpark': return <CentralPark key={item.id} position={position} />;
            case 'landmark-mountain-with-waterfall': return <PixelatedMountainWithWaterfall key={item.id} position={position} scale={itemScale * 5} />;

            // Streets & Ground
            case 'street-main':
            case 'street-secondary':
            case 'street-path':
            case 'ground-dirt':
            case 'ground-gravel':
            case 'ground-asphalt':
            case 'ground-park':
            case 'ground-grass':
            case 'ground-water':
            case 'ground-sand':
              const isWater = item.type === 'ground-water';
              return (
                <Plane
                  key={item.id}
                  args={[itemWidth, itemHeight]}
                  position={position}
                  rotation={[-Math.PI / 2, 0, rotationY]}
                  receiveShadow
                >
                  <meshStandardMaterial
                    color={itemColor}
                    transparent={isWater || item.type.includes('toxic')}
                    opacity={isWater ? 0.75 : 1.0}
                  />
                </Plane>
              );

            default:
              console.warn(`Unknown map item type in Neighborhood: ${item.type}`);
              return (
                <Box key={item.id} args={[itemWidth, 0.2 * UNIT_SIZE, itemHeight]} position={[position[0], position[1] + (0.2 * UNIT_SIZE) / 2, position[2]]} castShadow>
                  <meshStandardMaterial color="magenta" wireframe />
                  <Text position={[0, 0.2 * UNIT_SIZE, 0]} fontSize={0.2} color="white">{item.type}</Text>
                </Box>
              );
          }
      })}

      {/* Not authenticated messages */}
      {!isAuthenticated && (
        <>
          <Text position={[0, 2, 0]} fontSize={0.8} color="white">
            Sign in to view and purchase plots
          </Text>
          <Text position={[0, 1, -5]} fontSize={0.4} color="white" textAlign="center">
            Sign in to purchase plots and interact fully with the community!
          </Text>
        </>
      )}
    </group>
  )
}
