//import initMap to create map
import { initMap } from './map.js';
//call initialize address function
import { initializeAddressEntry } from './address.js';
//import spots data loading function 
import { loadSpotsData } from './spots_data.js';
//import charts.js to update message and other chart functions
import { 
    updateMessage, 
    createCharts,
    showChartSections,
    hideChartSections
} from './charts.js';
//import rco chart functionality with the new convertNestedJsonToArray function
import { 
    initRcoCharts, 
    createRcoCharts 
} from './rco_charts.js';

//DOM CONTENT THAT ALLOWS FOR TAB SWITCHING
document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const dashboardTab = document.querySelector('[data-tab="dashboard"]');
    
    // Create a global event bus for communication between components
    window.eventBus = new EventTarget();
    
    // Function to switch to dashboard tab
    function switchToDashboard() {
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        dashboardTab.classList.add('active');
        document.getElementById('dashboard-view').classList.add('active');
    }

    // Tab switching functionality
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            if (tab.classList.contains('disabled')) {
                return;
            }
            
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(`${tabId}-view`).classList.add('active');
        });
    });

    //call the event bus before all the functions
    const events = new EventTarget();

    //initialize maps
    const mapEl = document.querySelector('#map');
    const { map, showBuffer } = initMap(mapEl);

    const dashboardMapEl = document.querySelector('#dashboard-map');
    const { map: dashboardMap, showBuffer: dashboardShowBuffer, addSpots } = initMap(dashboardMapEl);

    //initialize address entry functionality
    initializeAddressEntry(events);

    // Initialize RCO charts module - preload data
    // This will use the convertNestedJsonToArray function for JSON conversion
    initRcoCharts();

    // Add listener for JSON conversion errors
    window.addEventListener('json-conversion-error', (event) => {
        console.error('JSON conversion error:', event.detail.error);
        alert('Error converting data format. Please check the console for details.');
    });

    events.addEventListener('address-search', async (evt) => {
        const { buffer, lat, lon } = evt.detail;
        
        if (lat && lon) {
            try {
                console.log('Loading spots data for address...');
                const { spots } = await loadSpotsData(lat, lon, 250);
                console.log('Spots loaded:', spots);
                
                // Enable dashboard
                dashboardTab.classList.remove('disabled');
                
                // Show buffer and spots on dashboard map
                if (buffer) {
                    dashboardShowBuffer(buffer);
                    if (spots && spots.features) {
                        console.log('Adding spots to dashboard map...');
                        addSpots(spots);
                        
                        // Set initial message based on search location and features count
                        const featuresCount = spots.features.length;
                        const address = evt.detail.address || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
                        updateMessage(`Found ${featuresCount} multifamily units near ${address}`);
                        
                        // Update standard charts
                        createCharts(spots.features);
                        
                        // Create RCO charts
                        createRcoCharts(spots.features);
                    } else {
                        console.log('No feature data in spots');
                        updateMessage('No multifamily units data available');
                        hideChartSections();
                    }
                }
                
                // Switch to dashboard view
                switchToDashboard();
                
            } catch (error) {
                console.error('Error loading dashboard:', error);
                alert('Error loading data. Please try again.');
            }
        }
    });

    //update message and charts on feature selection
    events.addEventListener('update-message', (evt) => {
        const { feature } = evt.detail;
        
        // Check if we received a single feature or an array
        if (Array.isArray(feature)) {
            // Update charts with the feature array and set message
            const featuresCount = feature.length;
            updateMessage(`${featuresCount} multifamily units in selected area`);
            createCharts(feature);
        } else {
            // If it's a single feature, wrap it in an array
            const address = feature.properties.address || 'Unknown address';
            updateMessage(`Selected: ${address}`);
            createCharts([feature]);
        }
        
        // Also update RCO charts when message is updated
        createRcoCharts(Array.isArray(feature) ? feature : [feature]);
    });

    //handle any errors
    window.addEventListener('error', (e) => {
        console.error('Application error:', e.error);
    });
});