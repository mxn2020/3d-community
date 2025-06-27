
// Create a new file: lib/plot-hover-manager.ts
export class PlotHoverManager {
  private hoveredPlotId: string | null = null;
  private subscribers = new Map<string, (isHovered: boolean) => void>();
  private lastHoverTime = 0;
  private animationFrameId: number | null = null;
  
  constructor() {
    this.processHoverQueue = this.processHoverQueue.bind(this);
  }
  
  // Register a plot to receive hover notifications
  subscribe(plotId: string, callback: (isHovered: boolean) => void): () => void {
    this.subscribers.set(plotId, callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(plotId);
    };
  }
  
  // Check if a specific plot is currently hovered
  isHovered(plotId: string): boolean {
    return this.hoveredPlotId === plotId;
  }
  
  // Handle hover state changes
  setHoveredPlot(plotId: string | null): void {
    // Skip if same plot to avoid unnecessary updates
    if (plotId === this.hoveredPlotId) return;
    
    // Cancel any pending animation frame
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    const now = performance.now();
    if (now - this.lastHoverTime < 30) { // Reduced from 50ms to 30ms
      // If we're changing too quickly, use requestAnimationFrame for better performance
      this.animationFrameId = requestAnimationFrame(() => {
        this.updateHoveredPlot(plotId);
        this.lastHoverTime = performance.now();
        this.animationFrameId = null;
      });
    } else {
      // Immediate update if enough time has passed
      this.updateHoveredPlot(plotId);
      this.lastHoverTime = now;
    }
  }
  
  private updateHoveredPlot(plotId: string | null): void {
    // Notify the previously hovered plot it's no longer hovered
    if (this.hoveredPlotId && this.subscribers.has(this.hoveredPlotId)) {
      const callback = this.subscribers.get(this.hoveredPlotId);
      if (callback) callback(false);
    }
    
    // Update the hovered plot ID
    this.hoveredPlotId = plotId;
    
    // Notify the newly hovered plot
    if (plotId && this.subscribers.has(plotId)) {
      const callback = this.subscribers.get(plotId);
      if (callback) callback(true);
    }
  }
  
  private processHoverQueue(): void {
    // Implementation for batched hover processing if needed
  }
  
  // Clean up resources
  cleanup(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.subscribers.clear();
  }
}