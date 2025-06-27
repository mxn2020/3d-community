// components/CommunitySpace.tsx
'use client';

import { Suspense, useState, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sky, OrbitControls, Environment } from '@react-three/drei';
import { Neighborhood } from '@/components/neighborhood';
import { ProfileCard } from '@/components/profile/ProfileCard';
import { DebugPlotsPanel } from '@/components/debug-plots-panel';
import { CameraModes, type CameraMode } from '@/components/CameraModes';
import { CameraModeSelector } from '@/components/CameraModeSelector';
import { CameraController } from '@/components/CameraController';
import type { HouseType, PlotData } from '@/lib/types';
import AuthButtons from '@/components/auth/auth-buttons';
import AuthDialog from '@/components/auth/auth-dialog';
import SettingsDialog from '@/components/settings/SettingsDialog';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { usePlotManagement } from '@/hooks/use-plots';
import { FeedbackCenter } from '@/components/feedback-center';
import { CommunityBoard } from '@/components/community-board';
import { DirectorySearch } from '@/components/directory-search';
import { PlotPurchaseForm } from "@/components/plot/PlotPurchaseForm";
import { PlotSelectionHandler } from "@/components/plot/plot-selection-handler";
import { PlotDetailDialog } from "@/components/plot/plot-detail-dialog";
import { PlotHistoryDialog } from "@/components/plot/PlotHistoryDialog";
import ErrorBoundary from './error-boundary';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { useAuth } from '@/components/providers/auth-provider';
import { EnhancedPlotData } from '@/lib/types/enhanced-plot.types';


export default function CommunitySpace(
  { user, userId, accountId }:
    { user?: SupabaseUser | null; userId?: string | null; accountId?: string | null }
) {
  const [selectedHouse, setSelectedHouse] = useState<EnhancedPlotData | null>(null);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [authDialogMode, setAuthDialogMode] = useState<'login' | 'signup'>('login');
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isDebugPanelOpen, setIsDebugPanelOpen] = useState(false);
  const [controlsEnabled, setControlsEnabled] = useState(true);
  const [cameraMode, setCameraMode] = useState<CameraMode>('cinematic'); // Default to cinematic mode

  const controlsRef = useRef<any>(null);

  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isCommunityBoardOpen, setIsCommunityBoardOpen] = useState(false);
  const [isDirectorySearchOpen, setIsDirectorySearchOpen] = useState(false);
  const [plotPurchaseInfo, setPlotPurchaseInfo] = useState<{ open: boolean; plotId: string | null }>({
    open: false,
    plotId: null,
  });

  const [plotDetailsInfo, setPlotDetailsInfo] = useState<{
    open: boolean;
    plot: any | null;
    plotState: any | null;
  }>({
    open: false,
    plot: null,
    plotState: null,
  });

  // State for plot history dialog
  const [plotHistoryInfo, setPlotHistoryInfo] = useState<{
    open: boolean;
    plotId: string | null;
  }>({
    open: false,
    plotId: null,
  });

  // Add state for already-owned dialog
  const [isAlreadyOwnedDialogOpen, setIsAlreadyOwnedDialogOpen] = useState(false);

  // Track which plot is selected for a dialog (e.g., purchase)
  const [selectedPlotIdForDialog, setSelectedPlotIdForDialog] = useState<string | null>(null);

  // Tour points for the tour mode - these should ideally come from your data
  // Points are [x, y, z] coordinates representing interesting locations
  const [tourPoints, setTourPoints] = useState<Array<[number, number, number]>>([
    [0, 1, 0],     // Center of the community
    [20, 1, 20],   // Northeast corner
    [-20, 1, 20],  // Northwest corner
    [-20, 1, -20], // Southwest corner
    [20, 1, -20],  // Southeast corner
  ]);

  const [cameraTarget, setCameraTarget] = useState<[number, number, number] | null>(null);

  // Track when the scene is loaded to trigger auth check afterward
  const [isSceneLoaded, setIsSceneLoaded] = useState(false);

  // Auth hooks
  const {
    session,
    profile,
    isLoadingAuth,
    isAuthenticated,
    authError,
    startAuthCheck,
    isAuthCheckTriggered
  } = useAuth();

  // Effect to disable controls when input elements are focused
  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        setControlsEnabled(false);
      }
    };

    const handleBlur = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        setControlsEnabled(true);
      }
    };

    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);

    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    };
  }, []);

  // Effect to start auth check AFTER scene loads
  useEffect(() => {
    // If auth data is already loaded from the server, or an error occurred,
    // and auth check has been triggered (by AuthProvider), no need to start again.
    if (isSceneLoaded && (!isAuthenticated && !authError) && !isAuthCheckTriggered) {
      console.log('Scene loaded, starting client-side auth check');
      const timer = setTimeout(() => {
        startAuthCheck();
      }, 100);
      return () => clearTimeout(timer);
    } else if (isSceneLoaded && (isAuthenticated || authError)) {
      console.log('Auth data already available from server or auth check triggered.');
    }
  }, [isSceneLoaded, isAuthenticated, authError, isAuthCheckTriggered, startAuthCheck]);

  // Effect to disable controls when dialogs are open
  useEffect(() => {
    const shouldEnableControls = !isAuthDialogOpen &&
      !isSettingsDialogOpen &&
      !isFeedbackOpen &&
      !isCommunityBoardOpen &&
      !isDirectorySearchOpen &&
      !plotPurchaseInfo.open &&
      !plotDetailsInfo.open &&
      !plotHistoryInfo.open;

    setControlsEnabled(shouldEnableControls);
  }, [
    isAuthDialogOpen,
    isSettingsDialogOpen,
    isFeedbackOpen,
    isCommunityBoardOpen,
    isDirectorySearchOpen,
    plotPurchaseInfo.open,
    plotDetailsInfo.open,
    plotHistoryInfo.open
  ]);

  // Effect to handle camera mode change
  useEffect(() => {
    // If we enter tour mode, we should disable all other controls
    if (cameraMode === 'tour') {
      // Make sure the tour has a clean slate
      setCameraTarget(null);
    }
  }, [cameraMode]);

  // Plot management hooks
  const { userPlot, availablePlots, isPurchaseDialogOpen, selectedPlotId, openPurchaseDialog, isLoading: isPlotsLoading } = usePlotManagement(accountId);

  // Pass userPlotId to Neighborhood for pink highlight
  const userPlotId = userPlot?.id ?? null;
  const userHasPlot = !!userPlotId;

  const openAuthDialog = (mode: 'login' | 'signup') => {
    setAuthDialogMode(mode);
    setIsAuthDialogOpen(true);
  };

  const openSettingsDialog = () => {
    setIsSettingsDialogOpen(true);
  };

  const handleNavigateToHouse = (position: [number, number, number]) => {
    // Change back to cinematic mode when navigating 
    setCameraMode('cinematic');
    setCameraTarget(position);
  };

  const handleSelectHouse = (house: EnhancedPlotData) => {
    if (!house) {
      console.error("handleSelectHouse called with null/undefined house");
      return;
    }

    setSelectedHouse(house);
  };

  const handleCloseProfileCard = () => {
    setSelectedHouse(null);
  };

  // Tour completion callback
  const handleTourComplete = () => {
    // Optional: Switch to a different camera mode when the tour completes
    setCameraMode('cinematic');
    toast.success('Tour completed! Feel free to explore on your own now.');
  };

  // Handle showing the plot purchase dialog
  const handleOpenPlotPurchase = (plotId: string) => {
    setSelectedPlotIdForDialog(plotId);

    // If the user already has a plot, show warning
    if (userHasPlot) {
      setIsAlreadyOwnedDialogOpen(true);
      return;
    }

    // Otherwise open purchase dialog
    setPlotPurchaseInfo({
      open: true,
      plotId
    });
  };

  // Handle successful plot purchase
  const handlePlotPurchaseSuccess = () => {
    // Clear selected plot
    setSelectedPlotIdForDialog(null);
    // Close any open dialogs
    setPlotPurchaseInfo({ open: false, plotId: null });
    // Show success toast
    toast.success('Plot purchased successfully! Welcome to the neighborhood!');
  };

  // Handle showing the plot details dialog
  const handleShowPlotDetails = (plot: any, plotState: any) => {
    setSelectedPlotIdForDialog(plot.id);

    // Check if this is the user's plot
    const isUserOwned = plotState && plotState.ownerId === accountId;

    setPlotDetailsInfo({
      open: true,
      plot: {
        ...plot,
        isUserOwned
      },
      plotState: {
        ...plotState,
        isUserOwned
      }
    });
  };

  // Handle showing plot history
  const handleShowPlotHistory = (plotId: string) => {
    setPlotHistoryInfo({
      open: true,
      plotId
    });
  };

  // Handle selling a plot
  const handleSellPlotSuccess = () => {
    // Clear selected plot
    setSelectedPlotIdForDialog(null);
    // Close any open dialogs
    setPlotDetailsInfo({ open: false, plot: null, plotState: null });
    // Show success toast
    toast.success('Plot sold successfully!');
  };

  const getCameraModeInstructions = () => {
    switch (cameraMode) {
      case 'cinematic':
        return (
          <div className="grid grid-cols-2 gap-x-4">
            <div>
              <h3 className="font-semibold">Mouse:</h3>
              <p>• Left click + drag: Rotate</p>
              <p>• Right click + drag: Pan</p>
              <p>• Scroll: Zoom</p>
              <p>• Click houses: View profiles</p>
            </div>
            <div>
              <h3 className="font-semibold">Keyboard:</h3>
              <p>• W/S: Forward/Backward</p>
              <p>• A/D: Strafe Left/Right</p>
              <p>• Q/E: Move Up/Down</p>
              <p>• Arrow Keys: Rotate View</p>
            </div>
          </div>
        );

      case 'person':
        return (
          <div className="grid grid-cols-2 gap-x-4">
            <div>
              <h3 className="font-semibold">Mouse:</h3>
              <p>• Left click + drag: Look Around</p>
              <p>• Click houses: View profiles</p>
            </div>
            <div>
              <h3 className="font-semibold">Keyboard:</h3>
              <p>• W/S: Forward/Backward</p>
              <p>• A/D: Strafe Left/Right</p>
              <p>• Arrow Keys: Look Around</p>
            </div>
          </div>
        );

      case 'helicopter':
        return (
          <div className="grid grid-cols-2 gap-x-4">
            <div>
              <h3 className="font-semibold">Mouse:</h3>
              <p>• Left click + drag: Rotate View</p>
              <p>• Click houses: View profiles</p>
            </div>
            <div>
              <h3 className="font-semibold">Keyboard:</h3>
              <p>• W/S: Forward/Backward</p>
              <p>• A/D: Strafe Left/Right</p>
              <p>• Q/E: Adjust Height</p>
              <p>• Arrow Keys: Rotate View</p>
            </div>
          </div>
        );

      case 'tour':
        return (
          <div>
            <p>Sit back and enjoy the guided tour of the community!</p>
            <p>Click any mode above to exit the tour.</p>
          </div>
        );

      default:
        return null;
    }
  };

  // Effect to apply theme from profile
  useEffect(() => {
    if (profile?.theme) {
      document.documentElement.classList.remove('light', 'dark');
      if (profile.theme !== 'system') {
        document.documentElement.classList.add(profile.theme);
      } else {
        // Handle system theme preference if needed
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.add(prefersDark ? 'dark' : 'light');
      }
    }
  }, [profile?.theme]);

  useEffect(() => {
    if (authError) {
      toast.error(`Authentication error: ${authError.message}`);
    }
  }, [authError]);

  return (
    <div className="scene-container relative w-full h-full">
      {/* Auth/Settings Buttons Overlay */}
      <div className="absolute top-4 right-4 z-20">
        <AuthButtons
          user={user ? { id: user.id, email: user.email } : null}
          isLoading={isLoadingAuth}
          onLoginClick={() => openAuthDialog('login')}
          onSignupClick={() => openAuthDialog('signup')}
          onSettingsClick={openSettingsDialog}
          profile={profile}
          disabled={isLoadingAuth}
          isAdmin={user?.app_metadata?.role === 'admin'}
        />
      </div>

      <div className="absolute top-4 left-4 z-10 flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsFeedbackOpen(true)}
        >
          Feedback
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsCommunityBoardOpen(true)}
        >
          Community Board
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsDirectorySearchOpen(true)}
        >
          Directory
        </Button>
      </div>

      {/* 3D Scene */}
      <ErrorBoundary>
        <Canvas
          shadows
          gl={{ antialias: true, alpha: false }}
          onCreated={() => setIsSceneLoaded(true)}
          camera={{
            position: [0, 20, 50],
            fov: 45,
            near: 0.1,
            far: 1000,
          }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[10, 10, 10]}
            intensity={1}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />

          <Sky />
          <Environment preset="sunset" />

          <Suspense fallback={null}>
            <Neighborhood
              onSelectHouse={handleSelectHouse}
              userId={accountId}
              userPlotId={userPlotId}
              onOpenFeedback={() => setIsFeedbackOpen(true)}
              onOpenCommunityBoard={() => setIsCommunityBoardOpen(true)}
              onOpenDirectorySearch={() => setIsDirectorySearchOpen(true)}
              onOpenPlotPurchase={handleOpenPlotPurchase}
              onShowPlotDetails={handleShowPlotDetails}
              setCameraTarget={setCameraTarget}
              selectedPlotId={selectedPlotIdForDialog} // Pass to highlight selected plot
            />

            {/* Only show CameraController when in cinematic mode */}
            {cameraMode === 'cinematic' && cameraTarget && (
              <CameraController target={cameraTarget} />
            )}

            {/* Base OrbitControls that our CameraModes component will use */}
            <OrbitControls
              ref={controlsRef}
              enableZoom={cameraMode === 'cinematic'}
              enablePan={cameraMode === 'cinematic'}
              enableRotate={cameraMode === 'cinematic'}
              minPolarAngle={Math.PI / 6}
              maxPolarAngle={Math.PI / 2.5}
              minDistance={0.05}
              maxDistance={600}
              zoomSpeed={8}
              panSpeed={8}
            />

            {/* Camera Modes Component */}
            <CameraModes
              mode={cameraMode}
              controlsRef={controlsRef}
              enabled={controlsEnabled}
              tourPoints={tourPoints}
              onTourComplete={handleTourComplete}
            />

            {/* Only use SceneRotator for cinematic mode and when not interacting */}
            {cameraMode === 'cinematic' && (
              <SceneRotator
                controlsRef={controlsRef}
                enabled={!isAuthDialogOpen && !isSettingsDialogOpen && !selectedHouse && !isPurchaseDialogOpen && cameraMode === 'cinematic'}
              />
            )}
          </Suspense>
        </Canvas>
      </ErrorBoundary>

      {/* Camera Mode Selector */}
      <div className="absolute top-16 left-4 z-10">
        <CameraModeSelector
          currentMode={cameraMode}
          onModeChange={setCameraMode}
        />
      </div>

      {/* Profile Card Overlay */}
      {selectedHouse && (
        <div className="absolute top-4 md:right-20 sm:right-20 right-4 z-10 transform md:-translate-x-0 sm:-translate-x-0 -translate-x-0">
          {/* Pass user?.id to check if the viewer can like */}
          <ProfileCard
            plotId={selectedHouse.id}
            initialLikes={selectedHouse.likesCount || 0}
            ownerId={selectedHouse.ownerId || selectedHouse.ownerId || ''}
            houseType={selectedHouse.houseType as HouseType || selectedHouse.houseType as HouseType || 'type1'}
            viewerId={user?.id}
            onClose={handleCloseProfileCard}
            enhancedData={selectedHouse}
          />
        </div>
      )}

      {/* User Plot Status */}
      {isAuthenticated && (
        <div className="absolute bottom-20 left-4 z-10 bg-black/70 text-white p-3 rounded-lg">
          {userPlot ? (
            <div>
              <h3 className="text-sm font-bold">Your Property</h3>
              <p className="text-xs">House Style: {userPlot.houseType?.replace('type', 'Style ')}</p>
              <div className="mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (userPlot.id) {
                      handleShowPlotHistory(userPlot.id);
                    }
                  }}
                >
                  View History
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-sm font-bold">No Property Yet</h3>
              <p className="text-xs">Click on an available plot to purchase</p>
            </div>
          )}
        </div>
      )}

      {/* Plots Data Loading Indicator - only shows when plots are loading */}
      {isPlotsLoading && (
        <div className="absolute bottom-40 left-4 z-10 bg-black/70 text-white p-3 rounded-lg flex items-center">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span className="text-xs">Loading plots data...</span>
        </div>
      )}

      {/* Updated Controls Info Overlay with camera mode specific instructions */}
      <div className="absolute bottom-4 left-4 z-10 bg-black/70 text-white p-3 rounded-lg text-xs">
        <h2 className="text-sm font-bold mb-1">Controls ({cameraMode} mode)</h2>
        {getCameraModeInstructions()}
        <button
          onClick={() => setIsDebugPanelOpen(prev => !prev)}
          className="mt-2 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
        >
          {isDebugPanelOpen ? 'Hide' : 'Show'} Debug Panel
        </button>
      </div>

      {/* Debug Plots Panel */}
      {isDebugPanelOpen && (
        <div className="absolute top-16 left-4 z-20">
          <DebugPlotsPanel
            onNavigateToPlot={handleNavigateToHouse}
            onClose={() => setIsDebugPanelOpen(false)}
          />
        </div>
      )}

      {/* Render Modals/Dialogs here, outside the Canvas */}
      {isFeedbackOpen && <FeedbackCenter onClose={() => setIsFeedbackOpen(false)} />}
      {isCommunityBoardOpen && <CommunityBoard onClose={() => setIsCommunityBoardOpen(false)} />}
      {isDirectorySearchOpen && (
        <DirectorySearch
          onClose={() => setIsDirectorySearchOpen(false)}
          onNavigateToHouse={handleNavigateToHouse} // Assuming handleNavigateToHouse is defined in CommunitySpace
        />
      )}
      {plotPurchaseInfo.plotId && plotPurchaseInfo.open && !userHasPlot && (
        user?.id && accountId ? (
          <PlotPurchaseForm
            plotId={plotPurchaseInfo.plotId}
            accountId={accountId}
            userId={user.id}
            open={plotPurchaseInfo.open}
            onOpenChange={(open) => setPlotPurchaseInfo({ ...plotPurchaseInfo, open })}
            onSuccess={handlePlotPurchaseSuccess}
          />
        ) : (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading user info...</span>
          </div>
        )
      )}
      {/* Already Owned Dialog */}
      {isAlreadyOwnedDialogOpen && userHasPlot && (
        <Dialog open={isAlreadyOwnedDialogOpen} onOpenChange={setIsAlreadyOwnedDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Plot Already Owned</DialogTitle>
              <DialogDescription>
                You already own a plot. Only one plot set per user is allowed.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end">
              <Button onClick={() => setIsAlreadyOwnedDialogOpen(false)}>OK</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Plot Details Dialog */}
      {plotDetailsInfo.open && plotDetailsInfo.plot && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
          <PlotDetailDialog
            plot={plotDetailsInfo.plot}
            plotState={plotDetailsInfo.plotState}
            onClose={() => setPlotDetailsInfo(prev => ({ ...prev, open: false }))}
            onPurchase={handleOpenPlotPurchase}
            isAuthenticated={isAuthenticated}
            isUserOwned={plotDetailsInfo.plotState?.isUserOwned}
            accountId={accountId}
            userId={user?.id}
            onSellSuccess={handleSellPlotSuccess}
          />
        </div>
      )}

      {/* Plot History Dialog */}
      {plotHistoryInfo.open && plotHistoryInfo.plotId && (
        <PlotHistoryDialog
          plotId={plotHistoryInfo.plotId}
          isOpen={plotHistoryInfo.open}
          onClose={() => setPlotHistoryInfo({ open: false, plotId: null })}
        />
      )}

      {/* Plot Selection Handler */}
      <PlotSelectionHandler onSelectPlot={handleOpenPlotPurchase} />

      {/* Auth Dialog */}
      <AuthDialog
        isOpen={isAuthDialogOpen}
        onOpenChange={setIsAuthDialogOpen}
        mode={authDialogMode}
        onModeChange={setAuthDialogMode}
      />

      {/* Settings Dialog */}
      {isAuthenticated && user && profile && (
        <SettingsDialog
          isOpen={isSettingsDialogOpen}
          onOpenChange={setIsSettingsDialogOpen}
          userId={user.id}
          initialProfile={profile}
        />
      )}
    </div>
  );
}

// Helper component for slow rotation
function SceneRotator({ controlsRef, enabled }: { controlsRef: React.RefObject<any>, enabled: boolean }) {
  const [isPaused, setIsPaused] = useState(false);

  // Add keyboard event listener for space key
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault(); // Prevent page scroll
        setIsPaused(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  useFrame((state, delta) => {
    if (!enabled || isPaused || !controlsRef.current || !controlsRef.current.getAzimuthalAngle) return;

    // Check if user is manually interacting
    const isInteracting = controlsRef.current?.domElement?.style.cursor === 'grabbing' || controlsRef.current?.domElement?.style.cursor === 'move';

    if (!isInteracting) {
      // Slowly rotate the camera horizontally
      controlsRef.current.setAzimuthalAngle(controlsRef.current.getAzimuthalAngle() + delta * 0.05);
      controlsRef.current.update();
    }
  });

  return null;
}

// CameraController is now imported from '@/components/CameraController'