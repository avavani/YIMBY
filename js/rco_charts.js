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

// Cloud Storage URLs - replace with your actual bucket and file paths
const RCO_ANALYSIS_URL = '../data/rco_analysis.json';
const RCO_IMPACT_URL = '../data/rco_impact.json';

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
  if (Array.isArray(nestedJson)) {
    console.log('Input is already an array, no conversion needed');
    return nestedJson;
  }

  const resultArray = [];
  const dataKeys = Object.keys(nestedJson);
  
  if (dataKeys.length === 0) {
    console.error('Invalid input: Empty object');
    return [];
  }
  
  const firstKey = dataKeys[0];
  const indices = Object.keys(nestedJson[firstKey]);
  
  indices.forEach(index => {
    const obj = {};
    dataKeys.forEach(key => {
      if (nestedJson[key] && nestedJson[key][index] !== undefined) {
        obj[key] = nestedJson[key][index];
      }
    });
    resultArray.push(obj);
  });
  
  return resultArray;
}

/**
 * Load and parse JSON data using fetch from Cloud Storage
 * @returns {Promise<Object>} - The parsed RCO analysis and impact data
 */
async function loadRcoData() {
  if (isDataLoading) return;
  if (rcoAnalysisData && rcoImpactData) {
    return { rcoAnalysisData, rcoImpactData };
  }

  isDataLoading = true;
  console.log('Loading RCO data from Cloud Storage...');
  
  try {
    console.log('Fetching data from Cloud Storage URLs:', RCO_ANALYSIS_URL, RCO_IMPACT_URL);
    
    const analysisResponse = await fetch(RCO_ANALYSIS_URL);
    if (!analysisResponse.ok) {
      throw new Error(`HTTP error! status: ${analysisResponse.status}`);
    }
    
    const impactResponse = await fetch(RCO_IMPACT_URL);
    if (!impactResponse.ok) {
      throw new Error(`HTTP error! status: ${impactResponse.status}`);
    }
    
    const analysisNestedData = await analysisResponse.json();
    const impactNestedData = await impactResponse.json();
    
    try {
      rcoAnalysisData = convertNestedJsonToArray(analysisNestedData);
      rcoImpactData = convertNestedJsonToArray(impactNestedData);
      console.log('RCO Analysis Data loaded:', rcoAnalysisData.length, 'records');
      console.log('RCO Impact Data loaded:', rcoImpactData.length, 'records');
    } catch (conversionError) {
      console.error('Error converting JSON format:', conversionError);
      window.dispatchEvent(new CustomEvent('json-conversion-error', {
        detail: { error: conversionError }
      }));
      rcoAnalysisData = [];
      rcoImpactData = [];
    }
    
    isDataLoading = false;
    return { rcoAnalysisData, rcoImpactData };
  } catch (error) {
    console.error('Error loading RCO data from Cloud Storage:', error);
    isDataLoading = false;
    rcoAnalysisData = [];
    rcoImpactData = [];
    return { rcoAnalysisData, rcoImpactData };
  }
}

function createRcoCharts(features) {
  if (!features || !features.length) {
    hideRcoChartSections();
    return;
  }

  console.log("Creating RCO charts with features:", features.length);
  if (features.length > 0) {
    console.log("Sample feature properties:", features[0].properties);
  }

  const rcoPropertyNames = ['RCO'];
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

  if (uniqueRcos.length === 0 && features.length > 0 && features[0].properties) {
    console.log("Searching for RCO-like properties in the first feature");
    const firstFeatureProps = features[0].properties;
    const possibleRcoProps = Object.keys(firstFeatureProps).filter(
      key => key.toLowerCase().includes('rco') || 
             (firstFeatureProps[key] && typeof firstFeatureProps[key] === 'string' && firstFeatureProps[key].toLowerCase().includes('rco'))
    );
    
    console.log("Possible RCO properties:", possibleRcoProps);
    
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

function findKeyInObject(obj, possibleKeys) {
  if (!obj) return null;
  
  for (const key of possibleKeys) {
    if (key in obj) {
      return key;
    }
  }
  
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

function renderRcoAnalysisChart(uniqueRcos, analysisData) {
  const rcoChartEl = document.querySelector("#rco-analysis-chart");
  if (!rcoChartEl) {
    console.log("RCO chart element not found");
    return;
  }

  rcoChartEl.innerHTML = '';
  const rcoKey = findKeyInObject(analysisData[0], ['RCO']);
  const varianceKey = findKeyInObject(analysisData[0], ['variance_ratio']);

  if (!rcoKey || !varianceKey) {
    console.error('Could not find RCO or variance_ratio properties in data');
    return;
  }

  const matchingRcoData = analysisData.filter(item => uniqueRcos.includes(item[rcoKey]));
  let comparisonRcos = [];

  if (matchingRcoData.length < 5) {
    comparisonRcos = analysisData
      .filter(item => !uniqueRcos.includes(item[rcoKey]))
      .sort((a, b) => b[varianceKey] - a[varianceKey])
      .slice(0, 5 - matchingRcoData.length);
  }

  const chartData = [...matchingRcoData, ...comparisonRcos].sort((a, b) => b[varianceKey] - a[varianceKey]);
  if (chartData.length === 0) {
    console.log("No chart data available");
    return;
  }

  const categories = chartData.map(item => item[rcoKey]);
  const varianceRatios = chartData.map(item => item[varianceKey]);
  const colors = chartData.map(item => uniqueRcos.includes(item[rcoKey]) ? colorPalette.pink : colorPalette.blue);

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
        dataLabels: { position: 'top' },
        distributed: true
      }
    },
    colors: colors,
    dataLabels: {
      enabled: true,
      formatter: val => val.toFixed(2),
      offsetX: 5,
      style: {
        fontSize: '12px',
        colors: ["#304758"]
      }
    },
    xaxis: {
      categories: categories,
      title: { text: 'Variance Ratio' }
    },
    title: {
      text: 'Is your RCO easy to build in?',
      style: {
        fontSize: '16px',
        fontWeight: 'normal',
        color: colorPalette.purple
      }
    },
    tooltip: {
      y: { formatter: val => val.toFixed(2) }
    },
    legend: {
      show: true,
      showForSingleSeries: true,
      customLegendItems: ['Area RCO', 'Other RCOs'],
      markers: {
        fillColors: [colorPalette.pink, colorPalette.blue],
        radius: 6
      },
      position: 'top'
    }
  };

  rcoAnalysisChart = new ApexCharts(rcoChartEl, chartOptions);
  rcoAnalysisChart.render();

  const rcoAnalysisContainer = document.getElementById('rco-analysis-container');
  if (rcoAnalysisContainer) {
    rcoAnalysisContainer.style.display = 'block';
  }
}

function renderRcoImpactChart(uniqueRcos, impactData) {
  const rcoImpactChartEl = document.querySelector("#rco-impact-chart");
  if (!rcoImpactChartEl) {
    console.log("RCO impact chart element not found");
    return;
  }

  rcoImpactChartEl.innerHTML = '';
  const rcoKey = findKeyInObject(impactData[0], ['rco', 'RCO', 'Rco', 'registered_community_organization']);
  const impactKey = findKeyInObject(impactData[0], ['impact_score', 'impactScore', 'impact', 'score']);

  if (!rcoKey || !impactKey) {
    console.error('Could not find RCO or impact_score properties in data');
    return;
  }

  const matchingRcoData = impactData.filter(item => uniqueRcos.includes(item[rcoKey]));
  let comparisonRcos = [];

  if (matchingRcoData.length < 5) {
    comparisonRcos = impactData
      .filter(item => !uniqueRcos.includes(item[rcoKey]))
      .sort((a, b) => b[impactKey] - a[impactKey])
      .slice(0, 5 - matchingRcoData.length);
  }

  const chartData = [...matchingRcoData, ...comparisonRcos].sort((a, b) => b[impactKey] - a[impactKey]);
  if (chartData.length === 0) {
    console.log("No impact chart data available");
    return;
  }

  const categories = chartData.map(item => item[rcoKey]);
  const impactScores = chartData.map(item => item[impactKey]);
  const colors = chartData.map(item => uniqueRcos.includes(item[rcoKey]) ? colorPalette.purple : colorPalette.lightBlue);

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
        dataLabels: { position: 'top' },
        distributed: true
      }
    },
    colors: colors,
    dataLabels: {
      enabled: true,
      formatter: val => val.toFixed(1),
      offsetX: 5,
      style: {
        fontSize: '12px',
        colors: ["#304758"]
      }
    },
    xaxis: {
      categories: categories,
      title: { text: 'Impact Score' }
    },
    title: {
      text: 'How does your RCO compare?',
      style: {
        fontSize: '16px',
        fontWeight: 'normal',
        color: colorPalette.darkBlue
      }
    },
    tooltip: {
      y: { formatter: val => val.toFixed(1) }
    },
    legend: {
      show: true,
      showForSingleSeries: true,
      customLegendItems: ['Area RCO', 'Similar RCO'],
      markers: {
        fillColors: [colorPalette.purple, colorPalette.lightBlue],
        radius: 6
      },
      position: 'top'
    }
  };

  rcoImpactChart = new ApexCharts(rcoImpactChartEl, chartOptions);
  rcoImpactChart.render();

  const rcoImpactContainer = document.getElementById('rco-impact-container');
  if (rcoImpactContainer) {
    rcoImpactContainer.style.display = 'block';
  }
}

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
  convertNestedJsonToArray
};
