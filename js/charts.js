// Global variable to store features for interactive filtering
let allFeatures = [];
let currentYear = null;
let currentZoning = null;
let selectedYearSpots = [];
let spotsLayer = null;

// Store chart instances globally
let unitsByYearChart = null;
let zoningChart = null;

// New color palette - exported for use in rco_charts.js
export const colorPalette = {
  pink: '#f72585',
  purple: '#7209b7',
  darkBlue: '#3a0ca3',
  blue: '#4361ee',
  lightBlue: '#4cc9f0'
};

// This function prepares data for the charts
function prepareChartData(features) {
  if (!features || !features.length) {
    return null;
  }

  // Note: The message update has been moved to main.js
  // Store features globally for interaction
  allFeatures = features;

  // Initialize data structures
  const yearlyData = {};
  const zoningData = {};
  const marketValueData = [];
  const salePriceData = [];
  
  // Process each feature
  features.forEach(feature => {
    const props = feature.properties;
    
    // Extract yearly data
    for (let year = 2015; year <= 2023; year++) {
      if (!yearlyData[year]) {
        yearlyData[year] = {
          incomes: [],
          homeValues: [],
          count: 0
        };
      }
      
      const income = props[`med_income_${year}`];
      const homeValue = props[`med_home_value_${year}`];
      
      if (income !== null && income !== undefined) {
        yearlyData[year].incomes.push(income);
      }
      if (homeValue !== null && homeValue !== undefined) {
        yearlyData[year].homeValues.push(homeValue);
      }

      // Count by construction completion year
      if (props.cons_complete === year.toString() || props.cons_complete === year) {
        yearlyData[year].count++;
      }
    }
    
    // Extract zoning data for pie chart
    if (props.zoning) {
      if (!zoningData[props.zoning]) {
        zoningData[props.zoning] = 0;
      }
      zoningData[props.zoning]++;
    }

    // Extract market value and sale price data
    if (props.market_value !== null && props.market_value !== undefined) {
      marketValueData.push(parseFloat(props.market_value));
    }
    
    if (props.sale_price !== null && props.sale_price !== undefined) {
      salePriceData.push(parseFloat(props.sale_price));
    }
  });
  
  // Calculate averages
  const chartData = {
    years: [],
    avgIncome: [],
    avgHomeValue: [],
    countByYear: [],
    zoningLabels: [],
    zoningValues: [],
    avgMarketValue: calculateAverage(marketValueData),
    avgSalePrice: calculateAverage(salePriceData)
  };
  
  Object.keys(yearlyData).sort().forEach(year => {
    chartData.years.push(year);
    
    // Average income
    const incomes = yearlyData[year].incomes;
    chartData.avgIncome.push(
      incomes.length ? incomes.reduce((a, b) => a + b, 0) / incomes.length : null
    );
    
    // Average home value
    const homeValues = yearlyData[year].homeValues;
    chartData.avgHomeValue.push(
      homeValues.length ? homeValues.reduce((a, b) => a + b, 0) / homeValues.length : null
    );

    // Count of properties by year
    chartData.countByYear.push(yearlyData[year].count);
  });
  
  // Calculate average impact score using the consistent helper function
  const impactScores = features.map(f => f.properties.impact_score).filter(score => score !== null);
  chartData.avgImpactScore = calculateAverage(impactScores);
  
  // Prepare zoning data for pie chart
  Object.keys(zoningData).forEach(zoning => {
    chartData.zoningLabels.push(zoning);
    chartData.zoningValues.push(zoningData[zoning]);
  });
  
  return chartData;
}

// Helper function to calculate average
function calculateAverage(data) {
  if (!data || data.length === 0) return null;
  return data.reduce((a, b) => a + b, 0) / data.length;
}

// This function creates the charts
function createCharts(features, statistics = null) {
  if (!features || !features.length) {
    // No message update here - handled in main.js
    hideChartSections();
    return;
  }
  
  // Store features globally for interaction
  allFeatures = features;
  
  // Use provided statistics or prepare chart data from features
  const chartData = statistics || prepareChartData(features);
  
  if (!chartData) {
    hideChartSections();
    return;
  }
  
  // Update Impact Score
  const impactScoreEl = document.getElementById('impact-score-value');
  if (impactScoreEl) {
    impactScoreEl.textContent = chartData.avgImpactScore !== null 
      ? (chartData.avgImpactScore).toFixed(1) 
      : 'N/A';
  }
  
  // Update Market Value and Sale Price
  const marketValueEl = document.getElementById('avg-market-value');
  const salePriceEl = document.getElementById('avg-sale-price');
  
  if (marketValueEl) {
    marketValueEl.textContent = chartData.avgMarketValue !== null 
      ? `$${chartData.avgMarketValue.toLocaleString(undefined, {maximumFractionDigits: 0})}` 
      : 'N/A';
  }
  
  if (salePriceEl) {
    salePriceEl.textContent = chartData.avgSalePrice !== null 
      ? `$${chartData.avgSalePrice.toLocaleString(undefined, {maximumFractionDigits: 0})}` 
      : 'N/A';
  }
  
  // Income chart - Minimized text
  const incomeOptions = {
    series: [{
      name: 'Median Income',
      data: chartData.avgIncome
    }],
    chart: {
      type: 'line',
      height: 300,
      fontFamily: 'Work Sans, sans-serif'
    },
    xaxis: {
      categories: chartData.years,
      labels: {
        style: {
          fontSize: '12px'
        }
      }
    },
    yaxis: {
      labels: {
        formatter: function(val) {
          return val ? `$${Math.round(val / 1000)}k` : '';
        },
        style: {
          fontSize: '12px'
        }
      }
    },
    stroke: {
      curve: 'smooth'
    },
    colors: [colorPalette.blue],
    markers: {
      size: 4
    },
    tooltip: {
      y: {
        formatter: function(val) {
          return val ? `$${val.toLocaleString()}` : 'N/A';
        }
      }
    }
  };
  
  const incomeChartEl = document.querySelector("#income-chart");
  if (incomeChartEl) {
    // Clear existing chart if any
    incomeChartEl.innerHTML = '';
    const incomeChart = new ApexCharts(incomeChartEl, incomeOptions);
    incomeChart.render();
  }
  
  // Home value chart - Minimized text
  const homeValueOptions = {
    series: [{
      name: 'Median Home Value',
      data: chartData.avgHomeValue
    }],
    chart: {
      type: 'line',
      height: 300,
      fontFamily: 'Work Sans, sans-serif'
    },
    xaxis: {
      categories: chartData.years,
      labels: {
        style: {
          fontSize: '12px'
        }
      }
    },
    yaxis: {
      labels: {
        formatter: function(val) {
          return val ? `$${Math.round(val / 1000)}k` : '';
        },
        style: {
          fontSize: '12px'
        }
      }
    },
    stroke: {
      curve: 'smooth'
    },
    colors: [colorPalette.lightBlue],
    markers: {
      size: 4
    },
    tooltip: {
      y: {
        formatter: function(val) {
          return val ? `$${val.toLocaleString()}` : 'N/A';
        }
      }
    }
  };
  
  const homeValueChartEl = document.querySelector("#home-value-chart");
  if (homeValueChartEl) {
    // Clear existing chart if any
    homeValueChartEl.innerHTML = '';
    const homeValueChart = new ApexCharts(homeValueChartEl, homeValueOptions);
    homeValueChart.render();
  }
  
  // Units by construction year chart (interactive) - Minimized text
  const unitsByYearOptions = {
    series: [{
      name: 'Units Completed',
      data: chartData.countByYear
    }],
    chart: {
      type: 'bar',
      height: 300,
      fontFamily: 'Work Sans, sans-serif',
      events: {
        // Add click event for interactivity
        dataPointSelection: function(event, chartContext, config) {
          const yearIndex = config.dataPointIndex;
          const selectedYear = chartData.years[yearIndex];
          
          // Highlight spots with the selected year
          highlightSpotsByYear(parseInt(selectedYear));
        }
      }
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: false,
        dataLabels: {
          position: 'top'
        }
      }
    },
    dataLabels: {
      enabled: true,
      formatter: function(val) {
        return val;
      },
      offsetY: -20,
      style: {
        fontSize: '12px',
        colors: ["#304758"]
      }
    },
    xaxis: {
      categories: chartData.years,
      labels: {
        style: {
          fontSize: '12px'
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          fontSize: '12px'
        }
      }
    },
    colors: [colorPalette.purple],
  };
  
  const unitsByYearEl = document.querySelector("#units-by-year-chart");
  if (unitsByYearEl) {
    // Clear existing chart if any
    unitsByYearEl.innerHTML = '';
    unitsByYearChart = new ApexCharts(unitsByYearEl, unitsByYearOptions);
    unitsByYearChart.render();
  }

  // Zoning distribution pie chart (interactive) - Minimized text
  const zoningOptions = {
    series: chartData.zoningValues,
    chart: {
      type: 'pie',
      height: 350,
      fontFamily: 'Work Sans, sans-serif',
      events: {
        // Add click event for interactivity
        dataPointSelection: function(event, chartContext, config) {
          const zoningIndex = config.dataPointIndex;
          const selectedZoning = chartData.zoningLabels[zoningIndex];
          
          // Highlight spots with the selected zoning
          highlightSpotsByZoning(selectedZoning);
        }
      }
    },
    labels: chartData.zoningLabels,
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: 300
        },
        legend: {
          position: 'bottom'
        }
      }
    }],
    colors: [
      colorPalette.pink, 
      colorPalette.purple, 
      colorPalette.darkBlue, 
      colorPalette.blue, 
      colorPalette.lightBlue, 
      '#9D4EDD', // Additional variants
      '#7678ED',
      '#3E92CC'
    ],
    tooltip: {
      y: {
        formatter: function(val) {
          return val + ' units';
        }
      }
    },
    legend: {
      position: 'right',
      fontSize: '12px'
    }
  };
  
  const zoningChartEl = document.querySelector("#zoning-pie-chart");
  if (zoningChartEl) {
    // Clear existing chart if any
    zoningChartEl.innerHTML = '';
    zoningChart = new ApexCharts(zoningChartEl, zoningOptions);
    zoningChart.render();
  }
  
  // Show all chart sections
  showChartSections();
  
  // Set up click listener for resetting spots
  setupResetClickListener();
}

// Set up a click listener for the entire document to reset spots when clicking outside charts
function setupResetClickListener() {
  // Remove any existing listener first to avoid duplicates
  document.removeEventListener('click', handleDocumentClick);
  document.addEventListener('click', handleDocumentClick);
}

// Handle clicks on the document
function handleDocumentClick(event) {
  // Get all chart elements and the map
  const chartElements = document.querySelectorAll('.chart-container, #income-chart, #home-value-chart, #units-by-year-chart, #zoning-pie-chart');
  const mapElement = document.getElementById('dashboard-map');
  
  // Check if the click is inside any chart or the map
  let isInsideChartOrMap = false;
  
  if (mapElement && mapElement.contains(event.target)) {
    isInsideChartOrMap = true;
  }
  
  chartElements.forEach(element => {
    if (element && element.contains(event.target)) {
      isInsideChartOrMap = true;
    }
  });
  
  // If click is outside charts and map, reset spots
  if (!isInsideChartOrMap) {
    console.log('Click outside charts and map detected, resetting spots');
    resetSpotHighlights();
  }
}

// Function to filter spots by year
function filterSpotsByYear(year) {
  if (!allFeatures || allFeatures.length === 0) return [];
  
  currentYear = year;
  selectedYearSpots = allFeatures.filter(feature => {
    const consComplete = feature.properties.cons_complete;
    return consComplete === year.toString() || consComplete === year;
  });
  
  return selectedYearSpots;
}

// Function to highlight spots on map by year
function highlightSpotsByYear(year) {
  if (!spotsLayer) {
    console.warn('spotsLayer not available');
    return;
  }
  
  const filteredSpots = filterSpotsByYear(year);
  
  // Reset current zoning selection since we're now filtering by year
  currentZoning = null;
  
  // Create a custom event to inform the map about the filtered spots
  const highlightEvent = new CustomEvent('highlight-spots', {
    detail: {
      spots: filteredSpots,
      year: year
    }
  });
  
  // Dispatch the event to the global window
  window.dispatchEvent(highlightEvent);
  
  return filteredSpots;
}

// Function to filter spots by zoning
function filterSpotsByZoning(zoning) {
  if (!allFeatures || allFeatures.length === 0) return [];
  
  currentZoning = zoning;
  
  return allFeatures.filter(feature => feature.properties.zoning === zoning);
}

// Function to highlight spots on map by zoning
function highlightSpotsByZoning(zoning) {
  if (!spotsLayer) {
    console.warn('spotsLayer not available');
    return;
  }
  
  // Reset current year selection since we're now filtering by zoning
  currentYear = null;
  
  // Filter spots by the selected zoning
  const filteredSpots = filterSpotsByZoning(zoning);
  
  // Create a custom event to inform the map about the selected zoning
  const highlightEvent = new CustomEvent('zoning-selected', {
    detail: {
      zoning: zoning,
      spots: filteredSpots
    }
  });
  
  // Dispatch the event to the global window
  window.dispatchEvent(highlightEvent);
  
  return filteredSpots;
}

// Function to reset spot highlights
function resetSpotHighlights() {
  console.log('Resetting spot highlights');
  
  if (!allFeatures || allFeatures.length === 0) {
    console.warn('No features available to reset');
    return;
  }
  
  // Reset current selection variables
  currentYear = null;
  currentZoning = null;
  
  try {
    // Create a custom event to inform the map to reset all spots
    const resetEvent = new CustomEvent('reset-spots', {
      detail: {
        spots: allFeatures
      }
    });
    
    // Dispatch the event to the global window
    window.dispatchEvent(resetEvent);
    
    // Dispatch event for RCO charts to reset their titles (if needed)
    window.dispatchEvent(new CustomEvent('reset-rco-titles'));
    
    console.log('Reset completed successfully');
  } catch (error) {
    console.error('Error resetting spots:', error);
  }
}

// Function to set map layers for interaction
function setMapLayers(mapLayers) {
  // Set the spotsLayer from the provided map layers
  if (mapLayers && mapLayers.spotsLayer) {
    spotsLayer = mapLayers.spotsLayer;
  }
}

// Function to hide chart sections
function hideChartSections() {
  const sections = [
    'metrics-container',
    'income-chart-container',
    'home-value-chart-container',
    'units-by-year-container',
    'zoning-chart-container'
  ];
  
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}

// Function to show chart sections
function showChartSections() {
  const sections = [
    'metrics-container',
    'income-chart-container',
    'home-value-chart-container',
    'units-by-year-container',
    'zoning-chart-container'
  ];
  
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'block';
  });
}

// Export the functions that are used in other modules
export { 
  setMapLayers,
  highlightSpotsByYear, 
  highlightSpotsByZoning,
  resetSpotHighlights,
  createCharts,
  showChartSections,
  hideChartSections
};