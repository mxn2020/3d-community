// admin/map-editor/page.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Building,
  TreePine,
  MapPin,
  Mail,
  Zap,
  Hexagon,
  Hash,
  Save,
  Download,
  Upload,
  Plus,
  Trash2,
  Move,
  LayersIcon, // Renamed to avoid conflict with Layers component if any
  Copy,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Palette,
  Sparkles,
  Sun,
  Cloud,
  MousePointer,
  Minus,
} from 'lucide-react';

import * as THREE from "three";

import { useMap } from '@/lib/queries/map-queries';
import { useSaveMap, useDeleteMap, useSetMapActive } from '@/lib/mutations/map-mutations';

import type { MapItem, MapData, MapLayer, MapEnvironment } from '@/lib/types/map-schemas';
import { MapDataSchema, SaveMapInputSchema, MapEnvironmentSchema } from '@/lib/types/map-schemas';
import { ITEM_CATEGORIES, ITEM_TYPES } from '@/lib/types/constants';

const NON_DELETABLE_LAYER_NAMES_LOWERCASE = ['map background', 'ground']; // Add other essential layer names here, in lowercase

const generateId = () => crypto.randomUUID();

const getItemIcon = (type: string) => {
  if (type.startsWith('plot-')) return <Hexagon className="w-4 h-4" />;
  if (type.startsWith('building-')) return <Building className="w-4 h-4" />;
  if (type.startsWith('decorative-tree')) return <TreePine className="w-4 h-4" />;
  if (type.startsWith('decorative-mailbox')) return <Mail className="w-4 h-4" />;
  if (type.startsWith('decorative-lamp')) return <Zap className="w-4 h-4" />;
  if (type.startsWith('street-')) return <MapPin className="w-4 h-4" />;
  if (type.startsWith('ground-')) return <LayersIcon className="w-4 h-4" />; // Changed from Layers
  return <Hash className="w-4 h-4" />;
};

const getDefaultMapData = (): MapData => {
  const parsedDefaults = MapDataSchema.parse({
    name: 'New Community Map',
    description: 'A new map layout',
    width: 150,
    height: 150,
    items: [],
    // environment will use its defaults from the schema
  });
  return {
    ...parsedDefaults,
    id: undefined,
    environment: parsedDefaults.environment, // Ensure environment is initialized
  };
};


export default function MapEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mapId = searchParams.get('id');
  const [activeCategory, setActiveCategory] = useState(ITEM_CATEGORIES.GROUND);
  const [activeItemType, setActiveItemType] = useState('');

  const [mapData, setMapData] = useState<MapData>(getDefaultMapData);

  const [selectedItem, setSelectedItem] = useState<MapItem | null>(null);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(() => mapData.layers.find(l => l.name === 'Ground')?.id || (mapData.layers[1]?.id || null)); // Default to Ground or second layer
  const [isConfirmLayerDeleteDialogOpen, setIsConfirmLayerDeleteDialogOpen] = useState(false);
  const [layerIdToConfirmDelete, setLayerIdToConfirmDelete] = useState<string | null>(null);
  const [draggingItem, setDraggingItem] = useState<string | null>(null); // For moving existing items
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('design');
  const [importData, setImportData] = useState('');
  const [jsonCopied, setJsonCopied] = useState(false);
  const [activeTool, setActiveTool] = useState<'place' | 'move' | 'delete' | 'select' | 'delete' | 'rotate'>('select');
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(1); // Default grid size to 1 for finer control with multi-unit items
  const [zoom, setZoom] = useState(0.5);
  const [pixelsPerUnit, setPixelsPerUnit] = useState(20);
  const [currentColor, setCurrentColor] = useState('#8CC084');

  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // For click-and-drag item creation
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStartCoords, setDrawStartCoords] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrentCoords, setDrawCurrentCoords] = useState<{ x: number; y: number } | null>(null);

  const [selectedItems, setSelectedItems] = useState<MapItem[]>([]); // Multiple selection
  const [isSelectionRectangle, setIsSelectionRectangle] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);
  const [multiSelectFilters, setMultiSelectFilters] = useState({
    includeAllTypes: true,
    includedCategories: Object.values(ITEM_CATEGORIES),
    includedTypes: [] as string[]
  });


  const {
    data: mapDetail,
    isLoading: isLoadingMap,
    error: mapError
  } = useMap(mapId || '', { enabled: !!mapId });

  const saveMapMutation = useSaveMap();
  const deleteMapMutation = useDeleteMap();
  const setMapActiveMutation = useSetMapActive();

  const isBackgroundLayerSelected = useCallback(() => {
    const layer = mapData.layers.find(l => l.id === selectedLayerId);
    return layer?.name === 'Map Background';
  }, [selectedLayerId, mapData.layers]);

const isItemInSelectionRectangle = (item: MapItem, startCoords: { x: number; y: number }, endCoords: { x: number; y: number }): boolean => {
  const rectLeft = Math.min(startCoords.x, endCoords.x);
  const rectRight = Math.max(startCoords.x, endCoords.x);
  const rectTop = Math.min(startCoords.y, endCoords.y);
  const rectBottom = Math.max(startCoords.y, endCoords.y);

  const itemLeft = item.x;
  const itemRight = item.x + (item.width || 1);
  const itemTop = item.y;
  const itemBottom = item.y + (item.height || 1);

  // Check if item overlaps with selection rectangle
  return !(itemRight < rectLeft || itemLeft > rectRight || itemBottom < rectTop || itemTop > rectBottom);
};

const shouldIncludeInMultiSelect = (item: MapItem): boolean => {
  if (multiSelectFilters.includeAllTypes) return true;
  
  return multiSelectFilters.includedCategories.includes(item.category) ||
         multiSelectFilters.includedTypes.includes(item.type);
};


  const rotateSelectedItems = (degrees: number) => {
    if (selectedItems.length === 0) return;

    setMapData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        const selectedItem = selectedItems.find(si => si.id === item.id);
        if (selectedItem) {
          const newRotation = ((item.rotation || 0) + degrees) % 360;
          // Store facing direction in properties for plots
          const newProperties = item.category === ITEM_CATEGORIES.PLOT
            ? { ...item.properties, facingDirection: newRotation }
            : item.properties;

          return { ...item, rotation: newRotation, properties: newProperties };
        }
        return item;
      }),
    }));

    // Update selected items state
    setSelectedItems(prev => prev.map(item => ({
      ...item,
      rotation: ((item.rotation || 0) + degrees) % 360,
      properties: item.category === ITEM_CATEGORIES.PLOT
        ? { ...item.properties, facingDirection: ((item.rotation || 0) + degrees) % 360 }
        : item.properties
    })));

    toast.success(`Rotated ${selectedItems.length} item(s) by ${degrees}°`);
  };

  // Helper to derive the appropriate tool/category from a selected layer
  const deriveCategoryFromLayer = (layerId: string | null, layers: MapLayer[], currentActiveCategory?: string): string | null => {
    if (!layerId) return null;
    const layer = layers.find(l => l.id === layerId);
    if (!layer || layer.name === 'Map Background') return null;

    const layerNameLower = layer.name.toLowerCase();
    if (layerNameLower.includes('water')) return ITEM_CATEGORIES.GROUND;
    if (layerNameLower.includes('ground')) return ITEM_CATEGORIES.GROUND;
    if (layerNameLower.includes('plot')) return ITEM_CATEGORIES.PLOT;
    if (layerNameLower.includes('street')) return ITEM_CATEGORIES.STREET;
    if (layerNameLower.includes('buildings')) return ITEM_CATEGORIES.BUILDING;
    if (layerNameLower.includes('decorative')) return ITEM_CATEGORIES.DECORATIVE;
    if (layerNameLower.includes('object')) {
      // If current tool is already Building or Decorative (and layer is 'Objects'), keep it.
      if (currentActiveCategory === ITEM_CATEGORIES.BUILDING || currentActiveCategory === ITEM_CATEGORIES.DECORATIVE) {
        return currentActiveCategory;
      }
      return ITEM_CATEGORIES.BUILDING; // Default for "Objects"
    }
    return null; // No specific category derived
  };

  // Helper to get the default item (type and color) for a category
  const getDefaultItemForCategory = (category: string): { id: string; color: string } | null => {
    if (category && ITEM_TYPES[category]?.length > 0) {
      const defaultItemType = ITEM_TYPES[category][0];
      return { id: defaultItemType.id, color: defaultItemType.color };
    }
    return null;
  };

  // Helper to derive the appropriate layer from the selected tool/category and item type
  const deriveLayerFromTool = (category: string, itemType: string, layers: MapLayer[]): string | null => {
    if (!category || !layers || layers.length === 0) return null;

    const findLayerByNameHelper = (primaryNameExact: string, generalNamePart: string): MapLayer | undefined => {
      let l = layers.find(lyr => lyr.name.toLowerCase() === primaryNameExact.toLowerCase() && lyr.name !== 'Map Background' && lyr.visible);
      if (!l) {
        l = layers.find(lyr => lyr.name.toLowerCase().includes(generalNamePart.toLowerCase()) && lyr.name !== 'Map Background' && lyr.visible);
      }
      return l;
    };

    let targetLayer: MapLayer | undefined;
    if (category === ITEM_CATEGORIES.GROUND) {
      if (itemType === 'ground-water') targetLayer = findLayerByNameHelper('Water', 'water');
      else targetLayer = findLayerByNameHelper('Ground', 'ground');
    } else if (category === ITEM_CATEGORIES.PLOT) {
      targetLayer = findLayerByNameHelper('Plots', 'plot');
    } else if (category === ITEM_CATEGORIES.STREET) {
      targetLayer = findLayerByNameHelper('Streets', 'street');
    } else if (category === ITEM_CATEGORIES.BUILDING) {
      targetLayer = findLayerByNameHelper('Objects', 'object');
      if (!targetLayer) targetLayer = findLayerByNameHelper('Buildings', 'building');
    } else if (category === ITEM_CATEGORIES.DECORATIVE) {
      targetLayer = findLayerByNameHelper('Objects', 'object');
      if (!targetLayer) targetLayer = findLayerByNameHelper('Decorative', 'decorative');
    }
    return targetLayer ? targetLayer.id : null;
  };

  // Inside your MapEditor component
  const isLayerDeletable = (layerToCheck: MapLayer, allLayers: MapLayer[]): boolean => {
    // Check against the non-deletable names list
    if (NON_DELETABLE_LAYER_NAMES_LOWERCASE.includes(layerToCheck.name.toLowerCase())) {
      return false;
    }

    // Check if it's the last *actually deletable* layer.
    // A layer is "actually deletable" if it's not in the NON_DELETABLE_LAYER_NAMES_LOWERCASE list.
    const trulyDeletableLayers = allLayers.filter(
      l => !NON_DELETABLE_LAYER_NAMES_LOWERCASE.includes(l.name.toLowerCase())
    );

    // If this layer is among the "truly deletable layers" and it's the only one left in that group.
    if (trulyDeletableLayers.length <= 1 && trulyDeletableLayers.find(l => l.id === layerToCheck.id)) {
      return false;
    }

    return true;
  };

  // This function is called when the user clicks the delete icon for a layer
  const initiateLayerDeletion = (layerId: string) => {
    const layerToRemove = mapData.layers.find(l => l.id === layerId);
    if (!layerToRemove) return;

    if (!isLayerDeletable(layerToRemove, mapData.layers)) {
      if (NON_DELETABLE_LAYER_NAMES_LOWERCASE.includes(layerToRemove.name.toLowerCase())) {
        toast.error(`The '${layerToRemove.name}' layer is essential and cannot be deleted.`);
      } else {
        // This case implies it's the last "truly deletable" layer
        toast.error("Cannot delete the last remaining operational layer.");
      }
      return;
    }

    // If the layer is deletable, open the confirmation dialog
    setLayerIdToConfirmDelete(layerId);
    setIsConfirmLayerDeleteDialogOpen(true);
  };

  // This function is called when the user confirms the deletion in the dialog
  const executeLayerDeletion = () => {
    if (!layerIdToConfirmDelete) return;

    const layerBeingDeleted = mapData.layers.find(l => l.id === layerIdToConfirmDelete);
    const layerNameDisplay = layerBeingDeleted?.name || "The layer";

    setMapData(prev => {
      const updatedLayers = prev.layers.filter(l => l.id !== layerIdToConfirmDelete);
      return {
        ...prev,
        items: prev.items.filter(item => item.layerId !== layerIdToConfirmDelete),
        layers: updatedLayers,
      };
    });

    toast.success(`Layer '${layerNameDisplay}' and its items have been deleted.`);

    // If the deleted layer was the currently selected one, update selectedLayerId.
    // Setting it to null will allow the useEffect for initial/sync to pick a new default.
    if (selectedLayerId === layerIdToConfirmDelete) {
      setSelectedLayerId(null);
      // The existing useEffect that handles `!currentSelectedLayerIsValid`
      // will then call `handleLayerSelected` with a new suitable layer.
    }

    // Close and reset dialog state
    setIsConfirmLayerDeleteDialogOpen(false);
    setLayerIdToConfirmDelete(null);
  };

  const cancelLayerDeletion = () => {
    setIsConfirmLayerDeleteDialogOpen(false);
    setLayerIdToConfirmDelete(null);
  };

  const handleLayerSelected = (newLayerId: string | null) => {
    if (newLayerId === selectedLayerId || !newLayerId) return;

    console.log('[Handler] Layer Selected:', newLayerId);
    setSelectedLayerId(newLayerId);

    // Determine and set the corresponding category and default item
    const newCategory = deriveCategoryFromLayer(newLayerId, mapData.layers, activeCategory);

    if (newCategory && newCategory !== activeCategory) {
      console.log('[Handler] Layer causes Category change to:', newCategory);
      setActiveCategory(newCategory);
      const defaultItem = getDefaultItemForCategory(newCategory);
      if (defaultItem) {
        setActiveItemType(defaultItem.id);
        setCurrentColor(defaultItem.color);
      } else {
        setActiveItemType('');
        // Consider setting a default color or leaving as is
      }
    } else if (newCategory === null && activeCategory !== null) {
      // Layer doesn't map to a clear category, perhaps clear current tool
      // setActiveCategory(null); // Or some default/select tool state
      // setActiveItemType('');
      console.log('[Handler] Selected layer does not map to a clear category. Tool remains:', activeCategory);
    } else if (newCategory === activeCategory) {
      // Category is already correct, but ensure default item type for this category is set
      // (e.g. if user switches between two "Ground" layers, item type should remain consistent or reset to default for Ground)
      const defaultItem = getDefaultItemForCategory(newCategory);
      if (defaultItem && activeItemType !== defaultItem.id) {
        // This part is optional: only reset item if it's not already the default or a valid item for the category
        // For simplicity, if category matches, current item type for that category might be kept.
        // Or, enforce default:
        // setActiveItemType(defaultItem.id);
        // setCurrentColor(defaultItem.color);
      }
    }
  };

  const handleCategorySelected = (newCategory: string) => {
    if (newCategory === activeCategory) return;

    console.log('[Handler] Category Selected:', newCategory);
    setActiveCategory(newCategory);

    // Set default item type and color for the new category
    const defaultItem = getDefaultItemForCategory(newCategory);
    let newItemTypeForLayerDerivation = '';
    if (defaultItem) {
      setActiveItemType(defaultItem.id);
      setCurrentColor(defaultItem.color);
      newItemTypeForLayerDerivation = defaultItem.id;
    } else {
      setActiveItemType('');
      // Consider a default color
    }

    // Determine and set the corresponding layer
    const newLayerId = deriveLayerFromTool(newCategory, newItemTypeForLayerDerivation, mapData.layers);
    if (newLayerId && newLayerId !== selectedLayerId) {
      // Stability check: ensure this new layer wouldn't immediately pick a *different* category
      const categoryFromNewLayer = deriveCategoryFromLayer(newLayerId, mapData.layers, newCategory);
      if (categoryFromNewLayer === newCategory || categoryFromNewLayer === null) {
        console.log('[Handler] Category causes Layer change to:', newLayerId);
        setSelectedLayerId(newLayerId);
      } else {
        console.warn(`[Handler] Category "${newCategory}" suggests layer "${mapData.layers.find(l => l.id === newLayerId)?.name}", but that layer implies category "${categoryFromNewLayer}". Layer switch aborted.`);
      }
    }
  };

  const handleItemTypeSelected = (newItemType: string) => {
    if (newItemType === activeItemType || !activeCategory) return;

    console.log('[Handler] Item Type Selected:', newItemType);
    setActiveItemType(newItemType);

    // Update color based on new item type
    const itemDetails = ITEM_TYPES[activeCategory]?.find(it => it.id === newItemType);
    if (itemDetails) {
      setCurrentColor(itemDetails.color);
    }

    // Determine if layer needs to change based on new item type (e.g., "ground-water")
    const newLayerId = deriveLayerFromTool(activeCategory, newItemType, mapData.layers);
    if (newLayerId && newLayerId !== selectedLayerId) {
      // Stability check
      const categoryFromNewLayer = deriveCategoryFromLayer(newLayerId, mapData.layers, activeCategory);
      if (categoryFromNewLayer === activeCategory || categoryFromNewLayer === null) {
        console.log('[Handler] Item Type causes Layer change to:', newLayerId);
        setSelectedLayerId(newLayerId);
      } else {
        console.warn(`[Handler] Item type "${newItemType}" (cat: "${activeCategory}") suggests layer "${mapData.layers.find(l => l.id === newLayerId)?.name}", but that layer implies category "${categoryFromNewLayer}". Layer switch aborted.`);
      }
    }
  };


  useEffect(() => {
    if (mapData.layers.length > 0 && !selectedLayerId) {
      const groundLayer = mapData.layers.find(l => l.name === 'Ground');
      setSelectedLayerId(groundLayer?.id || mapData.layers.find(l => l.name !== 'Map Background')?.id || mapData.layers[0].id);
    }
  }, [mapData.layers, selectedLayerId]);

  useEffect(() => {
    if (activeCategory && ITEM_TYPES[activeCategory]?.length > 0) {
      const defaultItem = ITEM_TYPES[activeCategory][0];
      setActiveItemType(defaultItem.id);
      setCurrentColor(defaultItem.color);
    } else {
      setActiveItemType('');
    }
  }, [activeCategory]);


  useEffect(() => {
    if (mapDetail) {
      const parsedMapData = MapDataSchema.safeParse(mapDetail.mapData);
      if (parsedMapData.success) {
        setMapData({
          id: mapDetail.id,
          name: mapDetail.name || 'Untitled Map',
          description: mapDetail.description || '',
          width: parsedMapData.data.width,
          height: parsedMapData.data.height,
          items: parsedMapData.data.items,
          layers: parsedMapData.data.layers && parsedMapData.data.layers.length > 0
            ? parsedMapData.data.layers
            : getDefaultMapData().layers,
          environment: parsedMapData.data.environment || getDefaultMapData().environment,
        });

        if (parsedMapData.data.layers && parsedMapData.data.layers.length > 0) {
          const groundLayer = parsedMapData.data.layers.find(l => l.name === "Ground");
          setSelectedLayerId(groundLayer?.id || parsedMapData.data.layers.find(l => l.name !== 'Map Background')?.id || parsedMapData.data.layers[0].id);
        } else {
          const defaultLayers = getDefaultMapData().layers;
          const groundLayer = defaultLayers.find(l => l.name === "Ground");
          setSelectedLayerId(groundLayer?.id || defaultLayers.find(l => l.name !== 'Map Background')?.id || defaultLayers[0]?.id || null);
        }

      } else {
        console.error("Failed to parse mapDetail.mapData:", parsedMapData.error);
        toast.error("Error parsing map data. Check console.");
        const defaults = getDefaultMapData();
        setMapData(prev => ({
          ...defaults,
          id: mapDetail.id,
          name: mapDetail.name || 'Untitled Map',
          description: mapDetail.description || '',
          layers: defaults.layers,
          environment: defaults.environment,
        }));
        setSelectedLayerId(defaults.layers.find(l => l.name === 'Ground')?.id || defaults.layers[1]?.id || null);
      }
    } else if (!mapId) { // New map
      const defaults = getDefaultMapData();
      setMapData(defaults);
      setSelectedLayerId(defaults.layers.find(l => l.name === 'Ground')?.id || defaults.layers[1]?.id || null);
    }
  }, [mapDetail, mapId]);

  const checkCollision = (newItem: Omit<MapItem, 'id' | 'category' | 'type' | 'color' | 'rotation' | 'scale'>): boolean => {
    for (const item of mapData.items) {
      if (item.layerId !== newItem.layerId) continue;

      // Simple AABB collision detection
      const itemRight = item.x + (item.width ?? 1);
      const itemBottom = item.y + (item.height ?? 1);
      const newItemRight = newItem.x + (newItem.width ?? 1);
      const newItemBottom = newItem.y + (newItem.height ?? 1);

      if (newItem.x < itemRight &&
        newItemRight > item.x &&
        newItem.y < itemBottom &&
        newItemBottom > item.y) {
        return true; // Collision detected
      }
    }
    return false; // No collision
  };

  const createItem = (x: number, y: number, width: number, height: number) => {
    if (!activeItemType || !selectedLayerId || isBackgroundLayerSelected()) {
      if (isBackgroundLayerSelected()) toast.error("Cannot place items on the Map Background layer. Use Map Properties for background settings.");
      else if (!selectedLayerId) toast.error("Select a layer first!");
      else if (!activeItemType) toast.error("Select an item type first!");
      return;
    }

    const itemTypeDetails = ITEM_TYPES[activeCategory]?.find(it => it.id === activeItemType);
    if (!itemTypeDetails) {
      toast.error("Invalid item type selected.");
      return;
    }
    const elevationOffset = itemTypeDetails?.elevationOffset ?? 0;

    let finalX = x;
    let finalY = y;
    let finalWidth = width;
    let finalHeight = height;

    if (snapToGrid) {
      finalX = Math.floor(x / gridSize) * gridSize;
      finalY = Math.floor(y / gridSize) * gridSize;
      finalWidth = Math.max(gridSize, Math.round(width / gridSize) * gridSize);
      finalHeight = Math.max(gridSize, Math.round(height / gridSize) * gridSize);
    } else {
      finalX = parseFloat(x.toFixed(2));
      finalY = parseFloat(y.toFixed(2));
      finalWidth = parseFloat(width.toFixed(2));
      finalHeight = parseFloat(height.toFixed(2));
    }

    if (finalWidth <= 0 || finalHeight <= 0) {
      toast.error("Item dimensions must be positive.");
      return;
    }

    const newItemData: MapItem = {
      id: generateId(),
      type: activeItemType,
      category: activeCategory,
      x: finalX,
      y: finalY,
      width: finalWidth,
      height: finalHeight,
      rotation: 0,
      scale: 1,
      color: currentColor,
      layerId: selectedLayerId,
      elevationOffset: elevationOffset,
      properties: {},
    };

    if (checkCollision(newItemData)) {
      //toast.error(`An item already exists at this location on layer: ${mapData.layers.find(l => l.id === selectedLayerId)?.name}`);
      //return;
    }

    setMapData(prev => ({
      ...prev,
      items: [...prev.items, newItemData],
    }));
    toast.success(`Item (${itemTypeDetails.name}) placed on layer: ${mapData.layers.find(l => l.id === selectedLayerId)?.name}`);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / (pixelsPerUnit * zoom);
    const y = (e.clientY - rect.top) / (pixelsPerUnit * zoom);

    if (activeTool === 'place' && !isBackgroundLayerSelected() && selectedLayerId && activeItemType) {
      setIsDrawing(true);
      setDrawStartCoords({ x, y });
      setDrawCurrentCoords({ x, y });
    } else if (activeTool === 'select') {
      // Start selection rectangle if shift is held and no item was clicked
      if (e.shiftKey) {
        setIsSelectionRectangle(true);
        setSelectionStart({ x, y });
        setSelectionEnd({ x, y });
      } else {
        // Clear selection if clicking on empty space without shift
        setSelectedItems([]);
        setSelectedItem(null);
      }
    }
  };


  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / (pixelsPerUnit * zoom);
    const y = (e.clientY - rect.top) / (pixelsPerUnit * zoom);

    if (isDrawing && activeTool === 'place') {
      setDrawCurrentCoords({ x, y });
    } else if (isSelectionRectangle && activeTool === 'select') {
      setSelectionEnd({ x, y });
    } else if (draggingItem && activeTool === 'move') {
      // Handle existing drag logic for moving items
      const draggedMapItem = mapData.items.find(item => item.id === draggingItem);
      if (!draggedMapItem) return;

      let finalX = x;
      let finalY = y;

      if (snapToGrid) {
        finalX = Math.floor(x / gridSize) * gridSize;
        finalY = Math.floor(y / gridSize) * gridSize;
      } else {
        finalX = parseFloat(x.toFixed(2));
        finalY = parseFloat(y.toFixed(2));
      }

      // Update visual position during drag
      setMapData(prev => ({
        ...prev,
        items: prev.items.map(item => {
          if (item.id === draggingItem) {
            return { ...item, x: finalX, y: finalY };
          }
          return item;
        }),
      }));

      // Update selected item's live position if it's the one being dragged
      if (selectedItem?.id === draggingItem) {
        setSelectedItem(prev => prev ? { ...prev, x: finalX, y: finalY } : null);
      }
    }
  };


  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    // Handle selection rectangle completion
    if (isSelectionRectangle && selectionStart && selectionEnd && activeTool === 'select') {
      const itemsInRectangle = mapData.items.filter(item => {
        const layer = mapData.layers.find(l => l.id === item.layerId);
        return layer?.visible &&
          isItemInSelectionRectangle(item, selectionStart, selectionEnd) &&
          shouldIncludeInMultiSelect(item);
      });

      setSelectedItems(itemsInRectangle);
      if (itemsInRectangle.length > 0) {
        setSelectedItem(itemsInRectangle[0]); // Keep single selection for properties panel
        toast.success(`Selected ${itemsInRectangle.length} item(s)`);
      }

      setIsSelectionRectangle(false);
      setSelectionStart(null);
      setSelectionEnd(null);
      return;
    }

    // Handle item placement completion
    if (isDrawing && drawStartCoords && drawCurrentCoords && activeTool === 'place') {
      setIsDrawing(false);

      const itemTypeDetails = ITEM_TYPES[activeCategory]?.find(it => it.id === activeItemType);

      const startX = Math.min(drawStartCoords.x, drawCurrentCoords.x);
      const startY = Math.min(drawStartCoords.y, drawCurrentCoords.y);
      const endX = Math.max(drawStartCoords.x, drawCurrentCoords.x);
      const endY = Math.max(drawStartCoords.y, drawCurrentCoords.y);

      let itemWidth = endX - startX;
      let itemHeight = endY - startY;

      // If it's a very small drag (effectively a click), use default dimensions or 1x1
      const clickThreshold = 0.5 / (pixelsPerUnit * zoom);
      if (itemWidth < clickThreshold && itemHeight < clickThreshold) {
        itemWidth = itemTypeDetails?.defaultWidth || 1;
        itemHeight = itemTypeDetails?.defaultHeight || 1;
        createItem(drawStartCoords.x, drawStartCoords.y, itemWidth, itemHeight);
      } else {
        createItem(startX, startY, Math.max(itemWidth, snapToGrid ? gridSize : 0.1), Math.max(itemHeight, snapToGrid ? gridSize : 0.1));
      }

      setDrawStartCoords(null);
      setDrawCurrentCoords(null);
      return;
    }

    // Reset drawing state even if conditions above weren't met
    if (isDrawing) {
      setIsDrawing(false);
      setDrawStartCoords(null);
      setDrawCurrentCoords(null);
    }
  };


  const addLayer = () => {
    const newLayer: MapLayer = {
      id: generateId(),
      name: `New Layer ${mapData.layers.length + 1}`,
      zIndex: mapData.layers.length > 0 ? Math.max(...mapData.layers.map(l => l.zIndex)) + 0.01 : 0,
      visible: true,
    };
    setMapData(prev => ({ ...prev, layers: [...prev.layers, newLayer] }));
    setSelectedLayerId(newLayer.id);
  };

  const updateLayer = (layerId: string, updates: Partial<MapLayer>) => {
    setMapData(prev => ({
      ...prev,
      layers: prev.layers.map(l => {
        if (l.id === layerId) {
          if (l.name === 'Map Background' && updates.name && updates.name !== 'Map Background') {
            toast.error("The 'Map Background' layer has special properties and its name should not be changed ideally.");
            // return { ...l, ...updates, name: 'Map Background'}; // Optionally force name
          }
          return { ...l, ...updates };
        }
        return l;
      }),
    }));
  };

  const removeLayer = (layerId: string) => {
    const layerToRemove = mapData.layers.find(l => l.id === layerId);
    if (layerToRemove?.name === 'Map Background') {
      toast.error("The 'Map Background' layer cannot be deleted.");
      return;
    }
    if (mapData.layers.length <= 1) { // Should be > 1 if background is non-deletable
      toast.error("Cannot delete the last operational layer.");
      return;
    }
    setMapData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.layerId !== layerId),
      layers: prev.layers.filter(l => l.id !== layerId),
    }));
    if (selectedLayerId === layerId) {
      setSelectedLayerId(mapData.layers.find(l => l.id !== layerId && l.name !== 'Map Background')?.id || mapData.layers.find(l => l.name === 'Ground')?.id || null);
    }
  };

  const reorderLayer = (layerId: string, direction: 'up' | 'down') => {
    setMapData(prev => {
      const newLayers = [...prev.layers];
      const index = newLayers.findIndex(l => l.id === layerId);
      if (index === -1) return prev;

      // Prevent reordering of "Map Background" layer from being the first visually (lowest zIndex)
      if (newLayers[index].name === 'Map Background' && direction === 'down' && index < newLayers.length - 1) {
        toast.info("'Map Background' layer should generally remain at the bottom of the visual stack (lowest zIndex). Consider adjusting zIndex directly.");
        // Allow zIndex change but not necessarily position in array if array order doesn't strictly map to zIndex for all purposes
      }
      // Or prevent it from moving up past other layers if its zIndex is fixed low
      if (newLayers[index].name === 'Map Background' && direction === 'up' && index > 0) {
        toast.info("'Map Background' layer should generally remain at the bottom of the visual stack (lowest zIndex). Consider adjusting zIndex directly.");
      }


      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= newLayers.length) return prev;

      // Swap zIndex values to maintain visual order based on array position for simplicity during reorder
      const tempZIndex = newLayers[index].zIndex;
      newLayers[index].zIndex = newLayers[newIndex].zIndex;
      newLayers[newIndex].zIndex = tempZIndex;

      // Swap positions in array
      [newLayers[index], newLayers[newIndex]] = [newLayers[newIndex], newLayers[index]];

      return { ...prev, layers: newLayers.sort((a, b) => a.zIndex - b.zIndex) }; // Also re-sort by zIndex after swap
    });
  };


const handleItemClick = (e: React.MouseEvent, item: MapItem) => {
  e.stopPropagation(); // Prevent canvas click
  if (isDrawing || isSelectionRectangle) return; // Don't select/delete if currently drawing or selecting

  if (activeTool === 'delete') {
    if (selectedItems.length > 0 && selectedItems.some(si => si.id === item.id)) {
      // Delete all selected items
      setMapData(prev => ({
        ...prev,
        items: prev.items.filter(i => !selectedItems.some(si => si.id === i.id)),
      }));
      setSelectedItems([]);
      setSelectedItem(null);
      toast.success(`Deleted ${selectedItems.length} item(s)`);
    } else {
      // Delete single item
      setMapData(prev => ({
        ...prev,
        items: prev.items.filter(i => i.id !== item.id),
      }));
      setSelectedItem(null);
      toast.success('Item deleted');
    }
    return;
  }

  // Multi-select logic for select and rotate tools
  if ((activeTool === 'select' || activeTool === 'rotate') && e.shiftKey) {
    if (e.altKey) {
      // Remove from selection (Alt + Shift + Click)
      const newSelection = selectedItems.filter(si => si.id !== item.id);
      setSelectedItems(newSelection);
      if (selectedItem?.id === item.id) {
        setSelectedItem(newSelection.length > 0 ? newSelection[0] : null);
      }
      toast.info(`Removed from selection. ${newSelection.length} item(s) selected.`);
    } else {
      // Add to selection (Shift + Click)
      if (!selectedItems.some(si => si.id === item.id)) {
        const newSelection = [...selectedItems, item];
        setSelectedItems(newSelection);
        setSelectedItem(item);
        toast.info(`Added to selection. ${newSelection.length} item(s) selected.`);
      }
    }
  } else {
    // Single select (normal click)
    setSelectedItems([item]);
    setSelectedItem(item);
    toast.info(`Selected: ${ITEM_TYPES[item.category]?.find(it => it.id === item.type)?.name || item.type}`);
  }

  // Always switch to select tool when clicking items (except for delete)
  if (activeTool !== 'delete') {
    setActiveTool('select');
  }

  // Update tool states based on selected item
  console.log('[Handler] Item Clicked. Setting states from item:', item);
  if (item.layerId !== selectedLayerId) setSelectedLayerId(item.layerId);
  if (item.category !== activeCategory) setActiveCategory(item.category);
  if (item.type !== activeItemType) setActiveItemType(item.type);
  const itemColor = item.color || ITEM_TYPES[item.category]?.find(it => it.id === item.type)?.color || '#CCCCCC';
  if (itemColor !== currentColor) setCurrentColor(itemColor);
};

  const updateSelectedItem = (updates: Partial<MapItem> | { properties: Partial<MapItem['properties']> }) => {
    if (!selectedItem) return;

    let newProperties = selectedItem.properties;
    if ('properties' in updates && updates.properties) {
      newProperties = { ...selectedItem.properties, ...updates.properties };
      delete (updates as any).properties; // remove properties from main updates object
    }

    let finalUpdates = { ...updates, properties: newProperties } as Partial<MapItem>;


    if (finalUpdates.type && finalUpdates.category) { // If type/category changes, update elevation offset
      const itemTypeDef = ITEM_TYPES[finalUpdates.category]?.find(it => it.id === finalUpdates.type);
      if (itemTypeDef && typeof itemTypeDef.elevationOffset === 'number') {
        finalUpdates.elevationOffset = itemTypeDef.elevationOffset;
      }
      // Update color if not explicitly set in updates
      if (!finalUpdates.color && itemTypeDef?.color) {
        finalUpdates.color = itemTypeDef.color;
        setCurrentColor(itemTypeDef.color);
      }
    }


    setMapData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === selectedItem.id ? { ...item, ...finalUpdates } : item
      ),
    }));
    setSelectedItem(prev => (prev ? { ...prev, ...finalUpdates } : null));
  };

  const saveMapToDatabase = async () => {
    try {
      if (!mapData.name.trim()) {
        toast.error('Please enter a name for the map');
        return;
      }

      // No longer need to generate boundary items. Background is handled by mapData.environment.backgroundColor.
      const currentMapData = { ...mapData };

      const mapToSavePayload = {
        ...(currentMapData.id && { id: currentMapData.id }),
        name: currentMapData.name,
        description: currentMapData.description || '',
        mapData: { // Ensure MapData is passed directly without extra nesting if SaveMapInput expects flat mapData
          name: currentMapData.name,
          description: currentMapData.description,
          width: currentMapData.width,
          height: currentMapData.height,
          layers: currentMapData.layers,
          items: currentMapData.items,
          environment: currentMapData.environment,
        },
        isActive: mapDetail?.isActive || false,
      };

      const validation = SaveMapInputSchema.safeParse(mapToSavePayload);
      if (!validation.success) {
        console.error("Map data validation error:", validation.error.flatten());
        toast.error("Map data is invalid. Check console for details.");
        return;
      }

      await saveMapMutation.mutateAsync(validation.data);
      router.push('/admin/maps');
    } catch (error: any) {
      console.error('Error saving map:', error);
      toast.error(error.message || 'Failed to save map');
    }
  };

  const canvasDisplayWidth = mapData.width * pixelsPerUnit * zoom;
  const canvasDisplayHeight = mapData.height * pixelsPerUnit * zoom;

  const sortedItemsToRender = [...mapData.items].sort((a, b) => {
    const layerA = mapData.layers.find(l => l.id === a.layerId);
    const layerB = mapData.layers.find(l => l.id === b.layerId);

    const zIndexA = (layerA?.zIndex ?? 0) + (a.elevationOffset ?? 0);
    const zIndexB = (layerB?.zIndex ?? 0) + (b.elevationOffset ?? 0);

    if (zIndexA !== zIndexB) {
      return zIndexA - zIndexB;
    }
    // Optional: further sort by y then x for consistent rendering of overlapping items on same z-level
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });

  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (activeTool !== 'move' || isDrawing) return;
    setDraggingItem(id);
    e.dataTransfer.effectAllowed = 'move';
    // Optional: hide default drag ghost image
    // const emptyImg = new Image();
    // emptyImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
    // e.dataTransfer.setDragImage(emptyImg, 0, 0);
  };

  const handleDragOverCanvas = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
    if (!draggingItem || !canvasRef.current || activeTool !== 'move') return;

    const rect = canvasRef.current.getBoundingClientRect();
    let x = (e.clientX - rect.left) / (pixelsPerUnit * zoom);
    let y = (e.clientY - rect.top) / (pixelsPerUnit * zoom);

    const draggedMapItem = mapData.items.find(item => item.id === draggingItem);
    if (!draggedMapItem) return;

    // Adjust x,y so the item is dragged from its top-left corner, not mouse cursor center
    // This requires knowing the item's dimensions, but for now, let's keep it simple.
    // A more precise drag would consider the offset from where the drag started on the item.

    if (snapToGrid) {
      x = Math.floor(x / gridSize) * gridSize;
      y = Math.floor(y / gridSize) * gridSize;
    } else {
      x = parseFloat(x.toFixed(2));
      y = parseFloat(y.toFixed(2));
    }

    // Update visual position during drag without committing to state too frequently for performance
    // This could be done by directly manipulating the style of a 'ghost' element or the dragged item
    // For simplicity here, we update state, but this can be optimized.
    setMapData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === draggingItem) {
          // Check for collision BEFORE committing the move (optional, can be complex during drag)
          // const potentialNewPos = { ...item, x, y };
          // if (checkCollision(potentialNewPos, item.id)) { /* Don't update or show visual feedback */ return item;}
          return { ...item, x, y };
        }
        return item;
      }),
    }));
    // Update selected item's live position if it's the one being dragged
    if (selectedItem?.id === draggingItem) {
      setSelectedItem(prev => prev ? { ...prev, x, y } : null);
    }
  };

  const handleDropOnCanvas = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggingItem || !canvasRef.current || activeTool !== 'move') {
      setDraggingItem(null);
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    let finalX = (e.clientX - rect.left) / (pixelsPerUnit * zoom);
    let finalY = (e.clientY - rect.top) / (pixelsPerUnit * zoom);

    const itemBeingDragged = mapData.items.find(it => it.id === draggingItem);
    if (!itemBeingDragged) {
      setDraggingItem(null);
      return;
    }

    if (snapToGrid) {
      finalX = Math.floor(finalX / gridSize) * gridSize;
      finalY = Math.floor(finalY / gridSize) * gridSize;
    } else {
      finalX = parseFloat(finalX.toFixed(2));
      finalY = parseFloat(finalY.toFixed(2));
    }

    const potentialNewItemState = { ...itemBeingDragged, x: finalX, y: finalY };

    // Check for collision, excluding the item itself from the check
    const otherItems = mapData.items.filter(i => i.id !== draggingItem && i.layerId === itemBeingDragged.layerId);
    let collision = false;
    for (const item of otherItems) {
      const itemRight = item.x + (item.width ?? 1);
      const itemBottom = item.y + (item.height ?? 1);
      const newItemRight = potentialNewItemState.x + (potentialNewItemState.width ?? 1);
      const newItemBottom = potentialNewItemState.y + (potentialNewItemState.height ?? 1);

      if (potentialNewItemState.x < itemRight && newItemRight > item.x &&
        potentialNewItemState.y < itemBottom && newItemBottom > item.y) {
        collision = true;
        break;
      }
    }

    if (collision) {
      toast.error("Cannot move item here, it would overlap another item.");
      // Revert to original position (or last valid position)
      // For simplicity, we'll rely on the state not having fully committed the invalid move yet
      // or you might need to store original position on drag start.
      // Here, we just don't finalize the move if collision occurs on drop.
      // The visual drag might have shown it, but the final state update is prevented.
      // To revert visual position, need to reset the item to its pre-drag state.
      // This simplified version doesn't explicitly revert, it assumes handleDragOverCanvas
      // updates were temporary/visual or that a fresh render will correct.
    } else {
      setMapData(prev => ({
        ...prev,
        items: prev.items.map(item => {
          if (item.id === draggingItem) {
            return { ...item, x: finalX, y: finalY };
          }
          return item;
        }),
      }));
      if (selectedItem?.id === draggingItem) {
        setSelectedItem(prev => (prev ? { ...prev, x: finalX, y: finalY } : null));
      }
      toast.success("Item moved.");
    }
    setDraggingItem(null);
  };


  const exportMapData = () => {
    try {
      const jsonData = JSON.stringify(mapData, null, 2);
      return jsonData;
    } catch (error) {
      console.error('Error exporting map data:', error);
      toast.error('Failed to export map data');
      return '';
    }
  };

  const importMapData = () => {
    try {
      // First try to parse the JSON
      let parsedData;
      try {
        parsedData = JSON.parse(importData);
      } catch (jsonError) {
        toast.error('Invalid JSON format. Please check your JSON syntax.');
        console.error('JSON parsing error:', jsonError);
        return;
      }

      // Pre-process the data to fix any invalid UUIDs before validation
      const processedData = fixInvalidUuids(parsedData);

      // Then validate against the schema
      const validation = MapDataSchema.safeParse(processedData);

      if (!validation.success) {
        console.error("Schema validation errors:", validation.error);

        // Get the flattened error object
        const errorObj = validation.error.flatten();
        const fieldErrors = errorObj.fieldErrors;
        const formErrors = errorObj.formErrors;

        // Build a human-readable error message
        let errorMessages = [];

        // Process form-level errors
        if (formErrors && formErrors.length > 0) {
          errorMessages.push(...formErrors);
        }

        // Process field-specific errors
        if (fieldErrors && Object.keys(fieldErrors).length > 0) {
          // Add each field error with path
          Object.entries(fieldErrors).forEach(([field, errors]) => {
            if (errors && errors.length > 0) {
              errors.forEach(error => {
                errorMessages.push(`${field}: ${error}`);
              });
            }
          });
        }

        // Special handling for nested errors (like items array elements)
        const fullErrorPaths = extractFullErrorPaths(validation.error);
        if (fullErrorPaths.length > 0) {
          fullErrorPaths.forEach(({ path, message }) => {
            errorMessages.push(`${path}: ${message}`);
          });
        }

        // Display error in UI (limit to first 3 for readability)
        const displayErrors = errorMessages.length > 0
          ? errorMessages.slice(0, 3).join('\n')
          : 'Invalid map data format';

        toast.error(
          <div>
            <div><strong>Import validation failed:</strong></div>
            <div className="text-sm mt-1 whitespace-pre-line">{displayErrors}</div>
            {errorMessages.length > 3 && <div className="text-sm mt-1">...and {errorMessages.length - 3} more errors</div>}
            <div className="text-xs mt-2">Check console for full details</div>
          </div>,
          { duration: 6000 }
        );

        throw new Error('Map data failed schema validation');
      }

      const validatedData = validation.data;

      // Update map data with validated content
      setMapData(prev => ({
        ...prev, // keep id if it exists on prev for existing map
        name: validatedData.name,
        description: validatedData.description || '',
        width: validatedData.width,
        height: validatedData.height,
        items: validatedData.items,
        layers: validatedData.layers && validatedData.layers.length > 0
          ? validatedData.layers
          : getDefaultMapData().layers,
        environment: validatedData.environment || getDefaultMapData().environment,
      }));

      setIsImportDialogOpen(false);
      toast.success('Map data imported successfully');
    } catch (error) {
      console.error('Error importing map data:', error);
      // Only show generic error if we haven't already shown a specific one
      if (error instanceof Error && !error.message.includes('validation')) {
        toast.error('Failed to import map data: ' + error.message);
      }
    }
  };

  /**
   * Fix any invalid UUIDs in the data by replacing them with new ones
   * @param {Object} data - The map data to fix
   * @returns {Object} - The processed data with valid UUIDs
   */
  function fixInvalidUuids(data) {
    // Helper function to check if a string is a valid UUID
    const isValidUuid = (str) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return typeof str === 'string' && uuidRegex.test(str);
    };

    // Helper function to generate a new UUID v4
    const generateUuid = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };

    // Clone the data to avoid mutating the original
    const processedData = JSON.parse(JSON.stringify(data));

    // Fix top-level id if it exists and is invalid
    if ('id' in processedData && !isValidUuid(processedData.id)) {
      console.log('Replacing invalid top-level UUID:', processedData.id);
      processedData.id = generateUuid();
    }

    // Fix layers array if it exists
    if (processedData.layers && Array.isArray(processedData.layers)) {
      processedData.layers = processedData.layers.map(layer => {
        if (layer && typeof layer === 'object') {
          // Fix layer id if invalid
          if ('id' in layer && !isValidUuid(layer.id)) {
            console.log('Replacing invalid layer UUID:', layer.id);
            layer.id = generateUuid();
          }
        }
        return layer;
      });
    }

    // Fix items array if it exists
    if (processedData.items && Array.isArray(processedData.items)) {
      processedData.items = processedData.items.map(item => {
        if (item && typeof item === 'object') {
          // Fix item id if invalid
          if ('id' in item && !isValidUuid(item.id)) {
            console.log('Replacing invalid item UUID:', item.id);
            item.id = generateUuid();
          }
        }
        return item;
      });
    }

    return processedData;
  }

  /**
   * Extract full paths to errors from Zod error object
   * Handles nested arrays and objects to provide precise error locations
   */
  function extractFullErrorPaths(zodError) {
    const results = [];

    function traverse(error, path = '') {
      if (error.code === 'invalid_type') {
        results.push({
          path: path,
          message: `Expected ${error.expected}, received ${error.received}`
        });
      }

      if (error.code === 'invalid_union') {
        results.push({
          path: path,
          message: 'Does not satisfy any of the expected types'
        });
      }

      if (error.code === 'invalid_literal') {
        results.push({
          path: path,
          message: `Expected ${error.expected}, received ${error.received}`
        });
      }

      if (error.code === 'custom') {
        results.push({
          path: path,
          message: error.message || 'Invalid value'
        });
      }

      // Handle array items separately
      if (error.path) {
        const currentPath = path
          ? `${path}.${error.path.join('.')}`
          : error.path.join('.');

        if (error.message) {
          results.push({
            path: currentPath,
            message: error.message
          });
        }
      }

      // Recursively process children
      if (error.errors && Array.isArray(error.errors)) {
        error.errors.forEach(childError => {
          const childPath = childError.path && childError.path.length > 0
            ? (path ? `${path}.${childError.path.join('.')}` : childError.path.join('.'))
            : path;

          traverse(childError, childPath);
        });
      }
    }

    traverse(zodError);
    return results;
  }

  const copyJsonToClipboard = () => {
    const jsonData = exportMapData();
    navigator.clipboard.writeText(jsonData);
    setJsonCopied(true);
    setTimeout(() => setJsonCopied(false), 2000);
    toast.success('Copied to clipboard');
  };

  const handleSetMapActive = async () => {
    if (!mapData.id) {
      toast.error('Please save the map first');
      return;
    }
    try {
      await setMapActiveMutation.mutateAsync(mapData.id);
      toast.success('Map set as active');
    } catch (error: any) {
      console.error('Error setting map as active:', error);
      toast.error(error.message || 'Failed to set map as active');
    }
  };

  const handleDeleteMap = async () => {
    if (!mapData.id) return;
    if (confirm('Are you sure you want to delete this map? This action cannot be undone.')) {
      try {
        await deleteMapMutation.mutateAsync(mapData.id);
        toast.success('Map deleted successfully');
        router.push('/admin/maps');
      } catch (error: any) {
        console.error('Error deleting map:', error);
        toast.error(error.message || 'Failed to delete map');
      }
    }
  };


  const updateMapEnvironment = (updates: Partial<MapEnvironment>) => {
    setMapData(prev => ({
      ...prev,
      environment: {
        ...prev.environment,
        ...updates,
      }
    }));
  };

  if (isLoadingMap) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <span className="ml-3 text-lg">Loading map data...</span>
      </div>
    );
  }

  if (mapError && mapId) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-bold">Error Loading Map</h2>
        <p className="text-gray-500">{(mapError as Error).message || 'Failed to load map data'}</p>
        <Button onClick={() => router.push('/admin/maps')}>
          Back to Maps
        </Button>
      </div>
    );
  }

const currentCanvasCursor = () => {
  if (activeTool === 'place') return isDrawing ? 'crosshair' : 'crosshair';
  if (activeTool === 'move') return draggingItem ? 'grabbing' : 'grab';
  if (activeTool === 'delete') return 'cell'; // or a custom delete cursor
  if (activeTool === 'select') return isSelectionRectangle ? 'crosshair' : 'default';
  if (activeTool === 'rotate') return 'crosshair'; // Could use a custom rotate cursor
  return 'default';
};


  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div>
          <h1 className="text-2xl font-bold">
            {mapId ? 'Edit Map' : 'Create New Map'}
          </h1>
          <p className="text-gray-500">
            Design the community map layout
          </p>
        </div>
        <div className="flex flex-wrap space-x-2">
          <Button onClick={() => setIsImportDialogOpen(true)} variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" /> Import
          </Button>
          <Button onClick={() => setIsExportDialogOpen(true)} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          {mapData.id && (
            <Button onClick={handleSetMapActive} variant="outline" size="sm" disabled={setMapActiveMutation.isPending}>
              {setMapActiveMutation.isPending ? <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-primary border-r-transparent" /> : <Zap className="w-4 h-4 mr-2" />}
              Set Active
            </Button>
          )}
          {mapData.id && (
            <Button onClick={handleDeleteMap} variant="destructive" size="sm" disabled={deleteMapMutation.isPending}>
              {deleteMapMutation.isPending ? <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-r-transparent" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete
            </Button>
          )}
          <Button onClick={saveMapToDatabase} disabled={saveMapMutation.isPending} size="sm">
            {saveMapMutation.isPending ? <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-r-transparent" /> : <Save className="w-4 h-4 mr-2" />}
            Save Map
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col lg:flex-row gap-4">
        <div className="lg:w-1/3 xl:w-1/4 space-y-4 order-2 lg:order-1"> {/* Adjusted width for better responsiveness */}
          <Card>
            <CardHeader><CardTitle>Tools & View</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { tool: 'select', icon: <MousePointer className="w-4 h-4 mr-1" />, label: 'Select' },
                  { tool: 'place', icon: <Plus className="w-4 h-4 mr-1" />, label: 'Place' },
                  { tool: 'move', icon: <Move className="w-4 h-4 mr-1" />, label: 'Move' },
                  { tool: 'delete', icon: <Trash2 className="w-4 h-4 mr-1" />, label: 'Delete' },
                ].map(({ tool, icon, label }) => (
                  <Button key={tool} variant={activeTool === tool ? 'default' : 'outline'} size="sm" onClick={() => setActiveTool(tool as any)} className="flex-1 capitalize">
                    {icon} {label}
                  </Button>
                ))}
              </div>
              <div className="space-y-1">
                <Label htmlFor="grid-toggle" className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" id="grid-toggle" checked={snapToGrid} onChange={(e) => setSnapToGrid(e.target.checked)} className="form-checkbox h-4 w-4 text-primary focus:ring-primary" />
                  <span>Snap to Grid ({gridSize}u)</span>
                </Label>
                <Input id="grid-size" type="number" value={gridSize} onChange={(e) => setGridSize(Math.max(1, parseInt(e.target.value)))} placeholder="Grid Size (units)" />
                <Label htmlFor="zoom">Zoom ({Math.round(zoom * 100)}%)</Label>
                <Input id="zoom" type="range" min="0.1" max="3" step="0.05" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} />
                <Label htmlFor="ppu">Pixels Per Unit</Label>
                <Input id="ppu" type="number" value={pixelsPerUnit} onChange={(e) => setPixelsPerUnit(Math.max(5, parseInt(e.target.value)))} placeholder="Pixels/Unit" />
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="itemPalette">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="itemPalette" disabled={isBackgroundLayerSelected()}>Item Palette</TabsTrigger>
              <TabsTrigger value="layers">Layers</TabsTrigger>
            </TabsList>
            <TabsContent value="itemPalette">
              <Card>
                <CardHeader><CardTitle>Item Palette</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {isBackgroundLayerSelected() ? (
                    <p className="text-sm text-muted-foreground p-4 text-center">
                      Item placement is disabled for the 'Map Background' layer.
                      Adjust background color in 'Map & Item Properties' tab.
                    </p>
                  ) : (
                    <>
                      <div>
                        <Label>Active Layer</Label>
                        <Select value={selectedLayerId || ''} onValueChange={(val) => handleLayerSelected(val)}>
                          <SelectTrigger><SelectValue placeholder="Select a layer" /></SelectTrigger>
                          <SelectContent>
                            {mapData.layers.map(layer => (
                              <SelectItem key={layer.id} value={layer.id} disabled={!layer.visible || layer.name === 'Map Background'}>
                                {layer.name} (Z: {layer.zIndex.toFixed(2)}) {!layer.visible && "(Hidden)"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {!selectedLayerId && <p className="text-red-500 text-xs pt-1">Select a layer to place items.</p>}
                      </div>
                      <div>
                        <Label>Item Category</Label>
                        <div className="grid grid-cols-3 gap-1 pt-1">
                          {Object.entries(ITEM_CATEGORIES).map(([key, value]) => (
                            <TooltipProvider key={key} delayDuration={100}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant={activeCategory === value ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handleCategorySelected(value)}
                                    className="w-full"
                                  >
                                    {getItemIcon(value + '-')}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{key.charAt(0) + key.slice(1).toLowerCase().replace('_', ' ')}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label>Item Type</Label>
                        <Select value={activeItemType} onValueChange={(val) => handleItemTypeSelected(val)} disabled={!activeCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an item type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>{activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)}</SelectLabel>
                              {ITEM_TYPES[activeCategory]?.map((itemType) => (
                                <SelectItem key={itemType.id} value={itemType.id}>
                                  <div className="flex items-center space-x-2">
                                    <div style={{ backgroundColor: itemType.color }} className="w-3 h-3 rounded-full border border-gray-400" />
                                    <span>{itemType.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Color</Label>
                        <Input type="color" value={currentColor} onChange={e => setCurrentColor(e.target.value)} className="w-full h-9 p-1" />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="layers">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Manage Layers</CardTitle>
                    <Button size="sm" onClick={addLayer}><Plus className="w-4 h-4 mr-1" /> Add Layer</Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[400px] w-80 overflow-y-auto">
                  {mapData.layers.sort((a, b) => a.zIndex - b.zIndex).map((layer, index, sortedArray) => {
                    const deletable = isLayerDeletable(layer, mapData.layers);

                    return (
                      <div key={layer.id} className={`p-2 border rounded group hover:border-primary ${selectedLayerId === layer.id ? 'border-primary bg-primary/5 shadow-md' : 'border-muted'}`}>
                        <div className="flex items-center justify-between">
                          <div onClick={() => {
                            if (layer.name === 'Map Background') {
                              toast.info("Map Background layer selected. Edit its color in 'Map Properties'.");
                            }
                            setSelectedLayerId(layer.id);
                          }} className="cursor-pointer flex-grow space-y-1 pr-2">
                            <Input
                              type="text"
                              value={layer.name}
                              onChange={(e) => updateLayer(layer.id, { name: e.target.value })}
                              className="text-sm font-medium p-1 h-auto border-0 focus:ring-1 focus:ring-primary bg-transparent group-hover:bg-background/50 disabled:opacity-70"
                              onBlur={(e) => !e.target.value.trim() && updateLayer(layer.id, { name: "Untitled Layer" })}
                              disabled={layer.name === 'Map Background'}
                            />
                            <Input
                              type="number"
                              value={layer.zIndex.toFixed(2)} // Format for display
                              step="0.01"
                              onChange={(e) => updateLayer(layer.id, { zIndex: parseFloat(e.target.value) || 0 })}
                              className="text-xs p-1 h-auto w-20 border-0 focus:ring-1 focus:ring-primary bg-transparent group-hover:bg-background/50"
                            />
                          </div>
                          <div className="flex items-center space-x-0.5"> {/* Adjusted space-x if needed */}
                            <TooltipProvider delayDuration={100}><Tooltip><TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => updateLayer(layer.id, { visible: !layer.visible })}>
                                {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                              </Button>
                            </TooltipTrigger><TooltipContent><p>{layer.visible ? "Hide Layer" : "Show Layer"}</p></TooltipContent></Tooltip></TooltipProvider>

                            <div className="flex flex-col"> {/* This div will stack the buttons vertically */}
                              <TooltipProvider delayDuration={100}><Tooltip><TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-auto p-0.5" onClick={() => reorderLayer(layer.id, 'up')} disabled={index === 0 || layer.name === 'Map Background'}> {/* Adjust padding/height as needed */}
                                  <ChevronUp className="w-3 h-3" /> {/* Optionally make icons smaller if space is tight */}
                                </Button>
                              </TooltipTrigger><TooltipContent><p>Move Up (visual order)</p></TooltipContent></Tooltip></TooltipProvider>
                              <TooltipProvider delayDuration={100}><Tooltip><TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-auto p-0.5" onClick={() => reorderLayer(layer.id, 'down')} disabled={index === sortedArray.length - 1 || layer.name === 'Map Background'}> {/* Adjust padding/height as needed */}
                                  <ChevronDown className="w-3 h-3" /> {/* Optionally make icons smaller if space is tight */}
                                </Button>
                              </TooltipTrigger><TooltipContent><p>Move Down (visual order)</p></TooltipContent></Tooltip></TooltipProvider>
                            </div>

                            <TooltipProvider delayDuration={100}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => initiateLayerDeletion(layer.id)}
                                    disabled={!deletable} // Use the helper function here
                                    title={deletable ? "Delete Layer" : "This layer cannot be deleted"}
                                  >
                                    <Trash2 className={`w-4 h-4 ${deletable ? 'text-destructive' : 'text-muted-foreground'}`} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{deletable ? "Delete Layer" : "This layer cannot be deleted"}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:w-2/3 xl:w-3/4 order-1 lg:order-2 space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="design">Design Canvas</TabsTrigger>
              <TabsTrigger value="properties">Map & Item Properties</TabsTrigger>
            </TabsList>
            <TabsContent value="design">
              <Card className="h-[calc(100vh-250px)] min-h-[500px] flex flex-col"> {/* Adjusted height */}
                <CardHeader className="p-2 flex-row justify-between items-center border-b">
                  <CardTitle className="text-sm">
                    {mapData.name} ({mapData.width}u x {mapData.height}u)
                  </CardTitle>
                  <div className="text-xs">Tool: <span className="font-semibold capitalize">{activeTool}</span> | Layer: <span className="font-semibold">{mapData.layers.find(l => l.id === selectedLayerId)?.name || 'None'}</span></div>
                </CardHeader>
                <CardContent ref={canvasWrapperRef} className="p-0 flex-grow overflow-auto bg-muted/20 relative">
                  <div
                    ref={canvasRef}
                    className="relative shadow-inner"
                    style={{
                      width: canvasDisplayWidth,
                      height: canvasDisplayHeight,
                      cursor: currentCanvasCursor(),
                      backgroundColor: mapData.environment.backgroundColor || '#DDDDDD', // Use map background color
                      backgroundImage: snapToGrid
                        ? `linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
                             linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)`
                        : 'none',
                      backgroundSize: snapToGrid ? `${gridSize * pixelsPerUnit * zoom}px ${gridSize * pixelsPerUnit * zoom}px` : 'auto',
                    }}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={() => { if (isDrawing) setIsDrawing(false); }} // Stop drawing if mouse leaves canvas
                    onDragOver={handleDragOverCanvas} // For moving items
                    onDrop={handleDropOnCanvas}      // For moving items
                  >
                    {/* Render items */}
                    {sortedItemsToRender.map((item) => {
                      const layer = mapData.layers.find(l => l.id === item.layerId);
                      if (!layer || !layer.visible) return null;

                      const isSelected = selectedItem?.id === item.id;
                      const itemTypeDetails = Object.values(ITEM_TYPES).flat().find(type => type.id === item.type);

                      const itemWidthPx = (item.width || 1) * pixelsPerUnit * item.scale * zoom;
                      const itemHeightPx = (item.height || 1) * pixelsPerUnit * item.scale * zoom;
                      const itemXPx = item.x * pixelsPerUnit * zoom;
                      const itemYPx = item.y * pixelsPerUnit * zoom;

                      let itemStyle: React.CSSProperties = {
                        position: 'absolute',
                        left: itemXPx,
                        top: itemYPx,
                        width: itemWidthPx,
                        height: itemHeightPx,
                        transform: `rotate(${item.rotation || 0}deg)`,
                        backgroundColor: item.color || itemTypeDetails?.color || '#ccc',
                        border: isSelected
                          ? '2px solid orange'
                          : (() => {
                            try {
                              const color = new THREE.Color(item.color || itemTypeDetails?.color || '#ccc');
                              const hsl = { h: 0, s: 0, l: 0 };
                              color.getHSL(hsl);
                              color.setHSL(hsl.h, hsl.s, Math.max(0, hsl.l - 0.2)); // Slightly less dark
                              return `1px solid ${color.getStyle()}`;
                            } catch { return '1px solid #999'; } // Fallback for invalid color
                          })(),
                        cursor: (activeTool === 'select' || activeTool === 'delete' || activeTool === 'move') ? 'pointer' : 'default',
                        opacity: item.type === 'ground-water' ? 0.7 : (item.category === ITEM_CATEGORIES.PLOT ? 0.6 : 1),
                        boxSizing: 'border-box',
                        overflow: 'hidden', // In case of text or inner elements
                        userSelect: 'none',
                      };

                      if (item.type.startsWith('decorative-tree')) {
                        itemStyle.borderRadius = '50%';
                        // Make tree size relative to its defined width/height, not fixed
                        itemStyle.width = Math.min(itemWidthPx, itemHeightPx); // Use smaller dimension for circle
                        itemStyle.height = Math.min(itemWidthPx, itemHeightPx);
                      }
                      if (draggingItem === item.id) {
                        itemStyle.opacity = itemStyle.opacity ? itemStyle.opacity * 0.6 : 0.6;
                        itemStyle.zIndex = 10000; // Bring to front while dragging
                      }


                      return (
                        <div
                          key={item.id}
                          style={itemStyle}
                          onClick={(e) => handleItemClick(e, item)}
                          draggable={activeTool === 'move'}
                          onDragStart={(e) => handleDragStart(e, item.id)}
                          // onDrag and onDragEnd are handled by canvas for the main dragging logic to avoid conflicts.
                          title={`${itemTypeDetails?.name || item.type} (Layer: ${layer.name})`}
                        >
                          {/* Optional: Display item name or icon inside */}
                          {item.category === ITEM_CATEGORIES.PLOT && (item.properties as any)?.name && (
                            <div className="text-xs absolute top-0 left-0 p-0.5 bg-black/30 text-white truncate max-w-full">
                              {(item.properties as any).name}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {/* Preview for click-and-drag item creation */}
                    {isDrawing && drawStartCoords && drawCurrentCoords && (
                      <div
                        style={{
                          position: 'absolute',
                          left: Math.min(drawStartCoords.x, drawCurrentCoords.x) * pixelsPerUnit * zoom,
                          top: Math.min(drawStartCoords.y, drawCurrentCoords.y) * pixelsPerUnit * zoom,
                          width: Math.abs(drawCurrentCoords.x - drawStartCoords.x) * pixelsPerUnit * zoom,
                          height: Math.abs(drawCurrentCoords.y - drawStartCoords.y) * pixelsPerUnit * zoom,
                          backgroundColor: ITEM_TYPES[activeCategory]?.find(it => it.id === activeItemType)?.color ?
                            `${ITEM_TYPES[activeCategory]?.find(it => it.id === activeItemType)?.color}80` : // Add alpha
                            'rgba(0, 120, 255, 0.5)',
                          border: '1px dashed #0078FF',
                          boxSizing: 'border-box',
                          pointerEvents: 'none', // Ensure it doesn't interfere with mouse events on the canvas
                        }}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="properties">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader><CardTitle className="flex items-center"><Palette className="w-5 h-5 mr-2" />Map Properties</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1">
                      <Label htmlFor="map-name">Map Name</Label>
                      <Input id="map-name" value={mapData.name} onChange={(e) => setMapData({ ...mapData, name: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="map-description">Description</Label>
                      <Textarea id="map-description" value={mapData.description || ''} onChange={(e) => setMapData({ ...mapData, description: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="map-width">Width (units)</Label>
                        <Input id="map-width" type="number" min="10" value={mapData.width} onChange={(e) => setMapData({ ...mapData, width: parseInt(e.target.value) || 10 })} />
                      </div>
                      <div>
                        <Label htmlFor="map-height">Height (units)</Label>
                        <Input id="map-height" type="number" min="10" value={mapData.height} onChange={(e) => setMapData({ ...mapData, height: parseInt(e.target.value) || 10 })} />
                      </div>
                    </div>
                    <Card className="p-3">
                      <h4 className="text-sm font-semibold mb-2 flex items-center"><Cloud className="w-4 h-4 mr-2" />Environment</h4>
                      <div className="space-y-2">
                        <div>
                          <Label htmlFor="map-bg-color">Background Color</Label>
                          <Input id="map-bg-color" type="color" value={mapData.environment.backgroundColor} onChange={e => updateMapEnvironment({ backgroundColor: e.target.value })} className="w-full h-9 p-1" />
                        </div>
                        <div>
                          <Label htmlFor="map-stars">Stars Intensity ({mapData.environment.starsIntensity?.toFixed(2)})</Label>
                          <Input id="map-stars" type="range" min="0" max="1" step="0.05" value={mapData.environment.starsIntensity} onChange={e => updateMapEnvironment({ starsIntensity: parseFloat(e.target.value) })} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="map-ambient-color">Ambient Light</Label>
                            <Input id="map-ambient-color" type="color" value={mapData.environment.ambientLightColor} onChange={e => updateMapEnvironment({ ambientLightColor: e.target.value })} className="w-full h-8 p-1" />
                          </div>
                          <div>
                            <Label htmlFor="map-ambient-intensity">Intensity ({mapData.environment.ambientLightIntensity?.toFixed(2)})</Label>
                            <Input id="map-ambient-intensity" type="range" min="0" max="2" step="0.05" value={mapData.environment.ambientLightIntensity} onChange={e => updateMapEnvironment({ ambientLightIntensity: parseFloat(e.target.value) })} />
                          </div>
                        </div>
                        {/* Add more environment controls as needed e.g. directional light */}
                      </div>
                    </Card>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="flex items-center"><Sparkles className="w-5 h-5 mr-2" />Selected Item</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {selectedItem ? (
                      <>
                        <div>
                          <Label className="text-xs text-muted-foreground">ID: {selectedItem.id.substring(0, 8)}...</Label>
                        </div>
                        <div>
                          <Label className="font-medium">{ITEM_TYPES[selectedItem.category]?.find(it => it.id === selectedItem.type)?.name || selectedItem.type}</Label>
                          <p className="text-xs text-muted-foreground">Category: {selectedItem.category}</p>
                        </div>
                        {selectedItem.category === ITEM_CATEGORIES.PLOT && (
                          <div>
                            <Label htmlFor="item-plot-name">Plot Name</Label>
                            <Input id="item-plot-name" value={(selectedItem.properties as any)?.name || ''} onChange={(e) => updateSelectedItem({ properties: { name: e.target.value } })} />
                          </div>
                        )}
                        <div>
                          <Label htmlFor="item-layer">Layer</Label>
                          <Select
                            value={selectedItem.layerId}
                            onValueChange={(val) => {
                              if (mapData.layers.find(l => l.id === val)?.name === 'Map Background') {
                                toast.error("Items cannot be moved to the Map Background layer.");
                                return;
                              }
                              updateSelectedItem({ layerId: val })
                            }}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {mapData.layers.map(l => <SelectItem key={l.id} value={l.id} disabled={!l.visible || l.name === 'Map Background'}>{l.name} {!l.visible && "(Hidden)"}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="item-x">X (units)</Label>
                            <Input id="item-x" type="number" step={snapToGrid ? gridSize : 0.1} value={selectedItem.x} onChange={(e) => updateSelectedItem({ x: parseFloat(e.target.value) })} />
                          </div>
                          <div>
                            <Label htmlFor="item-y">Y (units)</Label>
                            <Input id="item-y" type="number" step={snapToGrid ? gridSize : 0.1} value={selectedItem.y} onChange={(e) => updateSelectedItem({ y: parseFloat(e.target.value) })} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="item-width">Width (units)</Label>
                            <Input id="item-width" type="number" min="0.1" step={snapToGrid ? gridSize : 0.1} value={selectedItem.width} onChange={(e) => updateSelectedItem({ width: Math.max(0.1, parseFloat(e.target.value)) })} />
                          </div>
                          <div>
                            <Label htmlFor="item-height">Height (units)</Label>
                            <Input id="item-height" type="number" min="0.1" step={snapToGrid ? gridSize : 0.1} value={selectedItem.height} onChange={(e) => updateSelectedItem({ height: Math.max(0.1, parseFloat(e.target.value)) })} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="item-rot">Rotation (°)</Label>
                            <Input id="item-rot" type="number" min="0" max="360" value={selectedItem.rotation} onChange={(e) => updateSelectedItem({ rotation: parseFloat(e.target.value) })} />
                          </div>
                          <div>
                            <Label htmlFor="item-scale">Scale</Label> {/* Scale might be redundant if width/height are absolute */}
                            <Input id="item-scale" type="number" step="0.1" min="0.1" value={selectedItem.scale} onChange={(e) => updateSelectedItem({ scale: parseFloat(e.target.value) })} />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="item-elevation">Elevation Offset (from layer)</Label>
                          <Input id="item-elevation" type="number" step="0.01" value={selectedItem.elevationOffset || 0} onChange={(e) => updateSelectedItem({ elevationOffset: parseFloat(e.target.value) })} />
                          <p className="text-xs text-muted-foreground">Layer Z: {(mapData.layers.find(l => l.id === selectedItem.layerId)?.zIndex || 0).toFixed(2)}. Total Z: {((mapData.layers.find(l => l.id === selectedItem.layerId)?.zIndex || 0) + (selectedItem.elevationOffset || 0)).toFixed(3)}</p>
                        </div>
                        <div>
                          <Label htmlFor="item-color">Item Color</Label>
                          <Input id="item-color" type="color" value={selectedItem.color || ITEM_TYPES[selectedItem.category]?.find(it => it.id === selectedItem.type)?.color || '#CCCCCC'} onChange={(e) => updateSelectedItem({ color: e.target.value })} className="w-full h-9 p-1" />
                        </div>
                        <Button variant="outline" size="sm" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/50" onClick={() => {
                          setMapData(prev => ({ ...prev, items: prev.items.filter(i => i.id !== selectedItem.id) }));
                          setSelectedItem(null);
                          toast.info("Item removed from map.");
                        }}>
                          <Trash2 className="h-4 w-4 mr-2" /> Delete Item
                        </Button>
                      </>
                    ) : <p className="text-sm text-muted-foreground text-center py-4">No item selected. Click an item on the canvas or use the 'Select' tool.</p>}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Tabs>

      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Export Map Data</DialogTitle>
            <DialogDescription>
              Copy the JSON data to back up or share your map configuration.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end mb-2">
            <Button variant="secondary" size="sm" onClick={copyJsonToClipboard}>
              {jsonCopied ? <><Check className="h-4 w-4 mr-2" /> Copied!</> : <><Copy className="h-4 w-4 mr-2" /> Copy JSON</>}
            </Button>
          </div>
          <pre className="bg-muted p-4 rounded-md overflow-auto max-h-96 text-xs">
            {exportMapData()}
          </pre>
          <DialogFooter>
            <Button onClick={() => setIsExportDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Map Data</DialogTitle>
            <DialogDescription>
              Paste valid JSON map data to load a configuration. This will overwrite current unsaved changes.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Paste JSON data here..."
            value={importData}
            onChange={(e) => setImportData(e.target.value)}
            className="min-h-[200px] font-mono text-xs"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>Cancel</Button>
            <Button onClick={importMapData}>Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}