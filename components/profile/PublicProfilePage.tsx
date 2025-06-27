// components/profile/PublicProfilePage.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Globe, 
  Twitter, 
  Github, 
  Linkedin, 
  Instagram, 
  Youtube, 
  MessageCircle,
  ExternalLink,
  MapPin,
  Calendar,
  Star
} from "lucide-react";
import { OwnerProfile } from "@/lib/types/owner-profile-schemas";
import Link from "next/link";
import { format } from "date-fns";

interface PublicProfilePageProps {
  profile: OwnerProfile;
}

export default function PublicProfilePage({ profile }: PublicProfilePageProps) {
  const getInitials = (name?: string | null, email?: string | null) => {
    if (name && name !== email && !name.includes('@')) {
      return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    }
    return email ? email.substring(0, 2).toUpperCase() : '??';
  };

  const getDisplayName = (name?: string | null, email?: string | null) => {
    // If name exists and is not just an email address, use it
    if (name && name !== email && !name.includes('@')) {
      return name;
    }
    // Otherwise, use fallback
    return 'Community Member';
  };

  const socialIcons = {
    website: Globe,
    twitter: Twitter,
    github: Github,
    linkedin: Linkedin,
    instagram: Instagram,
    youtube: Youtube,
    discord: MessageCircle,
  };

  const getSocialUrl = (platform: string, handle: string) => {
    switch (platform) {
      case 'twitter': return `https://twitter.com/${handle.replace('@', '')}`;
      case 'github': return `https://github.com/${handle}`;
      case 'linkedin': return handle.startsWith('http') ? handle : `https://linkedin.com/in/${handle}`;
      case 'instagram': return `https://instagram.com/${handle.replace('@', '')}`;
      case 'youtube': return handle.startsWith('http') ? handle : `https://youtube.com/@${handle}`;
      case 'discord': return handle; // Discord handles are complex, just return as-is
      default: return handle;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header Card */}
        <Card className="mb-8 border-2 border-primary/20">
          <CardHeader className="text-center pb-2">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-32 w-32 border-4 border-primary/20">
                <AvatarImage src={profile.avatarUrl ?? undefined} alt={profile.name ?? ''} />
                <AvatarFallback className="text-2xl">
                  {getInitials(profile.name, profile.email)}
                </AvatarFallback>
              </Avatar>
              
              <div className="space-y-2">
                <CardTitle className="text-3xl font-bold">
                  {getDisplayName(profile.name, profile.email)}
                </CardTitle>
                <CardDescription className="text-lg">
                  Futurama Community Member
                </CardDescription>
                
                <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4" />
                    <span>Level {profile.level}</span>
                  </div>
                  {profile.createdAt && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {format(new Date(profile.createdAt), 'MMM yyyy')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          
          {profile.bio && (
            <CardContent className="text-center">
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {profile.bio}
              </p>
            </CardContent>
          )}
        </Card>

        {/* Social Links Card */}
        {(profile.socialLinks?.websites?.length || 
          profile.socialLinks?.twitter || 
          profile.socialLinks?.github || 
          profile.socialLinks?.linkedin ||
          profile.socialLinks?.facebook ||
          profile.socialLinks?.instagram ||
          profile.socialLinks?.youtube) && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Connect & Follow</span>
              </CardTitle>
              <CardDescription>
                Find {getDisplayName(profile.name, profile.email)} on other platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Websites */}
                {profile.socialLinks?.websites?.map((website, index) => (
                  <Link
                    key={`website-${index}`}
                    href={website}
                    target="_blank"
                    rel="noopener noreferrer dofollow"
                    className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                  >
                    <Globe className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <div className="font-medium group-hover:text-primary">
                        {index === 0 ? 'Website' : `Website ${index + 1}`}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {website.replace(/^https?:\/\//, '')}
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  </Link>
                ))}

                {/* Social Platforms */}
                {Object.entries({
                  twitter: profile.socialLinks?.twitter,
                  github: profile.socialLinks?.github,
                  linkedin: profile.socialLinks?.linkedin,
                  instagram: profile.socialLinks?.instagram,
                  youtube: profile.socialLinks?.youtube,
                }).map(([platform, handle]) => {
                  if (!handle) return null;
                  const Icon = socialIcons[platform as keyof typeof socialIcons];
                  
                  return (
                    <Link
                      key={platform}
                      href={getSocialUrl(platform, handle)}
                      target="_blank"
                      rel="noopener noreferrer dofollow"
                      className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                    >
                      <Icon className="h-5 w-5 text-blue-600" />
                      <div className="flex-1">
                        <div className="font-medium group-hover:text-primary capitalize">
                          {platform}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {platform === 'twitter' || platform === 'instagram' ? `@${handle.replace('@', '')}` : handle}
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                    </Link>
                  );
                })}

                {/* Additional Twitter Handles */}
                {profile.socialLinks?.twitterHandles?.filter(handle => handle !== profile.socialLinks?.twitter).map((handle, index) => (
                  <Link
                    key={`twitter-${index}`}
                    href={getSocialUrl('twitter', handle)}
                    target="_blank"
                    rel="noopener noreferrer dofollow"
                    className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                  >
                    <Twitter className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <div className="font-medium group-hover:text-primary">
                        Twitter {index + 2}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        @{handle.replace('@', '')}
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Community Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Community Involvement</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-primary">Level {profile.level}</div>
                <div className="text-sm text-muted-foreground">Community Level</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-green-600">Active</div>
                <div className="text-sm text-muted-foreground">Member Status</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-blue-600">
                  {profile.createdAt ? format(new Date(profile.createdAt), 'yyyy') : 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">Member Since</div>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                {getDisplayName(profile.name, profile.email)} is part of the Futurama Community - a vibrant 3D virtual space 
                where tech enthusiasts, creators, and innovators come together.
              </p>
              
              <Link href="/community">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <MapPin className="h-4 w-4 mr-2" />
                  Visit Community
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

