// components/plot/PlotAdjacentBadge.tsx
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';

interface PlotAdjacentBadgeProps {
  isAdjacent: boolean;
  selectedCount?: number;
}

export function PlotAdjacentBadge({ isAdjacent, selectedCount = 0 }: PlotAdjacentBadgeProps) {
  if (!isAdjacent) return null;
  
  return (
    <Badge className="absolute top-2 right-2 bg-green-100 text-green-800 border border-green-300 flex items-center gap-1">
      <CheckCircle2 className="h-3 w-3" /> 
      {selectedCount > 0 ? `Selected (${selectedCount})` : 'Adjacent'}
    </Badge>
  );
}
