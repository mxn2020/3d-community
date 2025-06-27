// Updated components/settings/SettingsDialog.tsx
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AccountSettingsForm from './AccountSettingsForm';
import ProfileSettingsForm from './ProfileSettingsForm';
import SocialLinksForm from './SocialLinksForm';
import { UserProfile, Account } from '@/lib/types/account-schemas';
import { useAccount } from "@/lib/queries/account-queries";

interface SettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  userId: string;
  initialProfile: UserProfile;
}

export default function SettingsDialog({
  isOpen,
  onOpenChange,
  userId,
  initialProfile,
}: SettingsDialogProps) {
  // Placeholder account data - replace with real fetch
  const placeholderInitialAccount: Account = {
    id: 'placeholder-account-id',
    ownerUserId: userId,
    accountType: 'personal',
    name: initialProfile?.name || null,
    avatarUrl: initialProfile?.avatarUrl || null,
    email: initialProfile?.email || 'loading...',
    twoFactorEnabled: false,
    subscriptionPlan: 'free',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: userId,
    deletedAt: null,
    deletedBy: null,
    updatedBy: userId,
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your profile, social links, and account settings.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="profile" className="pt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="social">Social Links</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            {initialProfile && (
              <ProfileSettingsForm initialProfile={initialProfile} userId={userId} />
            )}
          </TabsContent>
          
          <TabsContent value="social">
            {initialProfile && (
              <SocialLinksForm 
                initialSocialLinks={initialProfile.rawUserMetaData?.social_links || {}}
                userId={userId} 
              />
            )}
          </TabsContent>
          
          <TabsContent value="account">
            {placeholderInitialAccount && (
              <AccountSettingsForm initialAccount={placeholderInitialAccount} userId={userId} />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

