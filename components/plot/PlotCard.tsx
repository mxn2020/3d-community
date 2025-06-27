// components/plot/PlotCard.tsx
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plot } from '@/lib/types/plot-schemas';
import { useAuth } from '@/components/providers/auth-provider';
import { useUserPlot } from '@/lib/queries/plot-queries';
import { Loader2 } from 'lucide-react';

interface PlotCardProps {
  plot: Plot;
  onPurchase: () => void;
  onSelect: () => void;
}

export default function PlotCard({ plot, onPurchase, onSelect }: PlotCardProps) {
  const { isAuthenticated } = useAuth();
  const { data: userPlot, isLoading } = useUserPlot();

  const hasOwnPlot = !!userPlot;
  const isThisUserPlot = userPlot?.id === plot.id;
  const isAvailable = !plot.ownerId;

  const getPositionText = () => {
    const pos = plot.position;
    return `(${pos.x}, ${pos.y}, ${pos.z})`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {plot.name || `Plot ${plot.id.slice(0, 6)}`}
        </CardTitle>
        <CardDescription>
          Location: {getPositionText()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            {isAvailable ? (
              <span className="text-green-500 font-bold">Available</span>
            ) : (
              <span className="text-red-500 font-bold">Owned</span>
            )}
          </div>
          <div>
            {plot.houseType && (
              <span className="text-sm">House: {plot.houseType.replace('type', '')}</span>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onSelect}>
          View
        </Button>
        
        {isLoading ? (
          <Button disabled>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Loading...
          </Button>
        ) : isAvailable ? (
          <Button 
            onClick={onPurchase} 
            disabled={!isAuthenticated || hasOwnPlot}
            title={!isAuthenticated ? "Log in to purchase" : hasOwnPlot ? "You already own a plot" : "Purchase this plot"}
          >
            Purchase
          </Button>
        ) : isThisUserPlot ? (
          <Button variant="secondary" onClick={onSelect}>
            Your Plot
          </Button>
        ) : (
          <Button disabled>
            Not Available
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

