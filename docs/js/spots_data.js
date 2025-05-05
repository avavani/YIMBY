//create a function to load spots_data

//here we use async function as it is better suited for calling data
//and allows us to use await

async function loadSpotsData(lat, lon, bufferMeters = 250) { 
  try {
    const response = await fetch('https://fastapi-yimby-1009398918719.us-east1.run.app', {
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