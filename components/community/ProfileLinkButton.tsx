// components/community/ProfileLinkButton.tsx - Add to existing components
'use client';

import { Button } from "@/components/ui/button";
import { ExternalLink, User } from "lucide-react";
import Link from "next/link";

interface ProfileLinkButtonProps {
  accountId: string;
  name?: string | null;
  className?: string;
}

export function ProfileLinkButton({ accountId, name, className }: ProfileLinkButtonProps) {
  // Only show name in button text if it's a real name, not an email
  const showNameInButton = name && !name.includes('@') && name !== 'Futurama Fan';
  
  return (
    <Link href={`/profile/${accountId}`} target="_blank">
      <Button variant="outline" size="sm" className={className}>
        <User className="h-4 w-4 mr-2" />
        View {showNameInButton ? `${name}'s ` : ''}Profile
        <ExternalLink className="h-4 w-4 ml-2" />
      </Button>
    </Link>
  );
}

