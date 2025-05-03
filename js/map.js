//create function initmap that calls in map
function initMap(el) {
  console.log('Initializing map...');

  // Ensure the map container fills the viewport
  el.style.height = '100vh';
  el.style.width = '100%';

  const map = L.map(el, { 
    preferCanvas: true, 
    zoomSnap: 0,
    zoomControl: true
  });

  const Mapboxkey = 'pk.eyJ1IjoiYWF2YW5pMTAzIiwiYSI6ImNtMTgxOGkyZzBvYnQyam16bXFydTUwM3QifQ.hXw8FwWysnOw3It_Sms3UQ';
  const Mapboxstyle = 'mapbox/light-v11';
  L.tileLayer(
    `https://api.mapbox.com/styles/v1/${Mapboxstyle}/tiles/512/{z}/{x}/{y}{r}?access_token=${Mapboxkey}`,
    { maxZoom: 19, 
      // zoomOffset: -1,
     },
  ).addTo(map);

  map.setView([39.953316807397144, -75.13516854006843], 14);
  
  // Create a layer group to manage the buffer
  const bufferLayer = L.layerGroup().addTo(map);

  // Create a layer group to manage the spots
  const spotsLayer = L.layerGroup().addTo(map);
  
  // Function to display buffer
  function showBuffer(buffer) {
    bufferLayer.clearLayers();
    
    if (!buffer) {
      console.warn('No buffer data provided');
      return;
    }

    try {
      const bufferGeoJSON = L.geoJSON(buffer, {
        style: {
          fillColor: '#3388ff',
          fillOpacity: 0.2,
          color: '#3388ff',
          weight: 2
        }
      }).addTo(bufferLayer);

      // Only fit bounds if we have valid geometry
      if (bufferGeoJSON.getBounds().isValid()) {
        map.fitBounds(bufferGeoJSON.getBounds(), { padding: [50, 50] });
      }
    } catch (error) {
      console.error('Error displaying buffer:', error);
    }
  }
  
  // Function to display spots
  function addSpots(spotsData) {
    spotsLayer.clearLayers();
    
    if (!spotsData?.features?.length) {
      console.warn('No valid spots data to display');
      return;
    }

    try {
      const spotsGeoJSON = L.geoJSON(spotsData, {
        style: {
          fillColor: "#ff7800",
          color: "#000",
          weight: 1,
          opacity: 1,
          fillOpacity: 0.6
        },
        onEachFeature: (feature, layer) => {
          if (feature.properties) {
            let popupContent = "<div class='spot-popup'>";
            for (const [key, value] of Object.entries(feature.properties)) {
              if (value != null) {
                popupContent += `<strong>${key}:</strong> ${value}<br>`;
              }
            }
            popupContent += "</div>";
            layer.bindPopup(popupContent);
          }
        }
      }).addTo(spotsLayer);

      // Only fit bounds if we have valid geometry
      if (spotsGeoJSON.getBounds().isValid()) {
        map.fitBounds(spotsGeoJSON.getBounds(), { padding: [50, 50] });
      }
    } catch (error) {
      console.error('Error displaying spots:', error);
    }
  }

  // Add map controls
  L.control.scale().addTo(map);
  
  return {
    map,
    showBuffer,
    addSpots
  };
}

export { initMap };