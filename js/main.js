//import initMap to create map
import { initMap } from './map.js';

//call initialize address function
import { initializeAddressEntry } from './address.js';

//DOM CONTENT THAT ALLOWS FOR TAB SWITCHING
document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const dashboardTab = document.getElementById('dashboard-tab');

    // Tab switching functionality
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Check if tab is disabled
            if (tab.classList.contains('disabled')) {
                return;
            }

            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(`${tabId}-view`).classList.add('active');
        });
    });

    //call the event bus before all the functions
    const events = new EventTarget(); // events object here is the event bus

    //search the document for the id selector #map
    const mapEl = document.querySelector('#map');

    //initialize map and get both map and showBuffer functions
    const { map, showBuffer } = initMap(mapEl);

    //initialize address entry functionality
    initializeAddressEntry(events);

    //handle address-zoom-map events to show buffer and enable dashboard
    events.addEventListener('address-zoom-map', (evt) => {
        const { buffer, lat, lon } = evt.detail;
        
        // Enable dashboard tab when coordinates are available
        if (lat && lon) {
            dashboardTab.classList.remove('disabled');
            
            // Switch to dashboard tab
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            dashboardTab.classList.add('active');
            document.getElementById('dashboard-view').classList.add('active');
            
            // Initialize dashboard map
            const dashboardMapEl = document.querySelector('#dashboard-map');
            const dashboardMap = initMap(dashboardMapEl);
            if (buffer) {
                dashboardMap.showBuffer(buffer);
            }
        }
        
        // Show buffer
        if (buffer) {
            showBuffer(buffer);
        }
    });

    //handle any errors
    window.addEventListener('error', (e) => {
        console.error('Application error:', e.error);
    });
}); // Close the DOMContentLoaded event listener