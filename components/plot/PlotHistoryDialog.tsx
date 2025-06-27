// components/plot/PlotHistoryDialog.tsx
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getPlotTransactionsAction } from '@/lib/actions/plot-actions';
import { format } from 'date-fns';

interface PlotHistoryDialogProps {
  plotId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PlotHistoryDialog({ plotId, isOpen, onClose }: PlotHistoryDialogProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!isOpen) return;
      
      setIsLoading(true);
      setError(null);
      try {
        const response = await getPlotTransactionsAction(plotId);
        if (response.success && response.data) {
          setTransactions(response.data);
        } else {
          setError(response.error?.toString() || 'Failed to fetch transaction history');
        }
      } catch (error) {
        console.error('Error fetching plot transactions:', error);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchTransactions();
    }
  }, [plotId, isOpen]);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy, h:mm a');
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return '🏠';
      case 'sale':
        return '💰';
      default:
        return '📝';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'sale':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Plot Transaction History</DialogTitle>
          <DialogDescription>
            View all purchase and sale transactions for this plot.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-800 rounded-md">
            {error}
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-4 bg-gray-50 rounded-md text-center">
            No transaction history found for this plot.
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <Card key={transaction.id} className="border shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge className={`${getTransactionColor(transaction.transactionType)}`}>
                        {getTransactionIcon(transaction.transactionType)}{' '}
                        {transaction.transactionType === 'purchase' ? 'Purchased' : 'Sold'}
                      </Badge>
                      <CardDescription className="mt-1">
                        {formatDate(transaction.transactionDate)}
                      </CardDescription>
                    </div>
                    {transaction.price && (
                      <Badge variant="outline">
                        {transaction.price} credits
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="text-sm py-2">
                  {transaction.transactionType === 'purchase' ? (
                    <p>
                      Purchased by{' '}
                      <span className="font-medium">
                        {transaction.newOwnerName || 'User'}
                      </span>
                    </p>
                  ) : (
                    <p>
                      Sold by{' '}
                      <span className="font-medium">
                        {transaction.previousOwnerName || 'User'}
                      </span>
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="flex justify-end mt-4">
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
