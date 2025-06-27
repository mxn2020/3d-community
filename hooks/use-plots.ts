// app/hooks/use-plots.ts
import { useState, useEffect } from 'react';
import { useUserPlots, useAvailablePlots } from '@/lib/queries/plot-queries';
import { usePurchasePlot, useUpdatePlot } from '@/lib/mutations/plot-mutations';
import { PlotPurchaseInput, UpdatePlotInput, Plot } from '@/lib/types/plot-schemas';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';

export function usePlotManagement(passedAccountId: string | null | undefined) { 
  const [isPurchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);

  const { user, isAuthenticated, profile } = useAuth();
  const mutationAccountId = profile?.id;
  const mutationUserId = user?.id;

  const { data: userPlots = [], isLoading: isUserPlotsLoading, error: userPlotsError } = useUserPlots(passedAccountId);
  const { data: availablePlots, isLoading: isAvailablePlotsLoading, error: availablePlotsError } = useAvailablePlots();

  useEffect(() => {
    if (userPlotsError) {
      toast.error(`Error loading your plots: ${userPlotsError.message}`);
    }
  }, [userPlotsError]);

  useEffect(() => {
    if (availablePlotsError) {
      toast.error(`Error loading available plots: ${availablePlotsError.message}`);
    }
  }, [availablePlotsError]);

  const purchasePlotMutation = usePurchasePlot(mutationAccountId, mutationUserId);
  const updatePlotMutation = useUpdatePlot(mutationAccountId, mutationUserId);

  const openPurchaseDialog = (plotId: string) => {
    if (!isAuthenticated || !user) {
      toast.error("Please sign in to purchase a plot");
      return;
    }

    // Check if user has reached the maximum plot limit (4 plots)
    if (passedAccountId === mutationAccountId && userPlots.length >= 4) {
      toast.error("You already own the maximum number of plots allowed (4).");
      return;
    }

    setSelectedPlotId(plotId);
    setPurchaseDialogOpen(true);
  };

  const handlePurchasePlot = (input: PlotPurchaseInput) => {
    if (!mutationAccountId || !mutationUserId) {
      toast.error("User authentication details are missing. Cannot purchase plot.");
      return;
    }

    purchasePlotMutation.mutate(input, {
      onSuccess: (response) => {
        if (response.success) {
          toast.success("Plot purchased successfully!");
          setPurchaseDialogOpen(false);
          setSelectedPlotId(null);
        } else {
          const errorMessage = (typeof response.error === 'string') ? response.error :
                             (Array.isArray(response.error)) ? response.error.map(e => e.message).join(', ') :
                             "Failed to purchase plot.";
          toast.error(errorMessage);
        }
      },
      onError: (error: Error) => {
        toast.error(`Error purchasing plot: ${error.message}`);
      }
    });
  };

  const handleUpdatePlot = (id: string, data: UpdatePlotInput) => {
    if (!mutationAccountId || !mutationUserId) {
      toast.error("User authentication details are missing. Cannot update plot.");
      return;
    }
    updatePlotMutation.mutate({ id, data }, {
      onSuccess: (response) => {
        if (response.success) {
          toast.success("Plot updated successfully!");
        } else {
          const errorMessage = (typeof response.error === 'string') ? response.error :
                             (Array.isArray(response.error)) ? response.error.map(e => e.message).join(', ') :
                             "Failed to update plot.";
          toast.error(errorMessage);
        }
      },
      onError: (error: Error) => {
        toast.error(`Error updating plot: ${error.message}`);
      }
    });
  };

  const isLoading = isUserPlotsLoading || isAvailablePlotsLoading;

  return {
    userPlots,
    userPlot: userPlots[0], // For backward compatibility
    availablePlots,
    isAuthenticated,
    userId: user?.id,

    isPurchasePending: purchasePlotMutation.isPending,
    isUpdatePending: updatePlotMutation.isPending,

    isUserPlotsLoading,
    isAvailablePlotsLoading,
    isLoading,

    isPurchaseDialogOpen,
    selectedPlotId,

    openPurchaseDialog,
    closePurchaseDialog: () => {
      setPurchaseDialogOpen(false);
      setSelectedPlotId(null);
    },
    purchasePlot: handlePurchasePlot,
    updatePlot: handleUpdatePlot
  };
}