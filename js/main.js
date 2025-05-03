//import initMap to create map
import { initMap } from './map.js';
//call initialize address function
import { initializeAddressEntry } from './address.js';
//import spots data loading functions
import { loadSpotsData, loadSpotsByRCO, loadSpotsByDistrict } from './spots_data.js';
//import search type handler
import { initializeSearchTypeHandler } from './search.js';

//import charts.js to update message
import { updateMessage } from './charts.js';

//DOM CONTENT THAT ALLOWS FOR TAB SWITCHING
document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const dashboardTab = document.querySelector('[data-tab="dashboard"]');
    
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

    //initialize search type handler
    initializeSearchTypeHandler();

    //initialize address entry functionality
    initializeAddressEntry(events);


    events.addEventListener('address-search', async (evt) => {
        const { buffer, lat, lon, year } = evt.detail;
        
        if (lat && lon) {
            try {
                console.log('Loading spots data for address...');
                const { spots } = await loadSpotsData(lat, lon, 750, year);
                console.log('Spots loaded:', spots);
                
                // Enable dashboard
                dashboardTab.classList.remove('disabled');
                
                // Show buffer and spots on dashboard map
                if (buffer) {
                    dashboardShowBuffer(buffer);
                    if (spots && spots.features) {
                        console.log('Adding spots to dashboard map...');
                        addSpots(spots);
                        updateMessage(spots.features);
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

    //handle RCO search events
    events.addEventListener('rco-search', async (evt) => {
        const { rcoName, year } = evt.detail;
        
        try {
            console.log('Loading spots data for RCO:', rcoName);
            const { spots } = await loadSpotsByRCO(rcoName, year);
            console.log('Spots loaded:', spots);
            
            // Enable dashboard
            dashboardTab.classList.remove('disabled');
            
            // Show spots on dashboard map
            if (spots && spots.features) {
                console.log('Adding spots to dashboard map...');
                addSpots(spots);
                updateMessage(spots.features);
                
                // Zoom to fit all features
                if (spots.features.length > 0) {
                    const bounds = L.latLngBounds(spots.features.map(f => [
                        f.geometry.coordinates[1],
                        f.geometry.coordinates[0]
                    ]));
                    dashboardMap.fitBounds(bounds, { padding: [50, 50] });
                }
            }
            
            // Switch to dashboard view
            switchToDashboard();
            
        } catch (error) {
            console.error('Error loading RCO data:', error);
            alert('Error loading data. Please try again.');
        }
    });

    //handle District search events
    events.addEventListener('district-search', async (evt) => {
        const { district, year } = evt.detail;
        
        try {
            console.log('Loading spots data for District:', district);
            const { spots } = await loadSpotsByDistrict(district, year);
            console.log('Spots loaded:', spots);
            
            // Enable dashboard
            dashboardTab.classList.remove('disabled');
            
            // Show spots on dashboard map
            if (spots && spots.features) {
                console.log('Adding spots to dashboard map...');
                addSpots(spots);
                updateMessage(spots.features);
                
                // Zoom to fit all features
                if (spots.features.length > 0) {
                    const bounds = L.latLngBounds(spots.features.map(f => [
                        f.geometry.coordinates[1],
                        f.geometry.coordinates[0]
                    ]));
                    dashboardMap.fitBounds(bounds, { padding: [50, 50] });
                }
            }
            
            // Switch to dashboard view
            switchToDashboard();
            
        } catch (error) {
            console.error('Error loading district data:', error);
            alert('Error loading data. Please try again.');
        }
    });

    //update message on dashboard
    events.addEventListener('update-message', (evt) => {
        const { feature } = evt.detail;
        updateMessage(feature);
    });

    //handle any errors
    window.addEventListener('error', (e) => {
        console.error('Application error:', e.error);
    });
});