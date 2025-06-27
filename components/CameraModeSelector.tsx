// components/CameraModeSelector.tsx
import React from 'react';
import { Camera, Webcam, PlaneTakeoff, Route } from 'lucide-react';
import type { CameraMode } from './CameraModes';

interface CameraModeSelectorProps {
  currentMode: CameraMode;
  onModeChange: (mode: CameraMode) => void;
}

export function CameraModeSelector({ currentMode, onModeChange }: CameraModeSelectorProps) {
  const modes: Array<{
    id: CameraMode;
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'cinematic',
      label: 'Cinematic',
      icon: <Camera className="h-4 w-4" />
    },
    {
      id: 'person',
      label: 'Person',
      icon: <Webcam className="h-4 w-4" />
    },
    {
      id: 'helicopter',
      label: 'Helicopter',
      icon: <PlaneTakeoff className="h-4 w-4" />
    },
    {
      id: 'tour',
      label: 'Tour',
      icon: <Route className="h-4 w-4" />
    }
  ];

  return (
    <div className="camera-mode-selector p-2 rounded-lg bg-black/70 flex flex-col gap-2">
      <h3 className="text-xs font-bold text-white mb-1">Camera Mode</h3>
      <div className="flex flex-col gap-1">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${
              currentMode === mode.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
            }`}
          >
            {mode.icon}
            <span>{mode.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}