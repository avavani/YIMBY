//create a function to load spots_data

//here we use async function as it is better suited for calling data
//and allows us to use await

async function loadSpotsData(lat, lon, bufferMeters = 750) { 
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

    const spotsCollection = await response.json();
    console.log('Received spots data:', spotsCollection);
    console.log('Number of features:', spotsCollection.features?.length || 0);

    return { spots: spotsCollection };
  } catch (error) {
    console.error('Error loading spots:', error);
    return { spots: { type: "FeatureCollection", features: [] } };
  }
}

export { loadSpotsData };