// app/community/plots/page.tsx
import { Suspense } from 'react';
import { CommunityPlotsDisplay } from '@/components/plot/community-plots-display';
import { PlotTypeLegend } from '@/components/plot/plot-type-legend';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Community Plots',
  description: 'Explore available plots in our futuristic community',
};

export default function CommunityPlotsPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Community Plots</h1>
      <p className="text-muted-foreground mb-6">
        Explore all the available plots in our futuristic community. Plots are color-coded by type.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3">
          <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
            <CommunityPlotsDisplay />
          </Suspense>
        </div>
        <div>
          <Suspense fallback={<Skeleton className="h-[200px] w-full" />}>
            <PlotTypeLegend />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
