"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { X, Clock, History } from 'lucide-react';
import { useMemo } from 'react';
import { Plot } from '@/lib/types/plot-schemas';
import { PlotHistoryDialog } from './PlotHistoryDialog';
import { sellPlotAction } from '@/lib/actions/plot-actions';
import { toast } from 'sonner';

interface PlotDetailDialogProps {
  plot: {
    id: string;
    type: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    properties?: {
      name?: string;
      description?: string;
      price?: number;
      [key: string]: any;
    };
    color?: string;
  };
  plotState?: Plot | null;
  onClose: () => void;
  onPurchase: (plotId: string) => void;
  isAuthenticated: boolean;
  isUserOwned?: boolean;
  accountId?: string | null;
  userId?: string;
  onSellSuccess?: () => void;
}

export function PlotDetailDialog({ 
  plot, 
  plotState,
  onClose,
  onPurchase,
  isAuthenticated,
  isUserOwned = false,
  accountId,
  userId,
  onSellSuccess
}: PlotDetailDialogProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSellDialogOpen, setSellDialogOpen] = useState(false);
  const [isSellingPlot, setIsSellingPlot] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  
  const plotType = useMemo(() => {
    // Convert plot-standard to Standard Plot, etc.
    const type = plot.type.replace('plot-', '');
    return `${type.charAt(0).toUpperCase() + type.slice(1)} Plot`;
  }, [plot.type]);
  
  const plotColor = plot.color || '#d5e8d4';
  
  const isOwned = plotState?.ownerId !== undefined && plotState?.ownerId !== null;

  const handleSellPlot = async () => {
    if (!accountId || !userId || !plot.id) {
      toast.error("Missing required information to sell the plot");
      return;
    }

    setIsSellingPlot(true);
    try {
      const result = await sellPlotAction(plot.id, accountId, userId);
      if (result.success) {
        toast.success("Plot sold successfully!");
        setSellDialogOpen(false);
        onClose();
        if (onSellSuccess) {
          onSellSuccess();
        }
      } else {
        toast.error(`Failed to sell plot: ${result.error}`);
      }
    } catch (error) {
      console.error("Error selling plot:", error);
      toast.error("An error occurred while selling the plot");
    } finally {
      setIsSellingPlot(false);
    }
  };

  return (
    <>
      <Card className="plot-detail-dialog w-[350px] shadow-lg border-2" style={{ borderColor: plotColor }}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2" style={{ backgroundColor: `${plotColor}30` }}>
          <div>
            <CardTitle className="text-base">{plot.properties?.name || plotType}</CardTitle>
            <CardDescription>
              Position: ({plot.x}, {plot.y}) • Size: {plot.width || 4}x{plot.height || 4}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="pt-4">
          {plot.properties?.description && (
            <p className="text-sm mb-3">{plot.properties.description}</p>
          )}
          
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Plot Type</div>
              <Badge 
                variant="outline" 
                className="font-normal" 
                style={{ backgroundColor: `${plotColor}30`, borderColor: plotColor }}
              >
                {plotType}
              </Badge>
            </div>
            
            {plot.properties?.price && (
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Price</div>
                <Badge variant="outline" className="font-normal">
                  {plot.properties.price} credits
                </Badge>
              </div>
            )}
          </div>
          
          {isExpanded && (
            <div className="border rounded-md p-2 mt-2 text-xs space-y-1">
              <div><span className="font-semibold">ID:</span> {plot.id}</div>
              {Object.entries(plot.properties || {}).map(([key, value]) => {
                if (key !== 'name' && key !== 'description' && key !== 'price') {
                  return (
                    <div key={key}><span className="font-semibold">{key}:</span> {String(value)}</div>
                  );
                }
                return null;
              })}
            </div>
          )}

          {isOwned && isUserOwned && (
            <div className="mt-3 border-t pt-3">
              <div className="text-sm font-medium mb-1">Owner Actions</div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center" 
                  onClick={() => setIsHistoryDialogOpen(true)}
                >
                  <History className="h-3 w-3 mr-1" /> View History
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => setSellDialogOpen(true)}
                >
                  Sell Plot
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between pt-0">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Less Details' : 'More Details'}
          </Button>
          
          {!isOwned && isAuthenticated && (
            <Button 
              onClick={() => onPurchase(plot.id)}
              size="sm"
              style={{ backgroundColor: plotColor, color: '#000' }}
            >
              Purchase Plot
            </Button>
          )}
          
          {!isAuthenticated && (
            <Button 
              size="sm"
              variant="outline"
              disabled
            >
              Sign in to purchase
            </Button>
          )}
          
          {isOwned && !isUserOwned && (
            <div className="flex space-x-2">
              <Badge>Already Owned</Badge>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center"
                onClick={() => setIsHistoryDialogOpen(true)}
              >
                <History className="h-3 w-3 mr-1" /> History
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>

      {/* Sell Confirmation Dialog */}
      <AlertDialog open={isSellDialogOpen} onOpenChange={setSellDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sell this plot?</AlertDialogTitle>
            <AlertDialogDescription>
              This will list your plot for sale. You will lose ownership of this plot and any structures on it.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSellingPlot}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleSellPlot();
              }}
              disabled={isSellingPlot}
            >
              {isSellingPlot && <Clock className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Sale
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Plot History Dialog */}
      {isHistoryDialogOpen && (
        <PlotHistoryDialog
          plotId={plot.id}
          isOpen={isHistoryDialogOpen}
          onClose={() => setIsHistoryDialogOpen(false)}
        />
      )}
    </>
  );
}
