// components/settings/SocialLinksForm.tsx
'use client';

import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { UpdateSocialLinksSchema, UpdateSocialLinksInput, SocialLinks } from '@/lib/types/social-links-schemas';
import { Loader2, Plus, Trash2, Globe, Twitter, Github, Linkedin, Instagram, Youtube, MessageCircle } from 'lucide-react';
import { useUpdateSocialLinks } from '@/lib/mutations/social-links-mutations';

interface SocialLinksFormProps {
  initialSocialLinks: SocialLinks;
  userId: string;
}

export default function SocialLinksForm({ initialSocialLinks, userId }: SocialLinksFormProps) {
  const { mutate: updateSocialLinks, isPending } = useUpdateSocialLinks();

  const form = useForm<UpdateSocialLinksInput>({
    resolver: zodResolver(UpdateSocialLinksSchema),
    defaultValues: {
      website: initialSocialLinks.website || '',
      websites: initialSocialLinks.websites || [],
      twitter: initialSocialLinks.twitter || '',
      twitterHandles: initialSocialLinks.twitterHandles || [],
      github: initialSocialLinks.github || '',
      linkedin: initialSocialLinks.linkedin || '',
      instagram: initialSocialLinks.instagram || '',
      youtube: initialSocialLinks.youtube || '',
      discord: initialSocialLinks.discord || '',
    },
  });

  const websitesArray = useFieldArray({
    control: form.control,
    name: "websites",
  });

  const twitterHandlesArray = useFieldArray({
    control: form.control,
    name: "twitterHandles",
  });

  const onSubmit = (values: UpdateSocialLinksInput) => {
    // Clean up empty values
    const cleanedValues = {
      ...values,
      websites: values.websites?.filter(url => url.trim() !== '') || [],
      twitterHandles: values.twitterHandles?.filter(handle => handle.trim() !== '') || [],
    };

    updateSocialLinks(cleanedValues, {
      onSuccess: () => {
        toast.success("Social links updated successfully");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update social links");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Globe className="h-5 w-5" />
          <span>Social Links</span>
        </CardTitle>
        <CardDescription>
          Add your social media profiles and websites. These will be displayed on your public profile with SEO-friendly links.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Primary Website */}
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-2">
                    <Globe className="h-4 w-4" />
                    <span>Primary Website</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://yourwebsite.com" 
                      {...field} 
                      value={field.value || ''} 
                    />
                  </FormControl>
                  <FormDescription>
                    Your main website or portfolio
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Additional Websites */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel className="flex items-center space-x-2">
                  <Globe className="h-4 w-4" />
                  <span>Additional Websites</span>
                </FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => websitesArray.append('')}
                  disabled={isPending}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Website
                </Button>
              </div>
              
              {websitesArray.fields.map((field, index) => (
                <div key={field.id} className="flex items-center space-x-2">
                  <FormField
                    control={form.control}
                    name={`websites.${index}`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder={`https://website${index + 2}.com`}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => websitesArray.remove(index)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Separator />

            {/* Social Media Platforms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="twitter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Twitter className="h-4 w-4" />
                      <span>Twitter/X</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="username or @username" 
                        {...field} 
                        value={field.value || ''} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="github"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Github className="h-4 w-4" />
                      <span>GitHub</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="username" 
                        {...field} 
                        value={field.value || ''} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="linkedin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Linkedin className="h-4 w-4" />
                      <span>LinkedIn</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="username or full URL" 
                        {...field} 
                        value={field.value || ''} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="instagram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Instagram className="h-4 w-4" />
                      <span>Instagram</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="username or @username" 
                        {...field} 
                        value={field.value || ''} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="youtube"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Youtube className="h-4 w-4" />
                      <span>YouTube</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="@channel or full URL" 
                        {...field} 
                        value={field.value || ''} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discord"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <MessageCircle className="h-4 w-4" />
                      <span>Discord</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="username#1234" 
                        {...field} 
                        value={field.value || ''} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Additional Twitter Handles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel className="flex items-center space-x-2">
                  <Twitter className="h-4 w-4" />
                  <span>Additional Twitter Accounts</span>
                </FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => twitterHandlesArray.append('')}
                  disabled={isPending}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Twitter
                </Button>
              </div>
              
              {twitterHandlesArray.fields.map((field, index) => (
                <div key={field.id} className="flex items-center space-x-2">
                  <FormField
                    control={form.control}
                    name={`twitterHandles.${index}`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder="username or @username"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => twitterHandlesArray.remove(index)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Separator />

            <div className="flex justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Social Links
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

