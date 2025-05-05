//create a function to load spots_data

//here we use async function as it is better suited for calling data
//and allows us to use await

async function loadSpotsData(lat, lon, bufferMeters = 250) { 
  try {
    const response = await fetch('http://localhost:8000/api/spots-in-buffer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        lat, 
        lon, 
        buffer_meters: bufferMeters
      })
    }); 
    
    console.log('Response status:', response.status);

    if (!response.ok) {
      throw new Error(`Failed to fetch spots data: ${response.status}`);
    }

    const responseData = await response.json();
    console.log('Received data from API:', responseData);
    
    // Extract spots, buffer, and statistics from the new response format
    const { spots, buffer, statistics } = responseData;
    
    if (!spots) {
      console.warn('No spots data in API response');
      return { 
        spots: { type: "FeatureCollection", features: [] },
        buffer: null,
        statistics: null
      };
    }
    
    console.log('Number of features:', spots.features?.length || 0);
    console.log('Statistics received:', statistics);

    // Return all the data components
    return { 
      spots, 
      buffer, 
      statistics 
    };
  } catch (error) {
    console.error('Error loading spots:', error);
    return { 
      spots: { type: "FeatureCollection", features: [] },
      buffer: null,
      statistics: null
    };
  }
}

export { loadSpotsData };