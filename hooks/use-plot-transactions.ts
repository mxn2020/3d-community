// lib/hooks/use-plot-transactions.ts
import { useState } from 'react';
import { usePlotTransactions, useAdjacentPlots } from '@/lib/queries/plot-transaction-queries';
import { useSellPlot } from '@/lib/mutations/plot-mutations';

export function usePlotTransactionHandler(accountId?: string, userId?: string) {
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  
  // Get plot transactions
  const { 
    data: transactions, 
    isLoading: isLoadingTransactions,
    error: transactionsError,
    refetch: refetchTransactions
  } = usePlotTransactions(selectedPlotId || '', {
    enabled: !!selectedPlotId && isHistoryDialogOpen,
  });
  
  // Get adjacent plots
  const {
    data: adjacentPlots,
    isLoading: isLoadingAdjacent,
    error: adjacentPlotsError
  } = useAdjacentPlots(selectedPlotId || '', {
    enabled: !!selectedPlotId,
  });
  
  // Sell plot mutation
  const { 
    mutate: sellPlot, 
    isPending: isSelling,
    isSuccess: isSellSuccess,
    error: sellError
  } = useSellPlot(accountId, userId);
  
  // Open transaction history dialog
  const openTransactionHistory = (plotId: string) => {
    setSelectedPlotId(plotId);
    setIsHistoryDialogOpen(true);
  };
  
  // Close transaction history dialog
  const closeTransactionHistory = () => {
    setIsHistoryDialogOpen(false);
  };
  
  // Sell plot function
  const handleSellPlot = (plotId: string, onSuccess?: () => void) => {
    if (!accountId || !userId) {
      console.error("Missing accountId or userId");
      return;
    }
    
    sellPlot(plotId, {
      onSuccess: () => {
        if (onSuccess) onSuccess();
      }
    });
  };
  
  return {
    // State
    selectedPlotId,
    isHistoryDialogOpen,
    
    // Transactions data
    transactions,
    isLoadingTransactions,
    transactionsError,
    
    // Adjacent plots data
    adjacentPlots,
    isLoadingAdjacent,
    adjacentPlotsError,
    
    // Sell plot data
    isSelling,
    isSellSuccess,
    sellError,
    
    // Actions
    setSelectedPlotId,
    openTransactionHistory,
    closeTransactionHistory,
    sellPlot: handleSellPlot,
    refetchTransactions,
  };
}
