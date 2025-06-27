// components/profile-card.tsx (corrected)
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, X, Mail, Globe, Twitter, Github, Loader2, AlertCircle } from "lucide-react";
import type { HouseType } from "@/lib/types";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { EnhancedPlotData } from '@/lib/types/enhanced-plot.types';
import { useOwnerProfile } from '@/lib/queries/owner-profile-queries';
import { ProfileLinkButton } from "@/components/community/ProfileLinkButton";
import { Separator } from '../ui/separator';

interface ProfileCardProps {
    plotId: string;
    initialLikes: number;
    ownerId: string;
    houseType: HouseType;
    viewerId?: string;
    onClose: () => void;
    enhancedData?: EnhancedPlotData; // New prop for pre-loaded data
}

export function ProfileCard({
    plotId,
    initialLikes,
    ownerId,
    houseType,
    viewerId,
    onClose,
    enhancedData
}: ProfileCardProps) {
    const [likes, setLikes] = useState(initialLikes);
    const queryClient = useQueryClient();

    // Use the new owner profile hook, but only if we don't have enhanced data
    const shouldFetchProfile = !enhancedData?.ownerProfile && !!ownerId;
    const { data: ownerProfile, isLoading, error } = useOwnerProfile(
        shouldFetchProfile ? ownerId : null,
        { enabled: shouldFetchProfile }
    );

    // Use enhanced data if available, otherwise use fetched profile
    const profileData = enhancedData?.ownerProfile || ownerProfile;
    const isProfileLoading = enhancedData?.isProfileLoading || isLoading;

    // Check if the current user has liked this plot
    const { data: hasLiked } = useQuery({
        queryKey: ['plotLike', plotId, viewerId],
        queryFn: async () => {
            if (!viewerId || !plotId) return false;
            return api.hasLikedPlot(plotId);
        },
        enabled: !!viewerId && !!plotId,
    });

    // Like/unlike mutation
    const { mutate: toggleLike, isPending: isLikePending } = useMutation({
        mutationFn: async () => {
            if (!viewerId) {
                toast.error("Please sign in to like houses!");
                return null;
            }
            return api.toggleLikePlot(plotId);
        },
        onMutate: async () => {
            setLikes(prev => hasLiked ? prev - 1 : prev + 1);
            return { previousLiked: hasLiked };
        },
        onSuccess: (data) => {
            if (data) {
                setLikes(data.likesCount);
                queryClient.setQueryData(['plotLike', plotId, viewerId], data.liked);
            }
        },
        onError: (error, _, context) => {
            setLikes(initialLikes);
            if (context) {
                queryClient.setQueryData(['plotLike', plotId, viewerId], context.previousLiked);
            }
            toast.error("Failed to update like status");
        },
    });

    const getInitials = (name?: string | null, email?: string | null) => {
        if (name) return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
        return email ? email.substring(0, 2).toUpperCase() : '??';
    };

    const getDisplayName = (name?: string | null, email?: string | null) => {
        // If name exists and is not just an email address, use it
        if (name && name !== email && !name.includes('@')) {
            return name;
        }
        // Otherwise, use email or fallback
        return email || 'Futurama Fan';
    };

    // Add rotation information to the display
    const facingDirection = enhancedData?.facingDirection;
    const getDirectionName = (degrees: number) => {
        const normalized = ((degrees % 360) + 360) % 360;
        if (normalized >= 315 || normalized < 45) return 'North';
        if (normalized >= 45 && normalized < 135) return 'East';
        if (normalized >= 135 && normalized < 225) return 'South';
        if (normalized >= 225 && normalized < 315) return 'West';
        return 'North';
    };

    if (isProfileLoading) {
        return (
            <Card className="w-80 shadow-lg border-2 border-[#FF6B6B]">
                <CardHeader className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </CardHeader>
            </Card>
        );
    }

    if (error || !profileData) {
        console.error("Profile load error:", { error, ownerId, plotId, houseType });
        return (
            <Card className="w-80 shadow-lg border-2 border-destructive">
                <CardHeader>
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 rounded-full" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                    <div className="flex flex-col items-center text-destructive">
                        <AlertCircle className="h-8 w-8 mb-2" />
                        <CardTitle>Error</CardTitle>
                        <CardDescription>
                            Could not load profile for ID: {ownerId ? ownerId.substring(0, 8) + '...' : 'unknown'}
                        </CardDescription>
                        <div className="text-xs mt-2 text-muted-foreground">
                            {error ? `Error: ${error.message || 'Unknown error'}` : 'Owner data unavailable'}
                        </div>
                    </div>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card className="w-80 shadow-lg border-2 border-[#FF6B6B]">
            <CardHeader className="relative pb-2">
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 rounded-full" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-[#FF6B6B]">
                        <AvatarImage src={(profileData.avatarUrl || profileData.rawUserMetaData.avatarUrl) ?? undefined} alt={profileData.name ?? profileData.email ?? ''} />
                        <AvatarFallback>{getInitials(profileData.name, profileData.email)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="text-xl">{getDisplayName(profileData.name, profileData.email)}</CardTitle>
                        <CardDescription>
                            <Badge variant="outline" className="mt-1 bg-[#FF6B6B] text-white border-none">
                                Level {profileData.level}
                            </Badge>
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pb-2">
                <div className="text-sm text-muted-foreground mb-4">{profileData.bio}</div>
                <div className="grid gap-2">
                    <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{profileData.email}</span>
                    </div>

                    {/* Show message if no social links are set up */}
                    {(!profileData.socialLinks?.websites?.length &&
                        !profileData.socialLinks?.twitter &&
                        !profileData.socialLinks?.twitterHandles?.length &&
                        !profileData.socialLinks?.github) && (
                            <div className="text-xs text-muted-foreground mt-1 italic">
                                No social links have been added to this profile yet.
                            </div>
                        )}

                    {/* Social links rendering... same as before */}
                    {profileData.socialLinks?.websites && profileData.socialLinks.websites.length > 0 && (
                        <>
                            {profileData.socialLinks.websites.map((website, index) => (
                                <div key={`website-${index}`} className="flex items-center gap-2 text-sm">
                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                    <a href={website} target="_blank" rel="noopener noreferrer" className="text-[#FF6B6B] hover:underline truncate">
                                        {index === 0 ? "Personal Website" : `Website ${index + 1}`}
                                    </a>
                                </div>
                            ))}
                        </>
                    )}

                    {profileData.socialLinks?.twitter && (
                        <div className="flex items-center gap-2 text-sm">
                            <Twitter className="h-4 w-4 text-muted-foreground" />
                            <a href={`https://twitter.com/${profileData.socialLinks.twitter}`} target="_blank" rel="noopener noreferrer" className="text-[#FF6B6B] hover:underline">
                                @{profileData.socialLinks.twitter}
                            </a>
                        </div>
                    )}

                    {profileData.socialLinks?.github && (
                        <div className="flex items-center gap-2 text-sm">
                            <Github className="h-4 w-4 text-muted-foreground" />
                            <a href={`https://github.com/${profileData.socialLinks.github}`} target="_blank" rel="noopener noreferrer" className="text-[#FF6B6B] hover:underline">
                                {profileData.socialLinks.github}
                            </a>
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="flex flex-col border-t pt-4">
                <div className="flex justify-between w-full">
                    <div>
                        <div className="text-sm text-muted-foreground space-y-1">
                            <div>House Type: {houseType.replace("type", "")}</div>
                            {facingDirection !== undefined && (
                                <div>Facing: {getDirectionName(facingDirection)} ({facingDirection}°)</div>
                            )}
                        </div>

                        <Button
                            variant={hasLiked ? "default" : "outline"}
                            size="sm"
                            className={hasLiked ? "bg-[#FF6B6B] hover:bg-[#FF6B6B]/90" : ""}
                            onClick={() => toggleLike()}
                            disabled={isLikePending || !viewerId}
                            title={!viewerId ? "Log in to like" : (hasLiked ? "Unlike" : "Like")}
                        >
                            {isLikePending ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                                <Heart className={`h-4 w-4 mr-1 ${hasLiked ? "fill-current" : ""}`} />
                            )}
                            {likes}
                        </Button>
                    </div>
                </div>

                <Separator className="my-3" />

                <ProfileLinkButton
                    accountId={ownerId}
                    name={profileData.name}
                    className="self-center"
                />
            </CardFooter>
        </Card>
    );
}
