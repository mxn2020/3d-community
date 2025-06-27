// components/neighborhood-renderer.tsx (corrected)
"use client"

import { Text } from "@react-three/drei"
import { House } from "@/components/house"
import OptimizedPlot from "./plot/optimized-plot"
import { EnhancedPlotData } from "@/lib/types/enhanced-plot.types"
import { OwnerProfile } from "@/lib/types/owner-profile-schemas"
import { PlotHoverManager } from "@/lib/plot-hover-manager"
import { UNIT_SIZE } from "@/lib/config"

interface EnhancedPlotRendererProps {
  plotData: EnhancedPlotData & { ownerProfile?: OwnerProfile | null; isProfileLoading?: boolean };
  onSelectHouse: (house: EnhancedPlotData) => void;
  onShowPlotDetails: (plotItem: any, plotState: any) => void;
  selectedPlotId?: string | null;
  userPlotId?: string | null;
  userId?: string | null;
  hoverManager: PlotHoverManager;
}

export function EnhancedPlotRenderer({
  plotData,
  onSelectHouse,
  onShowPlotDetails,
  selectedPlotId,
  userPlotId,
  userId,
  hoverManager,
}: EnhancedPlotRendererProps) {
  const plotFootprintWidth = plotData.mapPosition.width * UNIT_SIZE;
  const plotFootprintDepth = plotData.mapPosition.height * UNIT_SIZE;
  
  // Determine highlight color
  let highlightColor = undefined;
  if (userPlotId && plotData.id === userPlotId) {
    highlightColor = '#ff69b4'; // Pink for user's owned plot
  } else if (selectedPlotId === plotData.id) {
    highlightColor = '#FFD700'; // Gold for selected in dialog
  } else if (plotData.isOwned && plotData.ownerId !== userId) {
    highlightColor = '#FF0000'; // Red for plots owned by other users
  }

  // Calculate house rotation - convert degrees to radians
  const houseRotationY = (plotData.facingDirection || 0) * Math.PI / 180;

  if (plotData.isOwned) {
    // Create comprehensive house data object
    const enhancedHouseData = {
      // Plot identification
      id: plotData.id,
      plotId: plotData.plotId,
      
      // Owner information
      ownerId: plotData.ownerId,
      isOwned: plotData.isOwned,

      ownerProfile: plotData.ownerProfile,
      isProfileLoading: plotData.isProfileLoading,
      
      // House properties
      houseType: plotData.houseType,
      houseColor: plotData.houseColor,
      
      // Plot properties
      mapPosition: plotData.mapPosition,
      worldPosition: plotData.worldPosition,
      rotation: plotData.rotation,
      facingDirection: plotData.facingDirection,
      scale: plotData.scale,
      color: plotData.color,
      layerId: plotData.layerId,
      properties: plotData.properties,
      
      // Interaction data
      likesCount: plotData.likesCount,
      purchaseDate: plotData.purchaseDate,
      
      // Status flags
      isUserOwned: plotData.isUserOwned,
      isSelected: plotData.isSelected,
      isHighlighted: plotData.isHighlighted,
      
      // Additional plot state for compatibility
      plotState: {
        id: plotData.id,
        ownerId: plotData.ownerId,
        houseType: plotData.houseType,
        houseColor: plotData.houseColor,
        likesCount: plotData.likesCount,
        createdAt: plotData.purchaseDate,
        isUserOwned: plotData.isUserOwned,
      }
    };

    return (
      <group key={plotData.id} position={plotData.worldPosition} rotation={[0, houseRotationY, 0]}>
        {/* Highlight border for owned or selected plot */}
        {highlightColor && (
          <mesh position={[0, 0.6 * UNIT_SIZE, 0]}>
            <boxGeometry args={[plotFootprintWidth * 1.05, 0.12 * UNIT_SIZE, plotFootprintDepth * 1.05]} />
            <meshStandardMaterial color={highlightColor} transparent opacity={highlightColor === '#FF0000' ? 0.5 : 0.35} />
          </mesh>
        )}
        
        {/* House with enhanced data and rotation */}
        <House
          position={[0, 4.0 * UNIT_SIZE, 0]}
          houseType={plotData.houseType}
          color={plotData.houseColor}
          onClick={() => onSelectHouse(enhancedHouseData)}
          scale={plotData.scale * 5}
          userData={enhancedHouseData}
        />
        
        {/* Plot status text */}
        {plotData.isUserOwned ? (
          <Text position={[0, 2.5 * plotData.scale, 0]} fontSize={0.3 * plotData.scale} color="cyan" outlineColor="black" outlineWidth={0.01}>
            Your Plot
          </Text>
        ) : (
          <Text position={[0, 2.5 * plotData.scale, 0]} fontSize={0.25 * plotData.scale} color="red" outlineColor="black" outlineWidth={0.01}>
            Owned Plot
          </Text>
        )}
      </group>
    );
  } else {
    // Available plot rendering with rotation
    return (
      <group key={plotData.id} position={plotData.worldPosition} rotation={[0, houseRotationY, 0]}>
        <OptimizedPlot
          id={plotData.id}
          position={[0, 0, 0]} // Position is handled by group
          dimensions={{
            width: plotFootprintWidth,
            height: 0.1 * UNIT_SIZE,
            depth: plotFootprintDepth
          }}
          hoverManager={hoverManager}
          itemScale={plotData.scale}
          itemColor={highlightColor || plotData.color}
          name="Available Plot"
          unitSize={UNIT_SIZE}
          itemForClick={{
            ...plotData,
            // Convert back to map item format for compatibility
            id: plotData.id,
            type: 'plot-standard',
            category: 'plot',
            x: plotData.mapPosition.x,
            y: plotData.mapPosition.y,
            width: plotData.mapPosition.width,
            height: plotData.mapPosition.height,
            rotation: plotData.rotation,
            scale: plotData.scale,
            color: plotData.color,
            layerId: plotData.layerId,
            properties: plotData.properties,
          }}
          plotStateForClick={null}
          onPlotClickTrigger={onShowPlotDetails}
        />
      </group>
    );
  }
}