// admin/map-preview/page.tsx
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Axis3d, Square, Home, Filter, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMap } from '@/lib/queries/map-queries';
import { createLogger } from '@/lib/logger';
import { MapPreview3D } from './components/MapPreview3D';
import { NeighborhoodModePreview } from './components/NeighborhoodModePreview';
import type { MapData } from '@/lib/types/map-schemas';
import * as THREE from 'three';

const PREVIEW_ITEM_TYPE_STYLES: Record<string, { defaultColor: string; shape?: 'circle' | 'rectangle' }> = {
  // Plots
  'plot-standard': { defaultColor: '#d5e8d4' },
  'plot-premium': { defaultColor: '#b5e7a0' },
  'plot-commercial': { defaultColor: '#e1d5e7' },
  
  // Buildings
  'building-community-center': { defaultColor: '#4ECDC4' },
  'building-directory': { defaultColor: '#FF6B6B' },
  'building-feedback': { defaultColor: '#C7B3E5' },
  
  // Landmarks
  'landmark-centralpark': { defaultColor: '#8CC084' },
  'landmark-mountain-with-waterfall': { defaultColor: '#FFD700' },
  'landmark-clock-tower': { defaultColor: '#1e88e5' },
  
  // Trees and Decorative Items
  'decorative-tree-pine': { defaultColor: '#6B8E23', shape: 'circle' },
  'decorative-tree-mushroom': { defaultColor: '#8B4513', shape: 'circle' },
  'decorative-tree-crystal': { defaultColor: '#87CEEB', shape: 'circle' },
  'decorative-tree-floating': { defaultColor: '#9370DB', shape: 'circle' },
  'decorative-tree-bonsai': { defaultColor: '#8B0000', shape: 'circle' },
  'decorative-tree-tree': { defaultColor: '#228B22', shape: 'circle' },
  'decorative-tree-forest': { defaultColor: '#2E8B57', shape: 'circle' },
  'decorative-mailbox': { defaultColor: '#CD5C5C' },
  'decorative-bench': { defaultColor: '#A0522D' },
  'decorative-lamp': { defaultColor: '#FFD700' },
  'decorative-billboard': { defaultColor: '#00CED1' },
  'decorative-robot-pet': { defaultColor: '#C0C0C0' },
  
  // Streets
  'street-main': { defaultColor: '#555555' },
  'street-secondary': { defaultColor: '#666666' },
  'street-path': { defaultColor: '#d2b48c' },
  'street-rounded': { defaultColor: '#888888' },
  'street-ellipse': { defaultColor: '#999999' },
  'street-roundabout': { defaultColor: '#AAAAAA' },
  'street-junction': { defaultColor: '#BBBBBB' },
  'street-diagonal': { defaultColor: '#CCCCCC' },
  'street-bridge': { defaultColor: '#B0C4DE' },
  'street-railroad': { defaultColor: '#8B0000' },
  'street-curve': { defaultColor: '#A9A9A9' },
  'street-traffic-circle': { defaultColor: '#808080' },
  'street-parking-lot': { defaultColor: '#696969' },
  'street-sidewalk': { defaultColor: '#C0C0C0' },
  
  // Ground
  'ground-grass': { defaultColor: '#8CC084' },
  'ground-street': { defaultColor: '#AAAAAA' },
  'ground-water': { defaultColor: '#1e88e5' },
  'ground-sand': { defaultColor: '#F5DEB3' },
  'ground-park': { defaultColor: '#228B22' },
  'ground-dirt': { defaultColor: '#8B4513' },
  'ground-rock': { defaultColor: '#A9A9A9' },
  'ground-snow': { defaultColor: '#FFFFFF' },
  'ground-lava': { defaultColor: '#FF4500' },
  'ground-toxic': { defaultColor: '#32CD32' },
};
const DEFAULT_ITEM_COLOR = '#999999';
const PIXELS_PER_UNIT_2D = 20;

const logger = createLogger({ prefix: '[map-preview]' });

export default function MapPreviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mapId = searchParams.get('id');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [viewMode, setViewMode] = useState<'2d' | '3d' | 'neighborhood'>('2d');

  const [filterLayerId, setFilterLayerId] = useState<string>('all');
  const [filterItemType, setFilterItemType] = useState<string>('all');

  const {
    data: map,
    isLoading,
    error
  } = useMap(mapId || '', { enabled: !!mapId });

  useEffect(() => {
    if (error) {
      logger.error('Error fetching map:', { error });
      toast.error('Failed to load map');
    }
  }, [error]);

  const uniqueItemTypesInMap = useMemo(() => {
    if (!map?.mapData?.items) return [];
    const types = new Set<string>();
    map.mapData.items.forEach(item => types.add(item.type));
    return Array.from(types).sort();
  }, [map]);

  useEffect(() => {
    if (viewMode !== '2d' || !canvasRef.current || !map || !map.mapData) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { mapData } = map;
    const currentPixelsPerUnit = PIXELS_PER_UNIT_2D * zoomScale;

    canvas.width = mapData.width * currentPixelsPerUnit;
    canvas.height = mapData.height * currentPixelsPerUnit;

    ctx.fillStyle = mapData.environment?.backgroundColor || '#DDDDDD';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const gridSize = 1 * currentPixelsPerUnit;
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = Math.max(0.5, 0.5 * zoomScale);
    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    const itemsToRender = mapData.items
      .map(item => ({ ...item, layer: mapData.layers.find(l => l.id === item.layerId) }))
      .filter(itemWithLayer => {
        if (!itemWithLayer.layer || !itemWithLayer.layer.visible) return false;
        if (filterLayerId !== 'all' && itemWithLayer.layer.id !== filterLayerId) return false;
        if (filterItemType !== 'all' && itemWithLayer.type !== filterItemType) return false;
        return true;
      })
      .sort((a, b) => {
        const zA = (a.layer?.zIndex ?? 0) + (a.elevationOffset ?? 0);
        const zB = (b.layer?.zIndex ?? 0) + (b.elevationOffset ?? 0);
        if (zA !== zB) return zA - zB;
        if (a.y !== b.y) return a.y - b.y;
        return a.x - b.x;
      });

    itemsToRender.forEach(item => {
      const itemRenderWidth = (item.width || 1) * (item.scale || 1) * currentPixelsPerUnit;
      const itemRenderHeight = (item.height || 1) * (item.scale || 1) * currentPixelsPerUnit;
      const itemRenderX = item.x * currentPixelsPerUnit;
      const itemRenderY = item.y * currentPixelsPerUnit;
      const itemStyle = PREVIEW_ITEM_TYPE_STYLES[item.type] || { defaultColor: DEFAULT_ITEM_COLOR };
      const color = item.color || itemStyle.defaultColor;

      ctx.save();
      ctx.translate(itemRenderX + itemRenderWidth / 2, itemRenderY + itemRenderHeight / 2);
      ctx.rotate((item.rotation || 0) * Math.PI / 180);
      ctx.fillStyle = color;

      let borderColor = DEFAULT_ITEM_COLOR;
      try {
        const tempColor = new THREE.Color(color);
        const hsl = { h: 0, s: 0, l: 0 }; tempColor.getHSL(hsl);
        borderColor = tempColor.clone().offsetHSL(0, hsl.l > 0.2 ? -0.1 : 0.1, hsl.l > 0.2 ? -0.2 : 0.2).getStyle();
      } catch (e) { /* fallback */ }
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = Math.max(1, 1 * zoomScale);

      ctx.globalAlpha = (item.category === 'plot' || item.type === 'ground-water') ? 0.7 : 1.0;

      if (itemStyle.shape === 'circle' || item.type.includes('tree')) {
        const radius = Math.min(itemRenderWidth, itemRenderHeight) / 2;
        ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill();
        if (itemRenderWidth > 2 && itemRenderHeight > 2) ctx.stroke();
      } else {
        ctx.fillRect(-itemRenderWidth / 2, -itemRenderHeight / 2, itemRenderWidth, itemRenderHeight);
        if (itemRenderWidth > 2 && itemRenderHeight > 2) {
          ctx.strokeRect(-itemRenderWidth / 2, -itemRenderHeight / 2, itemRenderWidth, itemRenderHeight);
        }
      }

      if (zoomScale > 0.5 && (itemRenderWidth * zoomScale > 15)) {
        {
          const tempColor = new THREE.Color(color);
          const hsl = { h: 0, s: 0, l: 0 };
          tempColor.getHSL(hsl);
          ctx.fillStyle = hsl.l > 0.5 ? "black" : "white";
        }
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        const fontSize = Math.max(6, Math.min(12, 10 * zoomScale));
        ctx.font = `${fontSize}px Arial`; ctx.globalAlpha = 1.0;
        let label = item.properties?.name ? String(item.properties.name) : item.type.split('-').pop();
        const maxTextWidth = itemRenderWidth * 0.9;
        if (label && ctx.measureText(label).width > maxTextWidth && label.length > 5) {
          let fittingChars = label.length;
          while (ctx.measureText(label.substring(0, fittingChars)).width > maxTextWidth && fittingChars > 3) fittingChars--;
          label = label.substring(0, fittingChars) + (fittingChars < label.length ? "..." : "");
        }
        if (label) ctx.fillText(label, 0, 0);
      }
      ctx.restore();
    });
  }, [map, zoomScale, viewMode, filterLayerId, filterItemType]);

  const handleGoBack = () => router.back();
  const handleZoomIn = () => setZoomScale(prev => Math.min(prev + 0.2, 5));
  const handleZoomOut = () => setZoomScale(prev => Math.max(prev - 0.2, 0.1));
  const clearFilters = () => { setFilterLayerId('all'); setFilterItemType('all'); }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <Button variant="ghost" size="sm" className="mb-2 -ml-2" onClick={handleGoBack}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl md:text-2xl">
                  {isLoading ? 'Loading...' : map?.name || 'Map Preview'}
                </CardTitle>
                {map?.isActive && <Badge variant="default">Active</Badge>}
              </div>
              {map?.description && <CardDescription className="mt-1">{map.description}</CardDescription>}
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-0 self-start sm:self-center">
                <Button onClick={() => setViewMode('2d')} variant={viewMode === '2d' ? "default" : "outline"} size="sm" className="rounded-r-none">
                  <Square className="mr-1.5 h-4 w-4" /> 2D
                </Button>
                <Button onClick={() => setViewMode('3d')} variant={viewMode === '3d' ? "default" : "outline"} size="sm" className="rounded-none border-x-0">
                  <Axis3d className="mr-1.5 h-4 w-4" /> 3D
                </Button>
                <Button onClick={() => setViewMode('neighborhood')} variant={viewMode === 'neighborhood' ? "default" : "outline"} size="sm" className="rounded-l-none">
                  <Home className="mr-1.5 h-4 w-4" /> Hood
                </Button>
              </div>
              {viewMode === '2d' && (
                <div className="flex items-center gap-1 self-start sm:self-center">
                  <Button onClick={handleZoomOut} variant="outline" size="icon" className="h-9 w-9 text-lg">-</Button>
                  <span className="flex items-center px-2 text-xs font-medium w-16 justify-center">
                    {Math.round(zoomScale * 100)}%
                  </span>
                  <Button onClick={handleZoomIn} variant="outline" size="icon" className="h-9 w-9 text-lg">+</Button>
                </div>
              )}
            </div>
          </div>
          {viewMode === '2d' && map?.mapData && (
            <div className="mt-3 pt-3 border-t">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <Label className="flex items-center text-xs font-semibold"><Filter className="w-3.5 h-3.5 mr-1" />Filters:</Label>
                <Select value={filterLayerId} onValueChange={setFilterLayerId}>
                  <SelectTrigger className="w-auto sm:w-[160px] h-8 text-xs"><SelectValue placeholder="Layer" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Layers</SelectItem>
                    {map.mapData.layers.filter(l => l.name !== 'Map Background' && l.visible).map(layer => (
                      <SelectItem key={layer.id} value={layer.id}>{layer.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterItemType} onValueChange={setFilterItemType}>
                  <SelectTrigger className="w-auto sm:w-[160px] h-8 text-xs"><SelectValue placeholder="Item Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Item Types</SelectItem>
                    {uniqueItemTypesInMap.map(type => (<SelectItem key={type} value={type}>{type}</SelectItem>))}
                  </SelectContent>
                </Select>
                {(filterLayerId !== 'all' || filterItemType !== 'all') && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-8 px-2">
                    <X className="w-3 h-3 mr-1" /> Clear
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0 md:p-1">
          {isLoading ? (
            <div className="flex justify-center items-center py-20 h-[500px]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>
          ) : error || !map?.mapData ? (
            <div className="flex flex-col items-center justify-center py-20 h-[500px]">
              <div className="text-destructive mb-2">Failed to load map or map data is invalid.</div>
              <Button variant="outline" onClick={() => router.push('/admin/maps')}>Return to Maps</Button>
            </div>
          ) : (
            <div
              className="border rounded-lg relative"
              style={{
                minHeight: '500px',
                maxHeight: 'calc(80vh - 60px)',
                overflow: 'auto',
                width: '100%',
                display: viewMode === '2d' ? 'grid' : 'block',
                placeItems: viewMode === '2d' ? 'center' : 'initial',
              }}
            >
              {viewMode === '2d' && (
                <div className="bg-gray-100 p-0.5" style={{ width: 'fit-content', height: 'fit-content' }}>
                  <canvas ref={canvasRef} className="block shadow-md" />
                </div>
              )}
              {viewMode === '3d' && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                  {map && <MapPreview3D mapData={map.mapData} scale={zoomScale} />}
                </div>
              )}
              {viewMode === 'neighborhood' && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                  {map && <NeighborhoodModePreview mapData={map.mapData} />}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}