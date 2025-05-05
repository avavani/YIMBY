// Import function to set map layers in charts.js for interaction
import { setMapLayers, highlightSpotsByYear, highlightSpotsByZoning } from './charts.js';

// Create variable to store spots layer reference
let globalSpotsLayer = null;
let globalOriginalFeatures = [];

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
     },
  ).addTo(map);

  map.setView([39.9526, -75.1652], 14);
  
  // Create a layer group to manage the buffer
  const bufferLayer = L.layerGroup().addTo(map);

  // Create a layer group to manage the spots
  const spotsLayer = L.layerGroup().addTo(map);
  globalSpotsLayer = spotsLayer;  // Store reference globally

  // Store original features for filtering
  let originalFeatures = [];
  
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
          fillColor: '#4cc9f0',
          fillOpacity: 0.2,
          color: '#4361ee',
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
  
  // Function to create circular marker styles
  const createCircleMarker = (feature, latlng, highlighted = false) => {
    const markerColor = highlighted ? '#f72585' : '#7209b7';
    const markerRadius = highlighted ? 8 : 6;
    
    return L.circleMarker(latlng, {
      radius: markerRadius,
      fillColor: markerColor,
      color: '#3a0ca3',
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8
    });
  };

  // Function to format popup content with only specific fields
  const formatPopupContent = (properties) => {
    if (!properties) return "";
    
    // Extract only the requested fields
    const fieldsToShow = {
      'Construction Year': properties.cons_complete || 'N/A',
      'RCO': properties.RCO || 'N/A',
      'Market Value': properties.market_value ? `$${Number(properties.market_value).toLocaleString()}` : 'N/A',
      'Sale Price': properties.sale_price ? `$${Number(properties.sale_price).toLocaleString()}` : 'N/A',
      'Zoning': properties.zoning || 'N/A',
      'District': properties.DISTRICT || 'N/A',
      'Type': properties.building_code_description_new || 'N/A',
    };
    
    // Format popup content with requested fields only
    let popupContent = `<div class="spot-popup">`;
    
    Object.entries(fieldsToShow).forEach(([key, value]) => {
      popupContent += `
        <div class="spot-popup-property">
          <strong>${key}:</strong>
          <span>${value}</span>
        </div>`;
    });
    
    popupContent += `</div>`;
    return popupContent;
  };

  // Function to display spots
  function addSpots(spotsData) {
    spotsLayer.clearLayers();
    
    if (!spotsData?.features?.length) {
      console.warn('No valid spots data to display');
      return;
    }

    // Store original features for filtering
    originalFeatures = spotsData.features;
    globalOriginalFeatures = spotsData.features;

    try {
      // Use pointToLayer to customize marker appearance (circles with new colors)
      const spotsGeoJSON = L.geoJSON(spotsData, {
        pointToLayer: (feature, latlng) => createCircleMarker(feature, latlng, false),
        onEachFeature: (feature, layer) => {
          if (feature.properties) {
            const popupContent = formatPopupContent(feature.properties);
            layer.bindPopup(popupContent);
            
            // Store the construction completion year for filtering
            if (feature.properties.cons_complete) {
              layer._consYear = feature.properties.cons_complete;
              layer._zoning = feature.properties.zoning;
            }
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

    // Share the spotsLayer with charts.js for interactive filtering
    setMapLayers({ spotsLayer });
  }

  // Listen for the highlight-spots event from charts.js
  window.addEventListener('highlight-spots', (event) => {
    const { spots, year } = event.detail;
    highlightSpotsByYear(spots, year);
  });
  
  // UPDATED: Listen for zoning-selected event from charts.js
  window.addEventListener('zoning-selected', (event) => {
    const { zoning, spots } = event.detail;
    highlightSpotsByZoning(zoning);
  });

  // Function to highlight spots by year
  function highlightSpotsByYear(filteredSpots, year) {
    // Clear existing spots
    spotsLayer.clearLayers();

    // Create a new GeoJSON object with all original features
    const allGeoJson = {
      type: "FeatureCollection",
      features: originalFeatures
    };

    try {
      // Add all spots but with different styling based on if they match the year
      L.geoJSON(allGeoJson, {
        pointToLayer: (feature, latlng) => {
          const isHighlighted = feature.properties.cons_complete === year || 
                               feature.properties.cons_complete === year.toString();
          return createCircleMarker(feature, latlng, isHighlighted);
        },
        onEachFeature: (feature, layer) => {
          if (feature.properties) {
            const popupContent = formatPopupContent(feature.properties);
            layer.bindPopup(popupContent);
          }
        }
      }).addTo(spotsLayer);
    } catch (error) {
      console.error('Error highlighting spots:', error);
    }
  }
  
  // Function to highlight spots by zoning
  function highlightSpotsByZoning(zoning) {
    // Clear existing spots
    spotsLayer.clearLayers();

    // Create a new GeoJSON object with all original features
    const allGeoJson = {
      type: "FeatureCollection",
      features: originalFeatures
    };

    try {
      // Add all spots but with different styling based on if they match the zoning
      L.geoJSON(allGeoJson, {
        pointToLayer: (feature, latlng) => {
          const isHighlighted = feature.properties.zoning === zoning;
          return createCircleMarker(feature, latlng, isHighlighted);
        },
        onEachFeature: (feature, layer) => {
          if (feature.properties) {
            const popupContent = formatPopupContent(feature.properties);
            layer.bindPopup(popupContent);
          }
        }
      }).addTo(spotsLayer);
    } catch (error) {
      console.error('Error highlighting spots by zoning:', error);
    }
  }

  // Listen for the reset-spots event from charts.js
  window.addEventListener('reset-spots', (event) => {
    resetSpots();
  });

  // Add map controls
  L.control.scale().addTo(map);
  
  return {
    map,
    showBuffer,
    addSpots
  };
}

// UPDATED resetSpots function
function resetSpots() {
  console.log('Reset spots function called');
  
  if (!globalSpotsLayer) {
    console.warn('Global spots layer not available');
    return;
  }
  
  if (!globalOriginalFeatures || globalOriginalFeatures.length === 0) {
    console.warn('No original features available for reset');
    return;
  }
  
  // Clear existing spots
  globalSpotsLayer.clearLayers();

  // Create a new GeoJSON object with all original features
  const allGeoJson = {
    type: "FeatureCollection",
    features: globalOriginalFeatures
  };

  try {
    console.log(`Re-adding ${globalOriginalFeatures.length} original features`);
    
    // Function to create circular marker styles (copy of the one in initMap)
    const createCircleMarker = (feature, latlng, highlighted = false) => {
      const markerColor = highlighted ? '#f72585' : '#7209b7';
      const markerRadius = highlighted ? 8 : 6;
      
      return L.circleMarker(latlng, {
        radius: markerRadius,
        fillColor: markerColor,
        color: '#3a0ca3',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
      });
    };

    // Function to format popup content (copy of the one in initMap)
    const formatPopupContent = (properties) => {
      if (!properties) return "";
      
      // Extract only the requested fields
      const fieldsToShow = {
        'Construction Year': properties.cons_complete || 'N/A',
        'RCO': properties.RCO || 'N/A',
        'Market Value': properties.market_value ? `$${Number(properties.market_value).toLocaleString()}` : 'N/A',
        'Sale Price': properties.sale_price ? `$${Number(properties.sale_price).toLocaleString()}` : 'N/A',
        'Zoning': properties.zoning || 'N/A',
        'District': properties.DISTRICT || 'N/A',
        'Type': properties.building_code_description_new || 'N/A',
      };
      
      // Format popup content with requested fields only
      let popupContent = `<div class="spot-popup">`;
      
      Object.entries(fieldsToShow).forEach(([key, value]) => {
        popupContent += `
          <div class="spot-popup-property">
            <strong>${key}:</strong>
            <span>${value}</span>
          </div>`;
      });
      
      popupContent += `</div>`;
      return popupContent;
    };
    
    // Add all spots with default styling (not highlighted)
    L.geoJSON(allGeoJson, {
      pointToLayer: (feature, latlng) => createCircleMarker(feature, latlng, false),
      onEachFeature: (feature, layer) => {
        if (feature.properties) {
          const popupContent = formatPopupContent(feature.properties);
          layer.bindPopup(popupContent);
          
          // Store the construction completion year for filtering
          if (feature.properties.cons_complete) {
            layer._consYear = feature.properties.cons_complete;
            layer._zoning = feature.properties.zoning;
          }
        }
      }
    }).addTo(globalSpotsLayer);
    
    console.log('Spots reset successfully');
  } catch (error) {
    console.error('Error resetting spots:', error);
  }
}

export { 
  initMap, 
  highlightSpotsByYear, 
  highlightSpotsByZoning,
  resetSpots, 
};