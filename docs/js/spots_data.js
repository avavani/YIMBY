async function loadSpotsData(lat, lon, bufferMeters = 250) {
  const isLocalhost = window.location.hostname === "localhost";
  const BASE_API_URL = isLocalhost
    ? "http://localhost:8000"
    : "https://yimby-ekc4.onrender.com";

  try {
    const response = await fetch(`${BASE_API_URL}/api/spots-in-buffer`, {
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
