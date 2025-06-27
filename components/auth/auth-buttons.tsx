// components/auth/auth-buttons.tsx
'use client';

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut, Settings, User as UserIcon, Loader2, Shield } from "lucide-react";
import { createSupabaseBrowserClient } from '@/lib/db';
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserProfile } from "@/lib/types/account-schemas";

interface AuthButtonsProps {
  user: { id: string; email?: string } | null;
  isLoading: boolean;
  onLoginClick: () => void;
  onSignupClick: () => void;
  onSettingsClick: () => void;
  profile?: UserProfile | null;
  disabled?: boolean;
  isAdmin?: boolean; // Add isAdmin prop
}

export default function AuthButtons({ 
  user, 
  isLoading, 
  onLoginClick, 
  onSignupClick, 
  onSettingsClick, 
  profile,
  disabled = false,
  isAdmin = false // Default to false
}: AuthButtonsProps) {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      router.refresh();
    } catch (error: any) {
      toast.error(`Failed to log out: ${error.message}`);
    }
  };

  const handleAdminPanelClick = () => {
    router.push('/admin');
  };

  const getInitials = (name?: string | null, email?: string | null) => {
     if (name) return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
     return email ? email.substring(0, 2).toUpperCase() : <UserIcon className="h-5 w-5"/>;
  };

  const getDisplayName = (name?: string | null, email?: string | null) => {
    // If name exists and is not just an email address, use it
    if (name && name !== email && !name.includes('@')) {
      return name;
    }
    // Otherwise, use 'User' as fallback (don't show email as name)
    return 'User';
  };

  if (isLoading) {
    return <Button variant="outline" size="icon" disabled><Loader2 className="h-4 w-4 animate-spin" /></Button>;
  }

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.avatarUrl ?? undefined} alt={profile?.name ?? user.email ?? 'User'} />
              <AvatarFallback>{getInitials(profile?.name, user.email)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{getDisplayName(profile?.name, user.email)}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onSettingsClick}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          
          {/* Admin Panel Option - Only show if user is admin */}
          {isAdmin && (
            <>
              <DropdownMenuItem onClick={handleAdminPanelClick}>
                <Shield className="mr-2 h-4 w-4" />
                <span>Admin Panel</span>
              </DropdownMenuItem>
            </>
          )}
          
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="space-x-2">
      <Button variant="outline" onClick={onLoginClick} disabled={disabled}>Sign In</Button>
      <Button onClick={onSignupClick} disabled={disabled}>Sign Up</Button>
    </div>
  );
}