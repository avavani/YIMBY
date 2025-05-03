// This function prepares data for the charts
function prepareChartData(features) {
  if (!features || !features.length) {
    return null;
  }

  // Initialize data structures
  const yearlyData = {};
  
  // Process each feature
  features.forEach(feature => {
    const props = feature.properties;
    
    // Extract yearly data
    for (let year = 2015; year <= 2023; year++) {
      if (!yearlyData[year]) {
        yearlyData[year] = {
          incomes: [],
          homeValues: []
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
    }
  });
  
  // Calculate averages
  const chartData = {
    years: [],
    avgIncome: [],
    avgHomeValue: [],
    avgImpactScore: []
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
  });
  
  // Calculate average impact score
  const impactScores = features.map(f => f.properties.impact_score).filter(score => score !== null);
  
  chartData.avgImpactScore = impactScores.length ? 
    impactScores.reduce((a, b) => a + b, 0) / impactScores.length : null;
  
  return chartData;
}

// This function creates the charts
function createCharts(features) {
  const chartEl = document.getElementById('chart');
  
  if (!features || !features.length) {
    chartEl.innerHTML = '<p>No data available for charts</p>';
    return;
  }
  
  // Clear existing charts
  chartEl.innerHTML = '';
  
  const chartData = prepareChartData(features);
  
  if (!chartData) {
    return;
  }
  
  // Create impact score display
  const impactScoreHtml = `
    <div id="impact-score-container" style="text-align: center; margin-bottom: 30px;">
      <h3 style="font-family: 'Work Sans', sans-serif; margin-bottom: 10px;">Impact Score</h3>
      <div style="font-size: 48px; font-weight: bold; color: #775DD0;">
        ${chartData.avgImpactScore !== null ? (chartData.avgImpactScore * 100).toFixed(1) : 'N/A'}
      </div>
    </div>
  `;
  
  // Create containers for each chart
  chartEl.innerHTML = impactScoreHtml + `
    <div id="income-chart-container" style="margin-bottom: 30px;">
      <h3 style="font-family: 'Work Sans', sans-serif;">Median Income Trend</h3>
      <div id="income-chart"></div>
    </div>
    <div id="home-value-chart-container" style="margin-bottom: 30px;">
      <h3 style="font-family: 'Work Sans', sans-serif;">Median Home Value Trend</h3>
      <div id="home-value-chart"></div>
    </div>
  `;
  
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
    colors: ['#008FFB'],
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
  
  const incomeChart = new ApexCharts(document.querySelector("#income-chart"), incomeOptions);
  incomeChart.render();
  
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
    colors: ['#00E396'],
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
  
  const homeValueChart = new ApexCharts(document.querySelector("#home-value-chart"), homeValueOptions);
  homeValueChart.render();
}

// Updating message
function updateMessage(features) {
  const messageEl = document.getElementById('message');

  if (!features || !features.length) {
    messageEl.textContent = 'No multifamily units data available';
    return;
  }

  const unitCount = features.length.toLocaleString();
  messageEl.textContent = `${unitCount} New Multifamily Units Built`;
  
  // Create charts after updating message
  createCharts(features);
}

export { updateMessage };