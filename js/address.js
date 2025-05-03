//first, lets call up our main elements from the html
const addressEntry = document.querySelector('#entry');
const addressChoices = document.querySelector('#address-choices');
const searchButton = document.querySelector('#search');
const yearStartSelect = document.querySelector('#year-start');
const yearEndSelect = document.querySelector('#year-end');
const rcoSelect = document.querySelector('#rco-select');
const districtSelect = document.querySelector('#council-district-select');

//create empty container for selected addresses
let selectedLocation = null;

//we need to have the event function trigger at certain events
function initializeAddressEntry(events) {
    //first, we are going to look at when user inputs address
    let timeout;
    addressEntry.mycustomfunc = () => {
      //when address entry section has an input, run it by this function
      clearTimeout(timeout);
      timeout = setTimeout(() => handleAddressEntryChange(events), 300);
    };
    addressEntry.addEventListener('input', addressEntry.mycustomfunc);
  
    //add a listener event for clicks of search buttons
    searchButton.addEventListener('click', () => {
      const searchType = document.querySelector('input[name="search-type"]:checked').value;
      const yearStart = yearStartSelect.value ? parseInt(yearStartSelect.value) : null;
      const yearEnd = yearEndSelect.value ? parseInt(yearEndSelect.value) : null;
      
      // Validate year range
      if (yearStart && yearEnd && yearStart > yearEnd) {
        alert('Start year must be before or equal to end year');
        return;
      }
      
      switch(searchType) {
        case 'address':
          if (!selectedLocation) {
            alert('Please select an address');
            return;
          }
          
          const selectedPoint = turf.point([selectedLocation.lon, selectedLocation.lat]);
          const buffer = turf.buffer(selectedPoint, 0.75, { units: 'kilometers' });
          
          const addressEvent = new CustomEvent('address-search', {
            detail: {
              lat: selectedLocation.lat,
              lon: selectedLocation.lon,
              buffer,
              bounds: turf.bbox(buffer),
              yearStart,
              yearEnd
            },
          });
          events.dispatchEvent(addressEvent);
          break;
          
        case 'rco':
          if (!rcoSelect.value) {
            alert('Please select an RCO');
            return;
          }
          
          const rcoEvent = new CustomEvent('rco-search', {
            detail: {
              rcoName: rcoSelect.value,
              yearStart,
              yearEnd
            },
          });
          events.dispatchEvent(rcoEvent);
          break;
          
        case 'council-district':
          if (!districtSelect.value) {
            alert('Please select a Council District');
            return;
          }
          
          const districtEvent = new CustomEvent('district-search', {
            detail: {
              district: districtSelect.value,
              yearStart,
              yearEnd
            },
          });
          events.dispatchEvent(districtEvent);
          break;
      }
    });
}
  
//function taken from example project philly_lead_levels
async function handleAddressEntryChange(events) {
    try {
        //when the event is triggered, remove the hidden style of address choice
        addressChoices.classList.remove('hidden');
    
        //store partial address input in a new const
        const partialAddress = addressEntry.value.trim();
        //mapbox info for setup
        const apiKey = 'pk.eyJ1IjoiYWF2YW5pMTAzIiwiYSI6ImNtMTgxOGkyZzBvYnQyam16bXFydTUwM3QifQ.hXw8FwWysnOw3It_Sms3UQ';
        const bbox = [-75.280284, 39.867004, -74.955712, 40.137992].join(',');
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(partialAddress)}.json?bbox=${bbox}&access_token=${apiKey}`;
    
        //first, create a check function that only runs the event if the partial address is filled
        if (!partialAddress) {
          addressChoices.classList.add('hidden');
          selectedLocation = null;
          return;
        }
    
        //fetch address information from mapbox api using the partial address
        const resp = await fetch(url);
        if (!resp.ok) {
            throw new Error('Failed to fetch address suggestions');
        }
        const data = await resp.json();
    
        //now that we recieved our data, its time to change the html
        //first, create a empty html container
        let html = '';
        //then parse what we need to add to the hidden list
        for (const feature of data.features) { //take every feature from the partial address response
          const lihtml = `
              <li data-lat="${feature.center[1]}" data-lon="${feature.center[0]}">
                ${feature.place_name}
              </li>
              `;
          //here, we are creating a new list item that contains the coordiantes of likely address
          //and its name. This is what will be added to our hidden list.
    
          html += lihtml;
        }
        //with everything defined ,lets change the list of address we get
        addressChoices.innerHTML = html;
    
        //okay great, now we should have the list of addresses to choose from.
        //we also need to account for the behaviour after an address has been selected so
    
        //listen for click events, then put the outcome of that event into the handleAddressChoice function
        const choices = addressChoices.querySelectorAll('li');
        for (const choice of choices) {
          choice.addEventListener('click', (evt) => {
            handleAddressChoice(evt, events);
          });
        }
    } catch (error) {
        console.error('Error fetching addresses:', error);
        addressChoices.innerHTML = '<li class="error">Error finding addresses</li>';
    }
}
  
//create function that extracts the coordiantes of the selected address and hides the list again
function handleAddressChoice(evt, events) {
    const li = evt.target;
    const lat = parseFloat(li.getAttribute('data-lat'));
    const lon = parseFloat(li.getAttribute('data-lon'));
  
    if (isNaN(lat) || isNaN(lon)) {
        console.error('Invalid coordinates');
        return;
    }

    const text = li.innerText;
    addressEntry.value = text;
    addressChoices.classList.add('hidden');
  
    selectedLocation = { lat, lon };
}
  
//finally, export function
export {
    initializeAddressEntry
};