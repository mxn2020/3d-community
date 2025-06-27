export const ITEM_CATEGORIES = {
  PLOT: 'plot',
  BUILDING: 'building',
  LANDMARK: 'landmark',
  DECORATIVE: 'decorative',
  STREET: 'street',
  GROUND: 'ground',
  // MAP_BACKGROUND category is removed as background is now a map-level property
};

export const ITEM_TYPES: Record<string, Array<{ id: string; name: string; color: string; defaultWidth?: number; defaultHeight?: number; elevationOffset?: number }>> = {
  [ITEM_CATEGORIES.PLOT]: [
    { id: 'plot-standard', name: 'Standard Plot', color: '#d5e8d4', defaultWidth: 10, defaultHeight: 10 },
    { id: 'plot-premium', name: 'Premium Plot', color: '#b5e7a0', defaultWidth: 15, defaultHeight: 10 },
    { id: 'plot-commercial', name: 'Commercial Plot', color: '#e1d5e7', defaultWidth: 20, defaultHeight: 15 },
  ],
  [ITEM_CATEGORIES.BUILDING]: [
    { id: 'building-community-center', name: 'Community Center', color: '#4ECDC4', defaultWidth: 8, defaultHeight: 6 },
    { id: 'building-directory', name: 'Directory Building', color: '#FF6B6B', defaultWidth: 5, defaultHeight: 5 },
    { id: 'building-feedback', name: 'Feedback Building', color: '#C7B3E5', defaultWidth: 4, defaultHeight: 4 },
  ],
  [ITEM_CATEGORIES.LANDMARK]: [
    { id: 'landmark-centralpark', name: 'Central Park', color: '#8CC084', defaultWidth: 20, defaultHeight: 15 },
    { id: 'landmark-mountain-with-waterfall', name: 'Statue', color: '#FFD700', defaultWidth: 3, defaultHeight: 5 },
    { id: 'landmark-clock-tower', name: 'Waterfall', color: '#1e88e5', defaultWidth: 5, defaultHeight: 10 },
  ],
  [ITEM_CATEGORIES.DECORATIVE]: [
    { id: 'decorative-tree-pine', name: 'Pine Tree', color: '#6B8E23', defaultWidth: 1, defaultHeight: 1 },
    { id: 'decorative-tree-mushroom', name: 'Mushroom Tree', color: '#8B4513', defaultWidth: 1, defaultHeight: 1 },
    { id: 'decorative-tree-crystal', name: 'Crystal Tree', color: '#87CEEB', defaultWidth: 1, defaultHeight: 1 },
    { id: 'decorative-tree-floating', name: 'Floating Tree', color: '#9370DB', defaultWidth: 1, defaultHeight: 1 },
    { id: 'decorative-tree-bonsai', name: 'Bonsai Tree', color: '#8B0000', defaultWidth: 1, defaultHeight: 1 },
    { id: 'decorative-tree-tree', name: 'Tree', color: '#228B22', defaultWidth: 1, defaultHeight: 1 },
    { id: 'decorative-tree-forest', name: 'Forest Tree', color: '#2E8B57', defaultWidth: 1, defaultHeight: 1 },
    { id: 'decorative-mailbox', name: 'Mailbox', color: '#CD5C5C', defaultWidth: 0.5, defaultHeight: 0.5 },
    { id: 'decorative-bench', name: 'Bench', color: '#A0522D', defaultWidth: 1.5, defaultHeight: 0.5 },
    { id: 'decorative-lamp', name: 'Street Lamp', color: '#FFD700', defaultWidth: 0.5, defaultHeight: 2 },
    { id: 'decorative-billboard', name: 'Hologram Billboard', color: '#00CED1', defaultWidth: 3, defaultHeight: 2 },
    { id: 'decorative-robot-pet', name: 'Robot Pet', color: '#C0C0C0', defaultWidth: 0.7, defaultHeight: 0.7 },
  ],
  [ITEM_CATEGORIES.STREET]: [
    { id: 'street-main', name: 'Main Street', color: '#555555', defaultWidth: 2, defaultHeight: 10, elevationOffset: 0.00 }, // Height here can be interpreted as length for a segment
    { id: 'street-rounded', name: 'Secondary Street', color: '#666666', defaultWidth: 1.5, defaultHeight: 8, elevationOffset: 0.00 },
    { id: 'street-path', name: 'Walking Path', color: '#d2b48c', defaultWidth: 1, defaultHeight: 5, elevationOffset: -0.005 },
    { id: 'street-rounded', name: 'Rounded Street', color: '#888888', defaultWidth: 1.5, defaultHeight: 8, elevationOffset: 0.00 },
    { id: 'street-ellipse', name: 'Elliptical Street', color: '#999999', defaultWidth: 2, defaultHeight: 10, elevationOffset: 0.00 },
    { id: 'street-roundabout', name: 'Roundabout', color: '#AAAAAA', defaultWidth: 3, defaultHeight: 3, elevationOffset: 0.00 },
    { id: 'street-junction', name: 'Junction', color: '#BBBBBB', defaultWidth: 2, defaultHeight: 2, elevationOffset: 0.00 },
    { id: 'street-diagonal', name: 'Diagonal Street', color: '#CCCCCC', defaultWidth: 1.5, defaultHeight: 8, elevationOffset: 0.00 },
    { id: 'street-path', name: 'Pathway', color: '#D3D3D3', defaultWidth: 1, defaultHeight: 5, elevationOffset: -0.005 },
    { id: 'street-bridge', name: 'Bridge', color: '#B0C4DE', defaultWidth: 2, defaultHeight: 10, elevationOffset: 0.02 },
    { id: 'street-railroad', name: 'Railroad', color: '#8B0000', defaultWidth: 2, defaultHeight: 10, elevationOffset: 0.00 },
    { id: 'street-curve', name: 'Curved Street', color: '#A9A9A9', defaultWidth: 1.5, defaultHeight: 8, elevationOffset: 0.00 },
    { id: 'street-traffic-circle', name: 'Traffic Circle', color: '#808080', defaultWidth: 3, defaultHeight: 3, elevationOffset: 0.00 },
    { id: 'street-parking-lot', name: 'Parking Lot', color: '#696969', defaultWidth: 10, defaultHeight: 10, elevationOffset: 0.00 },
    { id: 'street-sidewalk', name: 'Sidewalk', color: '#C0C0C0', defaultWidth: 1, defaultHeight: 5, elevationOffset: -0.005 },
  ],
  [ITEM_CATEGORIES.GROUND]: [
    { id: 'ground-grass', name: 'Grass', color: '#8CC084', defaultWidth: 5, defaultHeight: 5, elevationOffset: 0.00 },
    { id: 'ground-street', name: 'Paved Street (Ground)', color: '#AAAAAA', defaultWidth: 10, defaultHeight: 10, elevationOffset: 0.02 },
    { id: 'ground-water', name: 'Water', color: '#1e88e5', defaultWidth: 10, defaultHeight: 10, elevationOffset: 0.04 },
    { id: 'ground-sand', name: 'Sand', color: '#F5DEB3', defaultWidth: 5, defaultHeight: 5, elevationOffset: 0.01 },
    { id: 'ground-park', name: 'Park Ground', color: '#228B22', defaultWidth: 10, defaultHeight: 10, elevationOffset: 0.00 },
    { id: 'ground-dirt', name: 'Dirt', color: '#8B4513', defaultWidth: 5, defaultHeight: 5, elevationOffset: 0.00 },
    { id: 'ground-rock', name: 'Rocky Ground', color: '#A9A9A9', defaultWidth: 5, defaultHeight: 5, elevationOffset: 0.00 },
    { id: 'ground-snow', name: 'Snowy Ground', color: '#FFFFFF', defaultWidth: 5, defaultHeight: 5, elevationOffset: 0.00 },
    { id: 'ground-lava', name: 'Lava', color: '#FF4500', defaultWidth: 5, defaultHeight: 5, elevationOffset: 0.00 },
    { id: 'ground-toxic', name: 'Toxic Waste', color: '#32CD32', defaultWidth: 5, defaultHeight: 5, elevationOffset: 0.00 },
  ],
  // MAP_BACKGROUND types removed
};

