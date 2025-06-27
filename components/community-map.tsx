// components/CommunityMap.tsx
"use client"

import React from "react";
import * as THREE from "three";
import { 
  Ground, Street, RoundedStreet, EllipseStreet, 
  Roundabout, Junction, PathStreet, DiagonalStreet, 
  GridStreet, StreetPattern, GroundComposition 
} from "./ground-elements";
import {
  PineTree, MushroomTree, CrystalTree, FloatingTree, BonsaiTree,
  FuturamaMailbox, HoverBench, StreetLamp, HologramBillboard, RobotPet,
} from "@/components/decorative-objects";
import { 
  CommunityCenterBuilding, DirectoryBuilding, FeedbackBuilding 
} from "@/components/community-buildings";
import {
  CentralPark, FuturamaMonument, PlanetExpressBuilding,
  PixelatedMountainWithWaterfall, PixelatedRiverWalkway,
  PixelatedTubeTransportSegment, PixelatedDonutStatue,
  PixelatedMoistureVaporator, PixelatedEnergyCube,
  RetroArcadeCabinet, FloatingIsland, PixelDiner,
  PixelObservatory, PixelClockTower, PixelSpaceStation,
  PixelFestivalArea, PixelFarmersMarket, PixelLibrary,
  PixelTreehouseVillage
} from "@/components/landmarks";

// Define Plot component for simplicity
function Plot({ position, id, isAvailable = true, onClick }) {
  return (
    <mesh
      position={[position[0], 0.1, position[2]]}
      rotation={[-Math.PI / 2, 0, 0]}
      onClick={() => onClick(id)}
    >
      <planeGeometry args={[4, 4]} />
      <meshStandardMaterial
        color={isAvailable ? "#d5e8d4" : "#f8cecc"}
        opacity={0.8}
        transparent
      />
    </mesh>
  );
}

// Constants for map layout
const SQUARE_SIZE = 30; // Size of each square in the grid
const PLOT_SIZE = 4; // Size of each plot
const PLOT_SPACING = 6; // Space between plots (center to center)
const TOTAL_ROWS = 11;
const TOTAL_COLUMNS = 10;
const PLOTS_PER_SQUARE = 4; // Regular squares have 4 plots
const PLOTS_PER_SPECIAL_SQUARE = 2; // Special middle row has 2 plots per square

export function CommunityMap({ onSelectPlot }) {
  // Special row for central features (park, lake, etc.)
  const SPECIAL_ROW = 5; // Middle row (0-indexed)
  
  // Generate all plots
  const plots = [];
  let plotId = 1;
  
  // Helper function to create a standard square with 4 plots
  const createStandardSquare = (squareX, squareZ, squareId) => {
    const plots = [];
    const centerX = squareX * SQUARE_SIZE;
    const centerZ = squareZ * SQUARE_SIZE;
    
    // Place 4 plots in a 2x2 grid within the square
    const plotOffsets = [
      [-PLOT_SPACING, -PLOT_SPACING], // Bottom left
      [PLOT_SPACING, -PLOT_SPACING],  // Bottom right
      [-PLOT_SPACING, PLOT_SPACING],  // Top left
      [PLOT_SPACING, PLOT_SPACING],   // Top right
    ];
    
    plotOffsets.forEach((offset, i) => {
      const plotId = `square-${squareId}-plot-${i + 1}`;
      plots.push({
        id: plotId,
        position: [centerX + offset[0], 0, centerZ + offset[1]],
      });
    });
    
    return plots;
  };
  
  // Helper function to create a special square with 2 plots
  const createSpecialSquare = (squareX, squareZ, squareId) => {
    const plots = [];
    const centerX = squareX * SQUARE_SIZE;
    const centerZ = squareZ * SQUARE_SIZE;
    
    // Place 2 plots on opposite sides within the square
    const plotOffsets = [
      [-PLOT_SPACING * 1.2, 0], // Left
      [PLOT_SPACING * 1.2, 0],  // Right
    ];
    
    plotOffsets.forEach((offset, i) => {
      const plotId = `square-${squareId}-plot-${i + 1}`;
      plots.push({
        id: plotId,
        position: [centerX + offset[0], 0, centerZ + offset[1]],
      });
    });
    
    return plots;
  };
  
  // Generate squares and plots
  const squares = [];
  for (let row = 0; row < TOTAL_ROWS; row++) {
    for (let col = 0; col < TOTAL_COLUMNS; col++) {
      const squareId = `${row}-${col}`;
      const squareX = col - TOTAL_COLUMNS / 2 + 0.5; // Center the grid
      const squareZ = row - TOTAL_ROWS / 2 + 0.5;    // Center the grid
      
      let squarePlots;
      if (row === SPECIAL_ROW) {
        // Special row with only 2 plots per square
        squarePlots = createSpecialSquare(squareX, squareZ, squareId);
      } else {
        // Regular square with 4 plots
        squarePlots = createStandardSquare(squareX, squareZ, squareId);
      }
      
      squares.push({
        id: squareId,
        position: [squareX * SQUARE_SIZE, 0, squareZ * SQUARE_SIZE],
        plots: squarePlots,
        type: row === SPECIAL_ROW ? 'special' : 'regular',
      });
      
      // Add all plots to the main plots array
      plots.push(...squarePlots);
    }
  }
  
  // Verify we have 420 plots: 400 from regular squares + 20 from special row
  console.log(`Total plots generated: ${plots.length}`);
  
  return (
    <group>
      {/* Main Ground */}
      <Ground 
        position={[0, -0.1, 0]} 
        size={[SQUARE_SIZE * TOTAL_COLUMNS * 1.2, SQUARE_SIZE * TOTAL_ROWS * 1.2]} 
        type="grass" 
      />
      
      {/* Render River */}
      <RiverSystem />
      
      {/* Render all the street networks */}
      <StreetNetwork />
      
      {/* Render Central Park in the middle row */}
      <CentralParkRow />
      
      {/* Render District Elements */}
      <DistrictElements />
      
      {/* Render all plots */}
      {plots.map((plot, index) => (
        <Plot
          key={plot.id}
          id={plot.id}
          position={plot.position}
          isAvailable={true}
          onClick={onSelectPlot}
        />
      ))}
      
      {/* Additional decorative objects and buildings */}
      <DecorativeElements />
    </group>
  );
}

// Component for river system that crosses the map
function RiverSystem() {
  // Create a winding river that crosses the entire map
  const riverWidth = 20;
  const riverPoints = [];
  
  // Generate points for a winding river
  for (let i = -6; i <= 6; i++) {
    const x = i * 30;
    const z = Math.sin(i * 0.5) * 50; // Winding pattern
    riverPoints.push(new THREE.Vector3(x, 0, z));
  }
  
  const riverOptions = {
    width: riverWidth,
    color: "#4A90E2",
    raised: true,
    raiseHeight: 0.01,
  };
  
  return (
    <group>
      {/* River bed - slightly wider than the river itself */}
      <Ground 
        position={[0, -0.15, 0]} 
        size={[350, 50]} 
        type="water" 
        options={{ 
          animated: true, 
          opacity: 0.8, 
          color: "#3A80D2" 
        }} 
      />
      
      {/* River banks */}
      <PathStreet
        points={riverPoints.map(p => [p.x - riverWidth/2, 0, p.z])}
        options={{ 
          width: 2, 
          color: "#E8D4A9", // Sand color 
          raised: true, 
          raiseHeight: 0.02 
        }}
      />
      <PathStreet
        points={riverPoints.map(p => [p.x + riverWidth/2, 0, p.z])}
        options={{ 
          width: 2, 
          color: "#E8D4A9", // Sand color 
          raised: true, 
          raiseHeight: 0.02 
        }}
      />
      
      {/* Decorative elements along the river */}
      {riverPoints.map((point, i) => (
        <group key={`river-decor-${i}`} position={[point.x, 0, point.z]}>
          {i % 3 === 0 && (
            <PineTree position={[riverWidth/2 + 3, 0, -2]} scale={0.8} />
          )}
          {i % 3 === 1 && (
            <BonsaiTree position={[-riverWidth/2 - 3, 0, 2]} scale={0.7} />
          )}
          {i % 3 === 2 && (
            <HoverBench position={[riverWidth/2 + 4, 0.02, 0]} scale={0.8} />
          )}
        </group>
      ))}
      
      {/* Bridges over the river */}
      <Bridge position={[-90, 0, -10]} rotation={0.3} />
      <Bridge position={[0, 0, 0]} rotation={0} />
      <Bridge position={[90, 0, 15]} rotation={-0.3} />
    </group>
  );
}

// Component for a bridge
function Bridge({ position, rotation }) {
  const bridgeWidth = 8;
  const bridgeLength = 25;
  
  return (
    <group position={[position[0], 0, position[2]]} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[bridgeWidth, bridgeLength]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      
      {/* Railings */}
      <mesh position={[-bridgeWidth/2 + 0.5, 0.5, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.5, 1, bridgeLength]} />
        <meshStandardMaterial color="#5C3317" />
      </mesh>
      <mesh position={[bridgeWidth/2 - 0.5, 0.5, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.5, 1, bridgeLength]} />
        <meshStandardMaterial color="#5C3317" />
      </mesh>
    </group>
  );
}

// Component for the street network
function StreetNetwork() {
  // Main streets
  const mainStreetOptions = {
    width: 5,
    color: "#555555",
    midLine: true,
    midLineColor: "#FFFFFF",
    raised: true,
    raiseHeight: 0.02,
  };
  
  // Secondary streets
  const secondaryStreetOptions = {
    width: 4,
    color: "#666666",
    raised: true,
    raiseHeight: 0.015,
  };
  
  // Path streets
  const pathOptions = {
    width: 2,
    color: "#A9937C",
    raised: true,
    raiseHeight: 0.01,
  };
  
  return (
    <group>
      {/* Main Streets - Grid */}
      <GridStreet
        position={[0, 0, 0]}
        rows={5}
        columns={5}
        cellSize={60}
        streetWidth={5}
        options={mainStreetOptions}
      />
      
      {/* Diagonal Main Streets */}
      <DiagonalStreet
        position={[-120, 0, -120]}
        length={340}
        angle={Math.PI / 4}
        options={mainStreetOptions}
      />
      <DiagonalStreet
        position={[120, 0, -120]}
        length={340}
        angle={-Math.PI / 4}
        options={mainStreetOptions}
      />
      
      {/* Roundabouts at key intersections */}
      <Roundabout position={[60, 0, 60]} radius={12} innerRadius={6} options={mainStreetOptions} />
      <Roundabout position={[-60, 0, 60]} radius={12} innerRadius={6} options={mainStreetOptions} />
      <Roundabout position={[60, 0, -60]} radius={12} innerRadius={6} options={mainStreetOptions} />
      <Roundabout position={[-60, 0, -60]} radius={12} innerRadius={6} options={mainStreetOptions} />
      
      {/* Curved streets connecting roundabouts */}
      <RoundedStreet
        position={[0, 0, 60]}
        radius={60}
        angle={Math.PI}
        options={secondaryStreetOptions}
      />
      <RoundedStreet
        position={[0, 0, -60]}
        radius={60}
        angle={Math.PI}
        options={secondaryStreetOptions}
      />
      
      {/* Elliptical streets around central features */}
      <EllipseStreet
        position={[0, 0, 0]}
        radiusX={120}
        radiusY={80}
        options={secondaryStreetOptions}
      />
      
      {/* Organic paths connecting different areas */}
      <PathStreet
        points={[
          [-100, 0, -80],
          [-80, 0, -60],
          [-60, 0, -20],
          [-30, 0, 0],
          [0, 0, 20],
          [30, 0, 40],
          [60, 0, 60],
          [90, 0, 50],
        ]}
        options={pathOptions}
      />
      
      <PathStreet
        points={[
          [100, 0, -80],
          [80, 0, -60],
          [60, 0, -20],
          [30, 0, 0],
          [0, 0, -20],
          [-30, 0, -40],
          [-60, 0, -60],
          [-90, 0, -50],
        ]}
        options={pathOptions}
      />
      
      {/* Junctions at other key intersections */}
      {[-120, -60, 0, 60, 120].map((x) => (
        [-120, -60, 0, 60, 120].map((z) => (
          <Junction
            key={`junction-${x}-${z}`}
            position={[x, 0, z]}
            size={6}
            options={mainStreetOptions}
          />
        ))
      ))}
    </group>
  );
}

// Component for the special central park row
function CentralParkRow() {
  return (
    <group position={[0, 0, 0]}>
      {/* Central Park with lake */}
      <Ground
        position={[0, -0.05, 0]}
        size={[200, 60]}
        type="park"
        options={{ color: "#57A639" }}
      />
      
      {/* Central Lake */}
      <Ground
        position={[0, -0.04, 0]}
        size={[80, 30]}
        type="water"
        options={{ animated: true, opacity: 0.8 }}
      />
      
      {/* Central park features */}
      <CentralPark position={[0, -0.03, 0]} scale={1.5} />
      
      {/* Park decorative elements */}
      {[[-40, 10], [-20, -15], [20, 15], [40, -10]].map((pos, i) => (
        <group key={`park-decor-${i}`} position={[pos[0], 0, pos[1]]}>
          <HoverBench position={[0, 0.02, 3]} scale={0.8} />
          <StreetLamp position={[3, 0.02, 0]} scale={0.9} />
          {i % 2 === 0 ? (
            <FloatingTree position={[-3, 0, -3]} scale={0.8} />
          ) : (
            <MushroomTree position={[-3, 0, -3]} scale={0.8} />
          )}
        </group>
      ))}
      
      {/* Landmarks in the central row */}
      <PixelObservatory position={[-90, 0, 0]} scale={1.2} />
      <PixelatedDonutStatue position={[90, 0, 0]} scale={1.5} />
    </group>
  );
}

// Component for district-specific elements
function DistrictElements() {
  // Create distinct districts with different themes
  return (
    <group>
      {/* Tech District - Northeast */}
      <group position={[90, 0, 90]}>
        <PlanetExpressBuilding position={[0, 0, 0]} scale={[1.5, 1.5, 1.5]} />
        <PixelatedMoistureVaporator position={[20, 0, 20]} scale={1.2} />
        <PixelatedEnergyCube position={[-20, 0, 20]} scale={1} />
        <PixelSpaceStation position={[15, 0, -15]} scale={0.8} />
        
        {/* Tech district decorations */}
        {[[-10, -10], [10, 10], [-15, 15], [15, -10]].map((pos, i) => (
          <group key={`tech-decor-${i}`} position={[pos[0], 0, pos[1]]}>
            <HologramBillboard position={[0, 0.02, 0]} scale={0.8} />
            {i % 2 === 0 && <RobotPet position={[3, 0.02, 3]} scale={0.7} />}
          </group>
        ))}
      </group>
      
      {/* Entertainment District - Northwest */}
      <group position={[-90, 0, 90]}>
        <PixelDiner position={[0, 0, 0]} scale={1.2} />
        <RetroArcadeCabinet position={[15, 0, 15]} scale={1.5} />
        <PixelFestivalArea position={[-15, 0, -15]} scale={1.3} />
        
        {/* Entertainment district decorations */}
        {[[-10, 10], [10, -10], [-15, -15], [15, 15]].map((pos, i) => (
          <group key={`ent-decor-${i}`} position={[pos[0], 0, pos[1]]}>
            <HologramBillboard position={[0, 0.02, 0]} scale={0.8} />
            <StreetLamp position={[3, 0.02, 3]} scale={0.9} />
            {i % 2 === 0 && <FuturamaMailbox position={[-3, 0.02, -3]} scale={0.7} />}
          </group>
        ))}
      </group>
      
      {/* Academic District - Southwest */}
      <group position={[-90, 0, -90]}>
        <PixelLibrary position={[0, 0, 0]} scale={1.2} />
        <PixelClockTower position={[15, 0, -15]} scale={1} />
        
        {/* Academic district decorations */}
        {[[-10, -10], [10, 10], [-15, 15], [15, -10]].map((pos, i) => (
          <group key={`acad-decor-${i}`} position={[pos[0], 0, pos[1]]}>
            <HoverBench position={[0, 0.02, 0]} scale={0.8} />
            <BonsaiTree position={[4, 0, 0]} scale={0.8} />
            {i % 2 === 0 && <StreetLamp position={[-4, 0.02, 0]} scale={0.9} />}
          </group>
        ))}
      </group>
      
      {/* Nature District - Southeast */}
      <group position={[90, 0, -90]}>
        <PixelTreehouseVillage position={[0, 0, 0]} scale={1.2} />
        <PixelatedMountainWithWaterfall position={[-15, 0, -15]} scale={1.5} />
        <FloatingIsland position={[15, 0, -15]} scale={1} />
        
        {/* Nature district decorations */}
        {[[-10, 10], [10, -10], [-15, -5], [15, 5]].map((pos, i) => {
          const treeType = i % 4;
          return (
            <group key={`nature-decor-${i}`} position={[pos[0], 0, pos[1]]}>
              {treeType === 0 && <PineTree position={[0, 0, 0]} scale={0.9} />}
              {treeType === 1 && <CrystalTree position={[0, 0, 0]} scale={0.8} />}
              {treeType === 2 && <FloatingTree position={[0, 0, 0]} scale={0.9} />}
              {treeType === 3 && <MushroomTree position={[0, 0, 0]} scale={0.8} />}
            </group>
          );
        })}
      </group>
      
      {/* Commercial District - East Central */}
      <group position={[120, 0, 0]}>
        <PixelFarmersMarket position={[0, 0, 0]} scale={1.2} />
        <FuturamaMonument position={[20, 0, 0]} scale={0.8} />
        
        {/* Commercial district decorations */}
        {[[-10, -10], [10, 10], [-10, 10], [10, -10]].map((pos, i) => (
          <group key={`comm-decor-${i}`} position={[pos[0], 0, pos[1]]}>
            <HologramBillboard position={[0, 0.02, 0]} scale={0.8} />
            {i % 2 === 0 && <StreetLamp position={[3, 0.02, 3]} scale={0.9} />}
            {i % 2 === 1 && <HoverBench position={[-3, 0.02, -3]} scale={0.8} />}
          </group>
        ))}
      </group>
      
      {/* Community Hub - West Central */}
      <group position={[-120, 0, 0]}>
        <CommunityCenterBuilding position={[0, 0, 0]} scale={1.5} />
        <DirectoryBuilding position={[20, 0, 20]} scale={1.5} />
        <FeedbackBuilding position={[-20, 0, 20]} scale={1.5} />
        
        {/* Hub decorations */}
        {[[-10, -10], [10, 10], [-20, -20], [20, -20]].map((pos, i) => (
          <group key={`hub-decor-${i}`} position={[pos[0], 0, pos[1]]}>
            <StreetLamp position={[0, 0.02, 0]} scale={0.9} />
            {i % 2 === 0 && <HoverBench position={[3, 0.02, 3]} scale={0.8} />}
            {i % 2 === 1 && <FuturamaMailbox position={[-3, 0.02, -3]} scale={0.7} />}
          </group>
        ))}
      </group>
    </group>
  );
}

// Component for miscellaneous decorative elements
function DecorativeElements() {
  // Create arrays to hold decorative elements
  const decorElements = [];
  
  // Add trees throughout the map (avoiding plots and streets)
  for (let i = 0; i < 100; i++) {
    const x = (Math.random() - 0.5) * 300;
    const z = (Math.random() - 0.5) * 300;
    
    // Skip if too close to streets or plots
    if (Math.abs(x % 30) < 10 || Math.abs(z % 30) < 10) continue;
    
    const treeType = Math.floor(Math.random() * 5);
    const scale = 0.6 + Math.random() * 0.4;
    
    switch (treeType) {
      case 0:
        decorElements.push(<PineTree key={`tree-${i}`} position={[x, 0, z]} scale={scale} />);
        break;
      case 1:
        decorElements.push(<MushroomTree key={`tree-${i}`} position={[x, 0, z]} scale={scale} />);
        break;
      case 2:
        decorElements.push(<CrystalTree key={`tree-${i}`} position={[x, 0, z]} scale={scale} />);
        break;
      case 3:
        decorElements.push(<FloatingTree key={`tree-${i}`} position={[x, 0, z]} scale={scale} />);
        break;
      default:
        decorElements.push(<BonsaiTree key={`tree-${i}`} position={[x, 0, z]} scale={scale} />);
    }
  }
  
  // Add street furniture along streets
  for (let i = 0; i < 50; i++) {
    // Place along streets (aligned with grid)
    const grid = 30;
    const offset = 6;
    
    let x, z;
    if (Math.random() < 0.5) {
      // Align with X streets
      x = (Math.floor(Math.random() * 11) - 5) * grid;
      z = (Math.floor(Math.random() * 11) - 5) * grid + (Math.random() < 0.5 ? offset : -offset);
    } else {
      // Align with Z streets
      x = (Math.floor(Math.random() * 11) - 5) * grid + (Math.random() < 0.5 ? offset : -offset);
      z = (Math.floor(Math.random() * 11) - 5) * grid;
    }
    
    const objectType = Math.floor(Math.random() * 5);
    const scale = 0.7 + Math.random() * 0.3;
    const position = [x, 0.02, z]; // Slightly raised to prevent z-fighting
    
    switch (objectType) {
      case 0:
        decorElements.push(<FuturamaMailbox key={`mail-${i}`} position={position} scale={scale} />);
        break;
      case 1:
        decorElements.push(<HoverBench key={`bench-${i}`} position={position} scale={scale} />);
        break;
      case 2:
        decorElements.push(<StreetLamp key={`lamp-${i}`} position={position} scale={scale} />);
        break;
      case 3:
        decorElements.push(<HologramBillboard key={`billboard-${i}`} position={position} scale={scale} />);
        break;
      default:
        decorElements.push(<RobotPet key={`pet-${i}`} position={position} scale={scale} />);
    }
  }
  
  return <group>{decorElements}</group>;
}