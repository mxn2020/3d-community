// scripts/list-all-plots.js
// A script to list all plots from the active map with their positions

async function listAllPlots() {
  try {
    // First get the active community map to get all plot data
    const communityMapResponse = await fetch('http://localhost:3000/api/community/active-map');
    const mapData = await communityMapResponse.json();
    
    if (!mapData.mapData || !mapData.mapData.items) {
      console.error('No map data found or invalid format');
      return;
    }
    
    // Filter for plot items only
    const plotItems = mapData.mapData.items.filter(item => 
      item.type && item.type.startsWith('plot-')
    );
    
    console.log(`Found ${plotItems.length} plots in the active map`);
    
    // Now get all sold plots from the plots table
    const soldPlotsResponse = await fetch('http://localhost:3000/api/plots');
    const soldPlotsData = await soldPlotsResponse.json();
    
    const soldPlotIds = new Set();
    if (soldPlotsData && Array.isArray(soldPlotsData)) {
      soldPlotsData.forEach(plot => {
        if (plot.ownerId) soldPlotIds.add(plot.id);
      });
    }
    
    console.log(`Found ${soldPlotIds.size} sold plots in the database`);
    
    // Group plots by positions to find clusters
    const plotsByPosition = {};
    
    // Print a sample of plots with their coordinates
    console.log('\n----- Sample Plots -----');
    
    plotItems.slice(0, 20).forEach((plot, i) => {
      const isSold = soldPlotIds.has(plot.id);
      console.log(`[${i}] ID: ${plot.id} ${isSold ? '(SOLD)' : ''}`);
      console.log(`    Type: ${plot.type}`);
      console.log(`    Position: (${plot.x}, ${plot.y || 0})`);
      console.log(`    Size: ${plot.width || 1} x ${plot.height || 1}`);
      
      // Group by position for analysis
      const posKey = `${Math.floor(plot.x)},${Math.floor(plot.y || 0)}`;
      if (!plotsByPosition[posKey]) plotsByPosition[posKey] = [];
      plotsByPosition[posKey].push(plot.id);
    });
    
    // Find plots that are likely adjacent (similar coordinates)
    console.log('\n----- Potential Adjacent Plots -----');
    
    // Choose a plot from our sample that isn't sold
    const samplePlots = plotItems.filter(p => !soldPlotIds.has(p.id)).slice(0, 3);
    
    for (const plot of samplePlots) {
      console.log(`\nTest plot ID: ${plot.id}`);
      console.log(`Position: (${plot.x}, ${plot.y || 0})`);
      console.log(`Size: ${plot.width || 1} x ${plot.height || 1}`);
      
      // Find other plots within a reasonable distance
      const nearbyPlots = plotItems.filter(other => {
        if (other.id === plot.id) return false;
        if (soldPlotIds.has(other.id)) return false;
        
        // Calculate distance
        const distance = Math.abs(plot.x - other.x) + Math.abs((plot.y || 0) - (other.y || 0));
        return distance < 30; // Adjust this threshold as needed
      });
      
      console.log(`Found ${nearbyPlots.length} potential adjacent plots`);
      
      // List a few
      nearbyPlots.slice(0, 3).forEach((nearby, i) => {
        console.log(`  [${i}] ID: ${nearby.id}`);
        console.log(`      Position: (${nearby.x}, ${nearby.y || 0})`);
        console.log(`      Distance: ${Math.abs(plot.x - nearby.x) + Math.abs((plot.y || 0) - (nearby.y || 0))}`);
      });
      
      // Suggest this plot for testing adjacent plots API
      console.log(`\nSuggested test command: node scripts/test-adjacent-plots.js ${plot.id}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

listAllPlots();
