//import initMap to create map
import { initMap } from './map.js';
//call initialize address function
import { initializeAddressEntry } from './address.js';
//import spots data loading function
import { loadSpotsData } from './spots_data.js';

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

    //initialize address entry functionality
    initializeAddressEntry(events);

    //handle address-zoom-map events to show buffer and enable dashboard
    events.addEventListener('address-zoom-map', async (evt) => {
        const { buffer, lat, lon } = evt.detail;
        
        if (lat && lon) {
            try {
                console.log('Loading spots data...');
                const { spots } = await loadSpotsData(lat, lon);
                console.log('Spots loaded:', spots);
                
                // Enable dashboard
                dashboardTab.classList.remove('disabled');
                
                // Only show buffer on dashboard map
                if (buffer) {
                    dashboardShowBuffer(buffer);
                    if (spots && spots.features) {
                        console.log('Adding spots to dashboard map...');
                        addSpots(spots);
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