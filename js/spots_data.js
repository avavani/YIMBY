//create a function to load spots_data

//here we use async function as it is better suited for calling data
//and allows us to use await


async function loadSpotsData(lat, lon, bufferMeters = 750, yearStart = null, yearEnd = null) { 
  try {
    const response = await fetch('http://localhost:8000/api/spots-in-buffer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        lat, 
        lon, 
        buffer_meters: bufferMeters,
        year_start: yearStart ? parseInt(yearStart) : null,
        year_end: yearEnd ? parseInt(yearEnd) : null
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

async function loadSpotsByRCO(rcoName, yearStart = null, yearEnd = null) {
  try {
    const response = await fetch('http://localhost:8000/api/spots-by-rco', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        rco_name: rcoName,
        year_start: yearStart ? parseInt(yearStart) : null,
        year_end: yearEnd ? parseInt(yearEnd) : null
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch spots data: ${response.status}`);
    }

    const spotsCollection = await response.json();
    console.log('Received RCO spots data:', spotsCollection);
    console.log('Number of features:', spotsCollection.features?.length || 0);

    return { spots: spotsCollection };
  } catch (error) {
    console.error('Error loading RCO spots:', error);
    return { spots: { type: "FeatureCollection", features: [] } };
  }
}

async function loadSpotsByDistrict(district, yearStart = null, yearEnd = null) {
  try {
    const response = await fetch('http://localhost:8000/api/spots-by-district', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        district: district,
        year_start: yearStart ? parseInt(yearStart) : null,
        year_end: yearEnd ? parseInt(yearEnd) : null
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch spots data: ${response.status}`);
    }

    const spotsCollection = await response.json();
    console.log('Received district spots data:', spotsCollection);
    console.log('Number of features:', spotsCollection.features?.length || 0);

    return { spots: spotsCollection };
  } catch (error) {
    console.error('Error loading district spots:', error);
    return { spots: { type: "FeatureCollection", features: [] } };
  }
}

export { loadSpotsData, loadSpotsByRCO, loadSpotsByDistrict };