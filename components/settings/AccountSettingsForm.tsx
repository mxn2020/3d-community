// components/account/AccountSettingsForm.tsx
'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UpdateAccountSchema, UpdateAccountInput, Account } from '@/lib/types/account-schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, AlertCircle, Shield, CreditCard, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAccount } from '@/lib/queries/account-queries';
import { useUpdateAccount, useDeleteAccount } from '@/lib/mutations/account-mutations';

interface AccountSettingsFormProps {
  initialAccount: Account;
  userId: string | null;
}

export default function AccountSettingsForm({ initialAccount, userId }: AccountSettingsFormProps) {
  // Use the account query hook to get the latest account data
  const { data: account, error: queryError, isLoading: queryLoading, refetch } = useAccount({
    initialData: initialAccount,
    enabled: true
  });

  // Use mutations
  const { mutate: updateAccount, isPending: isUpdatePending } = useUpdateAccount();
  const { mutate: deleteAccount, isPending: isDeletePending } = useDeleteAccount();

  // Setup form
  const form = useForm<UpdateAccountInput>({
    resolver: zodResolver(UpdateAccountSchema),
    defaultValues: {
      email: account?.email || '',
      twoFactorEnabled: account?.twoFactorEnabled || false,
      subscriptionPlan: account?.subscriptionPlan || 'free',
    },
  });

  // Update form when account data changes
  React.useEffect(() => {
    if (account) {
      form.reset({
        email: account.email || '',
        twoFactorEnabled: account.twoFactorEnabled || false,
        subscriptionPlan: account.subscriptionPlan || 'free',
      });
    }
  }, [account, form]);

  // Handle form submission
  const handleFormSubmit = (values: UpdateAccountInput) => {
    if (values.email === account?.email && 
        values.twoFactorEnabled === account?.twoFactorEnabled &&
        values.subscriptionPlan === account?.subscriptionPlan) {
      toast.info("No changes detected.");
      return;
    }
    
    updateAccount(values, {
      onSuccess: (data) => {
        toast.success("Account updated successfully!");
      },
      onError: (error) => {
        toast.error(`Update failed: ${error.message}`);
      }
    });
  };

  // Handle account deletion
  const handleDeleteAccount = () => {
    deleteAccount(undefined, {
      onSuccess: () => {
        toast.success("Account deleted successfully");
        // Redirect to login or home page
        window.location.href = '/';
      },
      onError: (error) => {
        toast.error(`Failed to delete account: ${error.message}`);
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>Manage your account security and subscription.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)}>
            <CardContent className="space-y-6">
              {queryLoading && (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
              {queryError && (
                <div className="text-destructive flex flex-col items-center gap-2 border border-destructive bg-destructive/10 p-4 rounded-md">
                  <div className='flex items-center gap-2'>
                    <AlertCircle className="h-5 w-5"/>
                    <span>Error loading account data: {queryError.message}</span>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => refetch()} className="mt-2">Try Again</Button>
                </div>
              )}
              {account && !queryLoading && !queryError && (
                <>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="your@email.com" {...field} disabled={isUpdatePending}/>
                          </FormControl>
                          <FormDescription>
                            This is the email address associated with your account.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="twoFactorEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Two-Factor Authentication</FormLabel>
                            <FormDescription>
                              Add an extra layer of security to your account.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isUpdatePending}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="subscriptionPlan"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subscription Plan</FormLabel>
                          <FormControl>
                            <div className="flex items-center space-x-2">
                              <CreditCard className="h-4 w-4" />
                              <span className="capitalize">{field.value}</span>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Your current subscription plan. Upgrade options coming soon.
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}
            </CardContent>
            {account && !queryLoading && !queryError && (
              <CardFooter className="border-t px-6 py-4">
                <Button type="submit" disabled={isUpdatePending || queryLoading || !form.formState.isDirty}>
                  {isUpdatePending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </CardFooter>
            )}
          </form>
        </Form>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible and destructive actions.</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full sm:w-auto">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account
                  and remove all associated data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-destructive text-foreground hover:bg-destructive/90"
                >
                  {isDeletePending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Account'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}