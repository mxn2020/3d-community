// app/admin/plots/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { createSupabaseBrowserClient } from '@/lib/db';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

// Form schema for plot creation/editing
const plotFormSchema = z.object({
  position_x: z.coerce.number(),
  position_y: z.coerce.number(),
  position_z: z.coerce.number(),
  houseType: z.string().optional(),
  houseColor: z.string().optional(),
  price: z.coerce.number().min(0, {
    message: 'Price must be a positive number',
  }),
});

type PlotFormValues = z.infer<typeof plotFormSchema>;

// Plot type definition
type Plot = {
  id: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  ownerId?: string;
  ownerName?: string;
  houseType?: string;
  houseColor?: string;
  price: number;
  created_at: string;
};

export default function PlotsManagement() {
  const supabase = createSupabaseBrowserClient();
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPlot, setCurrentPlot] = useState<Plot | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create form
  const form = useForm<PlotFormValues>({
    resolver: zodResolver(plotFormSchema),
    defaultValues: {
      position_x: 0,
      position_y: 0,
      position_z: 0,
      houseType: '',
      houseColor: '',
      price: 100,
    },
  });

  // Load plots
  useEffect(() => {
    const loadPlots = async () => {
      setLoading(true);
      try {
        // Get plots with owner information
        const { data: plots, error } = await supabase
          .from('plots')
         .select(`
    *,
    accounts!inner (
      id,
      owner_user_id,
      name,
      owner:owner_user_id (
        id,
        name,
        avatar_url,
        level
      )
    )
  `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Format plots with owner name
        const formattedPlots = plots.map((plot) => ({
          ...plot,
          ownerName: plot.accounts.owner?.name || 'No Owner',
        }));

        setPlots(formattedPlots);
      } catch (error: any) {
        console.error('Error loading plots:', error.message);
        toast.error('Failed to load plots');
      } finally {
        setLoading(false);
      }
    };

    loadPlots();
  }, [supabase]);

  // Open dialog for creating/editing
  const openPlotDialog = (plot: Plot | null = null) => {
    setCurrentPlot(plot);

    if (plot) {
      // Editing existing plot
      form.reset({
        position_x: plot.position.x,
        position_y: plot.position.y,
        position_z: plot.position.z,
        houseType: plot.houseType || '',
        houseColor: plot.houseColor || '',
        price: plot.price,
      });
    } else {
      // Creating new plot
      form.reset({
        position_x: 0,
        position_y: 0,
        position_z: 0,
        houseType: '',
        houseColor: '',
        price: 100,
      });
    }

    setIsDialogOpen(true);
  };

  // Handle form submission
  const onSubmit = async (values: PlotFormValues) => {

    setIsSubmitting(true);
    try {
      const plotData = {
        position: {
          x: values.position_x,
          y: values.position_y,
          z: values.position_z,
        },
        houseType: values.houseType || null,
        houseColor: values.houseColor || null,
        price: values.price,
      };

      if (currentPlot) {
        // Update existing plot
        const { error } = await supabase
          .from('plots')
          .update(plotData)
          .eq('id', currentPlot.id);

        if (error) throw error;
        toast.success('Plot updated successfully');
      } else {
        // Create new plot
        const { error } = await supabase
          .from('plots')
          .insert([plotData]);

        if (error) throw error;
        toast.success('Plot created successfully');
      }

      // Refresh plots
const { data: refreshedPlots, error: refreshError } = await supabase
  .from('plots')
  .select(`
    *,
    accounts!inner (
      id,
      owner_user_id,
      name,
      owner:owner_user_id (
        id,
        name,
        avatar_url,
        level
      )
    )
  `)
  .order('created_at', { ascending: false });


      if (refreshError) throw refreshError;

      // Format plots with owner name
      const formattedPlots = refreshedPlots.map((plot) => ({
        ...plot,
        ownerName: plot.accounts.owner?.name || 'No Owner',
      }));

      setPlots(formattedPlots);
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error saving plot:', error.message);
      toast.error(currentPlot ? 'Failed to update plot' : 'Failed to create plot');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete plot
  const deletePlot = async (plotId: string) => {

    if (!confirm('Are you sure you want to delete this plot? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('plots')
        .delete()
        .eq('id', plotId);

      if (error) throw error;

      // Remove from local state
      setPlots(plots.filter(plot => plot.id !== plotId));
      toast.success('Plot deleted successfully');
    } catch (error: any) {
      console.error('Error deleting plot:', error.message);
      toast.error('Failed to delete plot');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Plots Management</h1>
          <p className="text-gray-500">
            Manage all plots in the Futurama community
          </p>
        </div>
        <Button onClick={() => openPlotDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Plot
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Plots</CardTitle>
          <CardDescription>
            Showing {plots.length} plots in the community
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <Table>
              <TableCaption>A list of all plots in the community</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>House Type</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plots.map((plot) => (
                  <TableRow key={plot.id}>
                    <TableCell className="font-medium">{plot.id.slice(0, 8)}...</TableCell>
                    <TableCell>
                      x: {plot.position.x.toFixed(1)},
                      y: {plot.position.y.toFixed(1)},
                      z: {plot.position.z.toFixed(1)}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${plot.ownerId ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                        {plot.ownerId ? 'Occupied' : 'Available'}
                      </span>
                    </TableCell>
                    <TableCell>{plot.ownerName}</TableCell>
                    <TableCell>{plot.houseType || 'N/A'}</TableCell>
                    <TableCell>{plot.price} credits</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openPlotDialog(plot)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => deletePlot(plot.id)}
                          disabled={!!plot.ownerId}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {plots.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No plots found. Create your first plot to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Plot Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {currentPlot ? 'Edit Plot' : 'Create New Plot'}
            </DialogTitle>
            <DialogDescription>
              {currentPlot
                ? 'Update the details of this plot'
                : 'Add a new plot to the community map'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="position_x"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position X</FormLabel>
                      <FormControl>
                        <Input type="number" step="any" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="position_y"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position Y</FormLabel>
                      <FormControl>
                        <Input type="number" step="any" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="position_z"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position Z</FormLabel>
                      <FormControl>
                        <Input type="number" step="any" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="houseType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>House Type (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      Default house type for this plot (e.g., 'type1', 'type2')
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="houseColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>House Color (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      Default color for the house (e.g., '#FF5733')
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (credits)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    currentPlot ? 'Update Plot' : 'Create Plot'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}