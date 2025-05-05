// RCO Chart Functionality
// This file contains all the code for the RCO comparison charts

// Import the color palette from charts.js
import { colorPalette } from './charts.js';

// Global variables to store the RCO data
let rcoAnalysisData = null;
let rcoImpactData = null;
let rcoAnalysisChart = null;
let rcoImpactChart = null;
let isDataLoading = false;

<<<<<<< HEAD:docs/js/rco_charts.js
// Cloud Storage URLs - replace with your actual bucket and file paths
const CLOUD_STORAGE_BUCKET = 'practicumdata';
const RCO_ANALYSIS_URL = `https://storage.googleapis.com/${CLOUD_STORAGE_BUCKET}/rco_analysis.json`;
const RCO_IMPACT_URL = `https://storage.googleapis.com/${CLOUD_STORAGE_BUCKET}/rco_impact.json`;

=======
>>>>>>> parent of ff6b400c (big stuff befor ehosting):js/rco_charts.js
/**
 * Initialize the RCO charts module - preload data
 */
function initRcoCharts() {
  console.log('Initializing RCO Charts module');
  
  // Load data after a slight delay to ensure everything is ready
  if (document.readyState === 'complete') {
    setTimeout(loadRcoData, 500);
  } else {
    window.addEventListener('load', function() {
      setTimeout(loadRcoData, 500);
    });
  }
  
  // Listen for reset-rco-titles event from other charts
  window.addEventListener('reset-rco-titles', () => {
    // Reset RCO chart titles if they exist
    if (rcoAnalysisChart) {
      rcoAnalysisChart.updateOptions({
        title: {
          text: 'RCO Variance Ratio Comparison',
          style: {
            fontSize: '16px',
            fontWeight: 'normal',
            color: colorPalette.purple
          }
        }
      });
    }
    
    if (rcoImpactChart) {
      rcoImpactChart.updateOptions({
        title: {
          text: 'RCO Impact Score Comparison',
          style: {
            fontSize: '16px',
            fontWeight: 'normal',
            color: colorPalette.darkBlue
          }
        }
      });
    }
  });
}

/**
 * Convert nested JSON format to array of objects
 * This is the key function for handling the nested JSON format
 * @param {Object} nestedJson - The nested JSON data
 * @returns {Array} - Array of objects
 */
function convertNestedJsonToArray(nestedJson) {
  // First, check if the input is already in the expected format
  if (Array.isArray(nestedJson)) {
    console.log('Input is already an array, no conversion needed');
    return nestedJson;
  }
  
  // Initialize an empty array to store the converted data
  const resultArray = [];
  
  // Get all the keys from the nested JSON (like "RCO", "impact_score", etc.)
  const dataKeys = Object.keys(nestedJson);
  
  if (dataKeys.length === 0) {
    console.error('Invalid input: Empty object');
    return [];
  }
  
  // Get the indices from the first property (assuming all properties have the same indices)
  const firstKey = dataKeys[0];
  const indices = Object.keys(nestedJson[firstKey]);
  
  // For each index, create an object with all properties
  indices.forEach(index => {
    const obj = {};
    
    // For each property, get the value at the current index
    dataKeys.forEach(key => {
      // Only add the property if it exists for this index
      if (nestedJson[key] && nestedJson[key][index] !== undefined) {
        obj[key] = nestedJson[key][index];
      }
    });
    
    // Add the object to the result array
    resultArray.push(obj);
  });
  
  return resultArray;
}

/**
 * Load and parse JSON data using fetch
 * @returns {Promise<Object>} - The parsed RCO analysis and impact data
 */
async function loadRcoData() {
  // If data is already loading, don't start another load
  if (isDataLoading) return;
  
  // If data is already loaded, return it
  if (rcoAnalysisData && rcoImpactData) {
    return { rcoAnalysisData, rcoImpactData };
  }

  isDataLoading = true;
  console.log('Loading RCO data files...');
  
  try {
    // Load JSON data files using fetch
    console.log('Using fetch API to load JSON data');
    
    // Fetch the analysis data
    const analysisResponse = await fetch('../data/rco_analysis.json');
    if (!analysisResponse.ok) {
      throw new Error(`HTTP error! status: ${analysisResponse.status}`);
    }
    
    // Fetch the impact data
    const impactResponse = await fetch('../data/rco_impact.json');
    if (!impactResponse.ok) {
      throw new Error(`HTTP error! status: ${impactResponse.status}`);
    }
    
    // Parse JSON data
    const analysisNestedData = await analysisResponse.json();
    const impactNestedData = await impactResponse.json();
    
    try {
      // Convert nested JSON to array of objects
      rcoAnalysisData = convertNestedJsonToArray(analysisNestedData);
      rcoImpactData = convertNestedJsonToArray(impactNestedData);
      
      console.log('RCO Analysis Data loaded:', rcoAnalysisData.length, 'records');
      console.log('RCO Impact Data loaded:', rcoImpactData.length, 'records');
    } catch (conversionError) {
      console.error('Error converting JSON format:', conversionError);
      
      // Dispatch an event for the conversion error
      window.dispatchEvent(new CustomEvent('json-conversion-error', {
        detail: { error: conversionError }
      }));
      
      // Set empty arrays as fallback
      rcoAnalysisData = [];
      rcoImpactData = [];
    }
    
    isDataLoading = false;
    return { rcoAnalysisData, rcoImpactData };
  } catch (error) {
    console.error('Error loading RCO data:', error);
    isDataLoading = false;
    
    // Reset data to empty arrays on error
    rcoAnalysisData = [];
    rcoImpactData = [];
    
    return { rcoAnalysisData, rcoImpactData };
  }
}

/**
 * Create the RCO comparison charts
 * @param {Array} features - The GeoJSON features
 */
function createRcoCharts(features) {
  if (!features || !features.length) {
    hideRcoChartSections();
    return;
  }
  
  console.log("Creating RCO charts with features:", features.length);
  
  // Debugging: Log some sample features to check their structure
  if (features.length > 0) {
    console.log("Sample feature properties:", features[0].properties);
  }
  
  // Try different property names for RCO
  const rcoPropertyNames = ['rco', 'RCO', 'Rco', 'registered_community_organization'];
  
  // Extract unique RCO values from the features, trying different property names
  let uniqueRcos = [];
  for (const propName of rcoPropertyNames) {
    const rcos = features
      .map(feature => feature.properties && feature.properties[propName])
      .filter(Boolean);
      
    if (rcos.length > 0) {
      console.log(`Found RCO values using property name '${propName}'`);
      uniqueRcos = [...new Set(rcos)];
      break;
    }
  }
  
  // If no RCOs found using property names, try to find any property that might contain "RCO"
  if (uniqueRcos.length === 0 && features.length > 0 && features[0].properties) {
    console.log("Searching for RCO-like properties in the first feature");
    
    const firstFeatureProps = features[0].properties;
    const possibleRcoProps = Object.keys(firstFeatureProps).filter(
      key => key.toLowerCase().includes('rco') || 
             (firstFeatureProps[key] && 
              typeof firstFeatureProps[key] === 'string' && 
              firstFeatureProps[key].toLowerCase().includes('rco'))
    );
    
    console.log("Possible RCO properties:", possibleRcoProps);
    
    // Try each possible property
    for (const propName of possibleRcoProps) {
      const rcos = features
        .map(feature => feature.properties && feature.properties[propName])
        .filter(Boolean);
        
      if (rcos.length > 0) {
        console.log(`Found potential RCO values using property '${propName}'`);
        uniqueRcos = [...new Set(rcos)];
        break;
      }
    }
  }
  
  if (uniqueRcos.length === 0) {
    console.log('No RCO values found in features. Feature count:', features.length);
    hideRcoChartSections();
    return;
  }
  
  console.log('Unique RCOs found:', uniqueRcos);
  
  // Load RCO data if not already loaded
  if (!rcoAnalysisData || !rcoImpactData) {
    loadRcoData().then(data => {
      if (data.rcoAnalysisData.length && data.rcoImpactData.length) {
        renderRcoAnalysisChart(uniqueRcos, data.rcoAnalysisData);
        renderRcoImpactChart(uniqueRcos, data.rcoImpactData);
      } else {
        hideRcoChartSections();
      }
    }).catch(error => {
      console.error('Error loading RCO data for charts:', error);
      hideRcoChartSections();
    });
  } else {
    renderRcoAnalysisChart(uniqueRcos, rcoAnalysisData);
    renderRcoImpactChart(uniqueRcos, rcoImpactData);
  }
}

/**
 * Helper function to find a key in an object from a list of possible keys
 * @param {Object} obj - The object to search
 * @param {Array} possibleKeys - Array of possible key names
 * @returns {string|null} - The found key or null
 */
function findKeyInObject(obj, possibleKeys) {
  if (!obj) return null;
  
  for (const key of possibleKeys) {
    if (key in obj) {
      return key;
    }
  }
  
  // If not found, search case-insensitively
  const objKeys = Object.keys(obj);
  for (const possible of possibleKeys) {
    const lowerPossible = possible.toLowerCase();
    for (const objKey of objKeys) {
      if (objKey.toLowerCase() === lowerPossible) {
        return objKey;
      }
    }
  }
  
  return null;
}

/**
 * Render the RCO Analysis Chart (Variance Ratio)
 * @param {Array} uniqueRcos - Array of unique RCO values
 * @param {Array} analysisData - The RCO analysis data
 */
function renderRcoAnalysisChart(uniqueRcos, analysisData) {
  const rcoChartEl = document.querySelector("#rco-analysis-chart");
  if (!rcoChartEl) {
    console.log("RCO chart element not found");
    return;
  }
  
  // Clear existing chart if any
  rcoChartEl.innerHTML = '';
  
  // Look for RCO property in the data (could be 'rco', 'RCO', etc.)
  const rcoKey = findKeyInObject(analysisData[0], ['rco', 'RCO', 'Rco', 'registered_community_organization']);
  const varianceKey = findKeyInObject(analysisData[0], ['variance_ratio', 'varianceRatio', 'variance', 'var_ratio']);
  
  if (!rcoKey || !varianceKey) {
    console.error('Could not find RCO or variance_ratio properties in data');
    return;
  }
  
  console.log(`Using ${rcoKey} and ${varianceKey} properties from data`);
  
  // Filter the analysis data to include only the RCOs found in features
  // and also include a few others for comparison
  const matchingRcoData = analysisData.filter(item => 
    uniqueRcos.includes(item[rcoKey])
  );
  
  console.log(`Found ${matchingRcoData.length} matching RCOs in the data`);
  
  // Get top 5 RCOs by variance_ratio for comparison if we don't have enough matching RCOs
  let comparisonRcos = [];
  if (matchingRcoData.length < 5) {
    comparisonRcos = analysisData
      .filter(item => !uniqueRcos.includes(item[rcoKey]))
      .sort((a, b) => b[varianceKey] - a[varianceKey])
      .slice(0, 5 - matchingRcoData.length);
  }
  
  // Combine the matching RCOs and comparison RCOs
  const chartData = [...matchingRcoData, ...comparisonRcos].sort((a, b) => b[varianceKey] - a[varianceKey]);
  
  if (chartData.length === 0) {
    console.log("No chart data available");
    return;
  }
  
  // Prepare data for ApexCharts
  const categories = chartData.map(item => item[rcoKey]);
  const varianceRatios = chartData.map(item => item[varianceKey]);
  
  // Create different colors for matching RCOs vs comparison RCOs
  const colors = chartData.map(item => 
    uniqueRcos.includes(item[rcoKey]) ? colorPalette.pink : colorPalette.blue
  );
  
  // Create the chart
  const chartOptions = {
    series: [{
      name: 'Variance Ratio',
      data: varianceRatios
    }],
    chart: {
      type: 'bar',
      height: 350,
      fontFamily: 'Work Sans, sans-serif'
    },
    plotOptions: {
      bar: {
        horizontal: true,
        dataLabels: {
          position: 'top',
        },
        distributed: true
      }
    },
    colors: colors,
    dataLabels: {
      enabled: true,
      formatter: function(val) {
        return val.toFixed(2);
      },
      offsetX: 5,
      style: {
        fontSize: '12px',
        colors: ["#304758"]
      }
    },
    xaxis: {
      categories: categories,
      title: {
        text: 'Variance Ratio'
      }
    },
    title: {
      text: 'RCO Variance Ratio Comparison',
      style: {
        fontSize: '16px',
        fontWeight: 'normal',
        color: colorPalette.purple
      }
    },
    tooltip: {
      y: {
        formatter: function(val) {
          return val.toFixed(2);
        }
      }
    },
    legend: {
      show: true,
      showForSingleSeries: true,
      customLegendItems: ['Selected RCO', 'Comparison RCO'],
      markers: {
        fillColors: [colorPalette.pink, colorPalette.blue],
        radius: 6
      },
      position: 'top'
    }
  };
  
  rcoAnalysisChart = new ApexCharts(rcoChartEl, chartOptions);
  rcoAnalysisChart.render();
  
  // Show the chart section
  const rcoAnalysisContainer = document.getElementById('rco-analysis-container');
  if (rcoAnalysisContainer) {
    rcoAnalysisContainer.style.display = 'block';
  }
}

/**
 * Render the RCO Impact Chart (Impact Score)
 * @param {Array} uniqueRcos - Array of unique RCO values
 * @param {Array} impactData - The RCO impact data
 */
function renderRcoImpactChart(uniqueRcos, impactData) {
  const rcoImpactChartEl = document.querySelector("#rco-impact-chart");
  if (!rcoImpactChartEl) {
    console.log("RCO impact chart element not found");
    return;
  }
  
  // Clear existing chart if any
  rcoImpactChartEl.innerHTML = '';
  
  // Look for RCO property in the data (could be 'rco', 'RCO', etc.)
  const rcoKey = findKeyInObject(impactData[0], ['rco', 'RCO', 'Rco', 'registered_community_organization']);
  const impactKey = findKeyInObject(impactData[0], ['impact_score', 'impactScore', 'impact', 'score']);
  
  if (!rcoKey || !impactKey) {
    console.error('Could not find RCO or impact_score properties in data');
    return;
  }
  
  console.log(`Using ${rcoKey} and ${impactKey} properties from impact data`);
  
  // Filter the impact data to include only the RCOs found in features
  // and also include a few others for comparison
  const matchingRcoData = impactData.filter(item => 
    uniqueRcos.includes(item[rcoKey])
  );
  
  console.log(`Found ${matchingRcoData.length} matching RCOs in the impact data`);
  
  // Get top 5 RCOs by impact_score for comparison if we don't have enough matching RCOs
  let comparisonRcos = [];
  if (matchingRcoData.length < 5) {
    comparisonRcos = impactData
      .filter(item => !uniqueRcos.includes(item[rcoKey]))
      .sort((a, b) => b[impactKey] - a[impactKey])
      .slice(0, 5 - matchingRcoData.length);
  }
  
  // Combine the matching RCOs and comparison RCOs
  const chartData = [...matchingRcoData, ...comparisonRcos].sort((a, b) => b[impactKey] - a[impactKey]);
  
  if (chartData.length === 0) {
    console.log("No impact chart data available");
    return;
  }
  
  // Prepare data for ApexCharts
  const categories = chartData.map(item => item[rcoKey]);
  const impactScores = chartData.map(item => item[impactKey]);
  
  // Create different colors for matching RCOs vs comparison RCOs
  const colors = chartData.map(item => 
    uniqueRcos.includes(item[rcoKey]) ? colorPalette.purple : colorPalette.lightBlue
  );
  
  // Create the chart
  const chartOptions = {
    series: [{
      name: 'Impact Score',
      data: impactScores
    }],
    chart: {
      type: 'bar',
      height: 350,
      fontFamily: 'Work Sans, sans-serif'
    },
    plotOptions: {
      bar: {
        horizontal: true,
        dataLabels: {
          position: 'top',
        },
        distributed: true
      }
    },
    colors: colors,
    dataLabels: {
      enabled: true,
      formatter: function(val) {
        return val.toFixed(1);
      },
      offsetX: 5,
      style: {
        fontSize: '12px',
        colors: ["#304758"]
      }
    },
    xaxis: {
      categories: categories,
      title: {
        text: 'Impact Score'
      }
    },
    title: {
      text: 'RCO Impact Score Comparison',
      style: {
        fontSize: '16px',
        fontWeight: 'normal',
        color: colorPalette.darkBlue
      }
    },
    tooltip: {
      y: {
        formatter: function(val) {
          return val.toFixed(1);
        }
      }
    },
    legend: {
      show: true,
      showForSingleSeries: true,
      customLegendItems: ['Selected RCO', 'Comparison RCO'],
      markers: {
        fillColors: [colorPalette.purple, colorPalette.lightBlue],
        radius: 6
      },
      position: 'top'
    }
  };
  
  rcoImpactChart = new ApexCharts(rcoImpactChartEl, chartOptions);
  rcoImpactChart.render();
  
  // Show the chart section
  const rcoImpactContainer = document.getElementById('rco-impact-container');
  if (rcoImpactContainer) {
    rcoImpactContainer.style.display = 'block';
  }
}

/**
 * Helper function to hide RCO chart sections when no data
 */
function hideRcoChartSections() {
  const sections = [
    'rco-analysis-container',
    'rco-impact-container'
  ];
  
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}

/**
 * Helper function to show RCO chart sections when data is available
 */
function showRcoChartSections() {
  const sections = [
    'rco-analysis-container',
    'rco-impact-container'
  ];
  
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'block';
  });
}

// Export the necessary functions
export {
  initRcoCharts,
  loadRcoData,
  createRcoCharts,
  hideRcoChartSections,
  showRcoChartSections,
  convertNestedJsonToArray // Export the conversion function
};