//create function initmap that calls in map
function initMap(el) {
  console.log('Initializing map...');

  const map = L.map(el, { preferCanvas: true, zoomSnap: 0 });

  const Mapboxkey = 'pk.eyJ1IjoiYWF2YW5pMTAzIiwiYSI6ImNtMTgxOGkyZzBvYnQyam16bXFydTUwM3QifQ.hXw8FwWysnOw3It_Sms3UQ';
  const Mapboxstyle = 'mapbox/dark-v11';
  L.tileLayer(
    `https://api.mapbox.com/styles/v1/${Mapboxstyle}/tiles/512/{z}/{x}/{y}{r}?access_token=${Mapboxkey}`,
    { maxZoom: 20 },
  ).addTo(map);

  map.setView([39.953316807397144, -75.13516854006843], 12);
  
  // Create a layer group to manage the buffer
  const bufferLayer = L.layerGroup().addTo(map);
  
  // Function to display buffer
  function showBuffer(buffer) {
    bufferLayer.clearLayers(); // Clear existing buffer
    
    if (buffer) {
      L.geoJSON(buffer, {
        style: {
          fillColor: '#3388ff',
          fillOpacity: 0.2,
          color: '#3388ff',
          weight: 2
        }
      }).addTo(bufferLayer);
      
      // Fit map to buffer bounds
      map.fitBounds(L.geoJSON(buffer).getBounds());
    }
  }
  
  return {
    map,
    showBuffer
  };
}

export { initMap };