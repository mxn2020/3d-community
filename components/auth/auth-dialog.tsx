// components/auth/auth-dialog.tsx
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import LoginPageContent from './login-page-content'; // Renamed from LoginPage
import SignupPageContent from './signup-page-content'; // Renamed from SignupPage

interface AuthDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  mode: 'login' | 'signup';
  onModeChange: (mode: 'login' | 'signup') => void;
}

export default function AuthDialog({ isOpen, onOpenChange, mode, onModeChange }: AuthDialogProps) {

  const handleSuccess = () => {
    onOpenChange(false); // Close dialog on successful login/signup
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange} modal={true}>
      <DialogContent className="sm:max-w-[425px] fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <DialogHeader>
          <DialogTitle>{mode === 'login' ? 'Sign In' : 'Sign Up'}</DialogTitle>
          <DialogDescription>
            {mode === 'login'
              ? "Enter your credentials to access your community plot."
              : "Create an account to join the Futurama community."}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {mode === 'login' ? (
            <LoginPageContent
               onSwitchMode={() => onModeChange('signup')}
               onSuccess={handleSuccess} />
          ) : (
            <SignupPageContent
               onSwitchMode={() => onModeChange('login')}
               onSuccess={handleSuccess} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}