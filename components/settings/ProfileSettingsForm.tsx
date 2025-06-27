// components/profile/ProfileSettingsForm.tsx
'use client';

import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, AlertCircle, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner'; // Ensure sonner is imported
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { AvatarUploadResponseData, UpdateProfileInput, UpdateProfileSchema, UserProfile } from '@/lib/types/account-schemas';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from 'next-themes';
import { useProfile } from '@/lib/queries/profile-queries';
import { useUpdateProfile, useUploadAvatar } from '@/lib/mutations/profile-mutations';
import { ActionResponse, isSuccessResult } from '@/lib/types/response';

interface ProfileSettingsFormProps {
  initialProfile: UserProfile;
  userId: string; // userId might not be strictly necessary if using auth context within hooks
}

export default function ProfileSettingsForm({ initialProfile }: ProfileSettingsFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setTheme, theme } = useTheme();

  const { data: profile, error: queryError, isLoading: queryLoading, refetch } = useProfile({
    initialData: initialProfile,
    enabled: true
  });

  const { mutate: updateProfile, isPending: isUpdatePending } = useUpdateProfile();
  const { mutate: uploadAvatar, isPending: isUploadPending } = useUploadAvatar();

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(UpdateProfileSchema),
    defaultValues: {
      name: profile?.name || '',
      theme: (theme as 'light' | 'dark' | 'system') || 'system',
    },
  });

  React.useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name || '',
        theme: (theme as 'light' | 'dark' | 'system') || 'system',
      });
    }
  }, [profile, form, theme]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];

      if (!file.type.startsWith('image/')) {
        toast.error('Invalid file type. Please upload an image (e.g., PNG, JPG, GIF).');
        event.target.value = '';
        return;
      }

      const MAX_SIZE_MB = 2;
      const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
      if (file.size > MAX_SIZE_BYTES) {
        toast.error(`File size exceeds the limit of ${MAX_SIZE_MB}MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`);
        event.target.value = '';
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      uploadAvatar(formData, {
        onSuccess: (response: ActionResponse<AvatarUploadResponseData>) => {
          if (isSuccessResult(response)) {
            toast.success('Avatar updated successfully!');
          } else {
            const errorMessage = Array.isArray(response.error)
              ? response.error.map(e => e.message).join(', ')
              : response.error;
            toast.error(`Upload failed: ${errorMessage}`);
            console.error('Upload action failed:', response.error);
          }
        },
        onError: (err) => {
          toast.error(`Upload failed: ${err.message}`);
          console.error('Upload mutation error:', err);
        },
        onSettled: () => {
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      });
    }
  };

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    }
    return email ? email.substring(0, 2).toUpperCase() : '??';
  };

  const getDisplayName = (name?: string | null, email?: string | null) => {
    // If name exists and is not just an email address, use it
    if (name && name !== email && !name.includes('@')) {
      return name;
    }
    // Otherwise, show that name is not set
    return 'Name not set';
  };

  const onSubmit = (values: UpdateProfileInput) => {
    updateProfile(values, {
      onSuccess: (response: ActionResponse<UserProfile>) => {
        if (isSuccessResult(response)) {
          toast.success("Profile updated successfully");
          if (values.theme) {
            setTheme(values.theme);
          }
        } else {
          const errorMessage = Array.isArray(response.error)
            ? response.error.map(e => e.message).join(', ')
            : response.error;
          toast.error(errorMessage || "Failed to update profile");
        }
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update profile");
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Manage your personal information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {queryLoading && (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          {queryError && (
            <div className="text-destructive flex flex-col items-center gap-2 border border-destructive bg-destructive/10 p-4 rounded-md">
              <div className='flex items-center gap-2'>
                <AlertCircle className="h-5 w-5" />
                <span>Error loading profile: {queryError.message}</span>
              </div>
              <Button variant="secondary" size="sm" onClick={() => refetch()} className="mt-2">Try Again</Button>
            </div>
          )}
          {profile && !queryLoading && !queryError && (
            <>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Avatar className="h-16 w-16 cursor-pointer" onClick={handleAvatarClick}>
                    <AvatarImage
                      src={profile.avatarUrl ?? undefined}
                      alt={profile.name ?? profile.email ?? ''}
                    />
                    <AvatarFallback>
                      {getInitials(profile.name, profile.email)}
                    </AvatarFallback>
                  </Avatar>
                  {isUploadPending && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-full">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  )}
                  <Button
                    variant="outline" // Changed variant for better visibility against potential avatar overlap
                    size="icon"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-background hover:bg-muted border" // Added bg for better visibility
                    onClick={handleAvatarClick}
                    disabled={isUploadPending}
                    aria-label="Upload new avatar" // Added aria-label
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-medium">{getDisplayName(profile.name, profile.email)}</p>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*" // e.g., "image/png, image/jpeg, image/gif, image/webp"
                  className="hidden"
                  id="avatar-upload-input" // Added id for potential label linking
                />
              </div>

              <Separator />

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your name" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormDescription>
                          This is your public display name.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="theme"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Theme</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a theme" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="system">System</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose your preferred theme mode.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isUpdatePending || isUploadPending}>
                    {(isUpdatePending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </form>
              </Form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}