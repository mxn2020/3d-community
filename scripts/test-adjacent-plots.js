// scripts/test-adjacent-plots.js
// A script to test finding adjacent plots for a specific plot ID

// Usage: node scripts/test-adjacent-plots.js <plotId>

const plotId = process.argv[2];

if (!plotId) {
  console.error('Usage: node scripts/test-adjacent-plots.js <plotId>');
  process.exit(1);
}

async function testAdjacentPlots() {
  try {
    const response = await fetch(`http://localhost:3000/api/plots/${plotId}/adjacent`);
    const data = await response.json();
    
    console.log('----- API Response -----');
    console.log(`Plot ID: ${data.plotId}`);
    console.log(`Adjacent plots found: ${data.adjacentPlotsCount || 0}`);
    
    if (data.adjacentPlots?.length > 0) {
      console.log('\nFirst few adjacent plots:');
      data.adjacentPlots.slice(0, 5).forEach((plot, i) => {
        console.log(`\n[${i}] ID: ${plot.id}`);
        console.log(`    Position: (${plot.map_position.x}, ${plot.map_position.y})`);
        console.log(`    Size: ${plot.width || 1} x ${plot.height || 1}`);
      });
    } else {
      console.log('\nNo adjacent plots found!');
    }
    
    if (data.error) {
      console.error('\nAPI Error:', data.error);
    }
  } catch (error) {
    console.error('Error making API request:', error);
  }
}

console.log(`Testing adjacent plots for plot ID: ${plotId}`);
testAdjacentPlots();
