// Global variable to store features for interactive filtering
let allFeatures = [];
let currentYear = null;
let currentZoning = null;
let selectedYearSpots = [];
let spotsLayer = null;

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

  // Show number of units found
  updateMessage(`Found ${features.length} multifamily units`);

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
    avgImpactScore: [],
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
  
  // Calculate average impact score
  const impactScores = features.map(f => f.properties.impact_score).filter(score => score !== null);
  
  chartData.avgImpactScore = impactScores.length ? 
    impactScores.reduce((a, b) => a + b, 0) / impactScores.length : null;
  
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
  if (!spotsLayer) return;
  
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
  if (!spotsLayer) return;
  
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

// This function creates the charts
function createCharts(features) {
  if (!features || !features.length) {
    document.getElementById('message').textContent = 'No multifamily units data available';
    hideChartSections();
    return;
  }
  
  const chartData = prepareChartData(features);
  
  if (!chartData) {
    hideChartSections();
    return;
  }
  
  // Update Impact Score
  const impactScoreEl = document.getElementById('impact-score-value');
  if (impactScoreEl) {
    impactScoreEl.textContent = chartData.avgImpactScore !== null 
      ? (chartData.avgImpactScore * 100).toFixed(1) 
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
  
  // Income chart
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
      title: {
        text: 'Year'
      }
    },
    yaxis: {
      title: {
        text: 'Income ($)'
      },
      labels: {
        formatter: function(val) {
          return val ? `${val.toLocaleString()}` : '';
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
          return val ? `${val.toLocaleString()}` : 'N/A';
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
  
  // Home value chart
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
      title: {
        text: 'Year'
      }
    },
    yaxis: {
      title: {
        text: 'Home Value ($)'
      },
      labels: {
        formatter: function(val) {
          return val ? `${val.toLocaleString()}` : '';
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
          return val ? `${val.toLocaleString()}` : 'N/A';
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
  
  // Units by construction year chart (interactive)
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
          
          // Update the highlighted bar
          unitsByYearChart.updateOptions({
            title: {
              text: `Units Completed (${selectedYear} selected)`,
              style: {
                fontSize: '16px',
                fontWeight: 'bold',
                color: colorPalette.pink
              }
            }
          });
          
          // Reset zoning chart title
          zoningChart.updateOptions({
            title: {
              text: 'Distribution by Zoning Category',
              style: {
                fontSize: '16px',
                fontWeight: 'normal',
                color: '#304758'
              }
            }
          });
          
          // Dispatch event for RCO charts to reset their titles
          window.dispatchEvent(new CustomEvent('reset-rco-titles'));
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
      title: {
        text: 'Year'
      }
    },
    yaxis: {
      title: {
        text: 'Number of Units'
      }
    },
    colors: [colorPalette.purple],
    title: {
      text: 'Units Completed',
      style: {
        fontSize: '16px',
        fontWeight: 'normal',
        color: colorPalette.purple
      }
    }
  };
  
  const unitsByYearEl = document.querySelector("#units-by-year-chart");
  let unitsByYearChart;
  if (unitsByYearEl) {
    // Clear existing chart if any
    unitsByYearEl.innerHTML = '';
    unitsByYearChart = new ApexCharts(unitsByYearEl, unitsByYearOptions);
    unitsByYearChart.render();
  }

  // Zoning distribution pie chart (interactive)
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
          
          // Update the chart title
          zoningChart.updateOptions({
            title: {
              text: `Zoning Distribution (${selectedZoning} selected)`,
              style: {
                fontSize: '16px',
                fontWeight: 'bold',
                color: colorPalette.pink
              }
            }
          });
          
          // Reset year chart title
          unitsByYearChart.updateOptions({
            title: {
              text: 'Units Completed',
              style: {
                fontSize: '16px',
                fontWeight: 'normal',
                color: colorPalette.purple
              }
            }
          });
          
          // Dispatch event for RCO charts to reset their titles
          window.dispatchEvent(new CustomEvent('reset-rco-titles'));
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
    title: {
      text: 'Distribution by Zoning Category',
      style: {
        fontSize: '16px',
        fontWeight: 'normal',
        color: '#304758'
      }
    },
    tooltip: {
      y: {
        formatter: function(val) {
          return val + ' units';
        }
      }
    },
    legend: {
      position: 'right'
    }
  };
  
  const zoningChartEl = document.querySelector("#zoning-pie-chart");
  let zoningChart;
  if (zoningChartEl) {
    // Clear existing chart if any
    zoningChartEl.innerHTML = '';
    zoningChart = new ApexCharts(zoningChartEl, zoningOptions);
    zoningChart.render();
  }
  
  // Show all chart sections
  showChartSections();
}

// Add the missing functions
function updateMessage(message) {
  const messageEl = document.getElementById('message');
  if (messageEl) {
    messageEl.textContent = message;
  }
}

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
  updateMessage, 
  setMapLayers,
  highlightSpotsByYear, 
  highlightSpotsByZoning,
  createCharts,
  showChartSections,
  hideChartSections
};