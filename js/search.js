function initializeSearchTypeHandler() {
    const radioButtons = document.querySelectorAll('input[name="search-type"]');
    const addressSection = document.getElementById('address-search');
    const rcoSection = document.getElementById('rco-search');
    const councilDistrictSection = document.getElementById('council-district-search');
    
    // Function to handle search type changes
    function handleSearchTypeChange(e) {
        const selectedType = e.target.value;
        
        // Hide all sections first
        addressSection.classList.add('hidden');
        rcoSection.classList.add('hidden');
        councilDistrictSection.classList.add('hidden');
        
        // Show the selected section
        switch(selectedType) {
            case 'address':
                addressSection.classList.remove('hidden');
                break;
            case 'rco':
                rcoSection.classList.remove('hidden');
                break;
            case 'council-district':
                councilDistrictSection.classList.remove('hidden');
                break;
        }
    }
    
    // Add event listeners to radio buttons
    radioButtons.forEach(radio => {
        radio.addEventListener('change', handleSearchTypeChange);
    });
    
    // Populate Year dropdowns
    const yearStart = document.getElementById('year-start');
    const yearEnd = document.getElementById('year-end');
    const currentYear = new Date().getFullYear();
    
    for (let year = 2015; year <= currentYear; year++) {
        const optionStart = document.createElement('option');
        optionStart.value = year;
        optionStart.textContent = year;
        yearStart.appendChild(optionStart);
        
        const optionEnd = document.createElement('option');
        optionEnd.value = year;
        optionEnd.textContent = year;
        yearEnd.appendChild(optionEnd);
    }
    
    // Populate RCO dropdown with all RCOs
    const rcoSelect = document.getElementById('rco-select');
    const rcoOptions = [
        'Girard Estate Neighbors Association',
        'SoLo/Germantown Civic Association',
        'East Passyunk Crossing Civic Association (EPX)',
        'Residents of Shawmont Valley Association',
        'Passyunk Square Civic Association',
        'Greater Bustleton Civic League',
        'Fairmount Civic Association',
        'Old City District',
        'Mayfair Civic Association',
        'Take Back Your Neighborhood',
        'Central Delaware Advocacy Group (CDAG)',
        'Neighbors of Overbrook Association (NOAH)',
        'East Falls Community Council',
        'Hawthorne Empowerment Coalition',
        'Pennsport Civic Association',
        'South Street West Improvement District, Inc',
        'South Street Headhouse District',
        'Asociacion Puertorriquenos En Marcha (APM)',
        'Tacony Civic Association',
        'Nueva Esperanza Housing and Economic Development',
        'Holmesburg Civic Association',
        'Fishtown Neighbors Association',
        '35th Democratic Ward',
        'Walton Park Civic Assn (WALPAC)',
        'West Passyunk Neighbors Association (WPNA)',
        '50th Democratic Ward',
        'Faith Community Development Corporation (FCDC)',
        'Tioga United, Inc.',
        'RAH Civic Association',
        'Central Roxborough Civic Association (CRCA)',
        'Ridge Park Civic Association',
        'North Penn Community Action Council',
        'Callowhill Neighborhood Association',
        'Oak Lane Community Action Association',
        'Parkside Association',
        'East Torresdale Civic Association',
        'Dickinson Square West Civic Association',
        '40th Ward Republicans',
        'Somerton Civic Association',
        'Baynton Hill Neighbors',
        'Powelton Village Civic Association',
        'Spruce Hill Community Association',
        'Eastwick Friends & Neighbors Coalition',
        'South of South Neighborhood Association (SOSNA)',
        'HACE CDC',
        'Center City Residents Association (CCRA)',
        'Cedar Park Neighbors',
        'Belmont Alliance Civic Association CDC',
        'Mantua Civic Association',
        '27th Republican Ward',
        'Uptown Entertainment and Development Corporation',
        'Blue Bell Hill Civic Association',
        'East Kensington Neighbors Association',
        'Mill Creek Advisory Council',
        'Cedar Point Park Neighborhood Association',
        'Washington Square West Civic Association',
        'South Broad Street Neighborhood Association',
        'Temple Area Property Association (TAPA)',
        'Washington Avenue Property Owners Association',
        '13th Democratic Ward',
        'Upper Holmesburg Civic Association',
        'Girard Estate Area Residents (GEAR)',
        'Lawncrest Community Association',
        'Wissahickon Neighbors Civic Association (WNCA)',
        'Bella Vista Neighbors Association',
        'Roxborough Development Corporation',
        'Northwood Civic Association',
        'Woodland Terrace HomeOwners Association',
        'Chew and Belfield Neighbors Club Incorporated',
        'Viola Street Residents Association',
        'West Mount Airy Neighbors, Inc.',
        'Port Richmond On Patrol & Civic Association (PROPAC)',
        'Overbrook Farms Club',
        'Concerned Citizens of Point Breeze',
        'Wynnefield Residents Association',
        'West Powelton Saunders Park RCO',
        '1st Ward Republicans',
        'Friends of Historic FDR Park',
        'Logan Community Enterprise Center, Inc.',
        'East Point Breeze Neighbors',
        'Olde Kensington Neighborhood Association',
        '53rd Republican Ward',
        'Packer Park Civic Association',
        'Community Action Group',
        'Beech Community Services Incorporated',
        'East Mt. Airy Neighbors',
        '51st Republican Ward',
        'Spring Garden Civic Association',
        'Philadelphia Chinatown Development Corporation',
        'Wakefield 49ers Community Development and Improvement Association',
        'South Philadelphia Communities Civic Association (SPCCA)',
        'All In The Family Group Associates Incorporated',
        'Grays Ferry Community Council',
        'Northern Liberties Neighbors Association',
        'Holme Circle Civic Association',
        'Wynnefield Heights Civic Association',
        'Normandy Civic Association',
        'Fox Chase Civic Association',
        'Strawberry Mansion Community Development Corporation',
        'Empowered Community Development Corporation',
        'Society Hill Civic Association',
        'Olde Richmond Civic Association',
        'Friends of Ogden Park',
        'Brewerytown Sharswood Community Civic Association',
        '10th Democratic Ward',
        'Millbrook Civic Association',
        'Nicetown-Tioga Improvement Team',
        'South Kensington Community Partners',
        'Eastwick Community Network',
        'Wissahickon Interested Citizens Association',
        'Burholme Community Town Watch and Civic Association',
        'Impact Community Development Corporation',
        'Upper Roxborough Civic Association',
        'Whitman Council Incorporated',
        'Overbrook Park Civic Association',
        'Friends of Clark Park',
        'A Concerned Community Association (ACCA)',
        'Residents Organized for Advocacy and Direction',
        'Lancaster Avenue 21st Century Business Association',
        '44th Ward Republican',
        'ACHIEVEability',
        'Chestnut Hill Conservancy',
        'Kingsessing Area Civic Association',
        '42nd Democratic Ward',
        'Garden Court Community Association',
        'Wingohocking & Wister Neighbors',
        'Rhawnhurst Civic Association',
        'Friends of the Wissahickon',
        'Nicetown CDC',
        'Frankford CDC',
        '26th Republican Ward',
        'Southwest Philadelphia District Services (SWPDS)',
        'People\'s Emergency Center Community Development Corporation',
        'Chestnut Hill Community Association',
        'Manayunk Neighborhood Council',
        'Logan Square Neighborhood Association',
        'West Central Germantown Neighbors',
        'City Avenue Special Services District of Philadelphia and Lower Merion',
        'Queen Village Neighbors Association',
        '44th Democratic Ward',
        'Jefferson Manor Community Organization',
        '46th Republican Ward',
        '52nd Democratic Ward',
        'Wissinoming Civic Association',
        'Yorktown Community Development Corporation',
        'Harrowgate Civic Association',
        'Parkwood Area Civic Association',
        'Penn Knox Neighborhood Association',
        '37th Ward Executive Democratic Committee',
        '3rd Ward Republicans',
        'Northeast Community Civic Alliance',
        'West Belmont Civic Association',
        'Swampoodle Neighborhood Parcels Association',
        'Lower Moyamensing Civic Association',
        'Hestonville Civic Association',
        'Walnut Hill Community Association',
        'Cliveden Hills Association',
        'Port Richmond Industrial Development Enterprise (PRIDE)',
        'Veterans Stadium Neighbors Civic Association',
        'Awbury Arboretum Neighbors',
        'Somerset Neighbors for Better Living',
        'HMC Squared Community Association, INC',
        '12th and Cambria Advisory Board',
        'Franklin Bridge North Neighbors Inc',
        'Asian American Federation of the United States',
        'Arbours at Eagle Pointe Community Association',
        'Cobbs Creek Neighbors Association',
        'St. Elizabeth\'s RCO',
        'West Torresdale/Morrell Park Civic Association',
        '59th Democratic Ward',
        'Center City Organized for Responsible Development',
        'West Philly Plan + Preserve',
        'Bridesburg Community Action Alliance',
        'Celestial Community Development Corporation',
        'Concerned Neighbors for Change',
        'Centennial Parkside Community Development Corporation',
        'Broad Street West Civic Association',
        'Kensington Independent Civic Association',
        'Cathedral Park Community Development Association',
        'Central Manayunk Council',
        'Dearnley Park Civic Association',
        'Hunting Park Connected',
        'Logan Civic Association',
        'Paschall Betterment League, Inc',
        'Friends of Penrose',
        'United Francisville Civic Association',
        'Upper North Coalition of Community Councils',
        'Make it Happen Philly',
        'Mayfair Business Improvement District (BID)',
        'Mt. Airy Business Improvement District',
        'MAP Holistic CDC',
        'South Port Richmond Civic Association',
        'Norris Square Community Alliance',
        'Point Breeze Network Plus',
        'Fitler Square Neighborhood Association',
        'Point Breeze Community Development Coalition',
        'Juniata Park Civic Association',
        'Overbrook West Neighbors, Inc.',
        'Winchester Park Civic Association',
        'West Girard Progress',
        'The Good News Community Organization',
        '46th Ward Democratic Committee',
        'North of Washington Avenue Coalition',
        '12th Ward Democratic Committee',
        'East Parkside Residential Association',
        '22nd Ward Democratic RCO',
        '51st Ward Democratic Executive Committee',
        'West Chelten Neighbors Association',
        '3rd Ward Executive Committee',
        'North Central East RCO',
        'Community on the Rise',
        'Tasker-Morris Neighbors Association',
        'West Philadelphia Economic Development Council',
        'Holly Street Neighbors CDC',
        '14th Community Organization',
        'Fishtown Kensington Area Business Improvement District',
        'Upper North Neighbors Association',
        'Eastwick United CDC',
        'Philly Thrive (SWPDC)',
        'West Philly Together',
        'United Neighbors Alliance Civic Association',
        'Jayhawks Community Association',
        'Price-Knox Neighbors Assn.',
        'Drexel Area Property Association',
        'New Kensington Community Development Corp',
        'Frankford Kensington Development Council',
        'Wynnefield Community Neighborhood Association',
        'Mechanicsville Civic Association',
        'Original Morrocco\'s of Francisville inc.',
        'Strawberry Mansion Community Concern',
        'North Central Philadelphia Susquehanna Community Development Corporation',
        'Allegheny West Civic Association',
        'Washington Avenue Association of Businesses and Residents',
        'Norris Square Community Action Network-NSCAN',
        '21st Ward Democratic Committee',
        'Foxx Lane RCO',
        'Pomona Cherokee Civic Council (PCCC) RCO',
        'The Generationals of Philadelphia - Cobbs Creek',
        'West Philly United Neighbors',
        'Grays Ferry Coalition of Neighbors',
        'Helping Unite Belmont',
        'ACANA CDC- United Southwest Neighbors',
        'Oak Lane/Wister Community Coalition',
        'Chestnut Hill Business Improvement District',
        'Bustleton Neighbors Association',
        'River\'s Edge Community Association',
        'Philly Foot Forward',
        'Northeast Philadelphia Development Corporation',
        '7th Ward RCO',
        'KECO INC',
        'Cobbs Creek Watershed RCO',
        'The Nicetown Congress',
        'West Philadelphia Community Development Corporation',
        'Chestnut Hill Forward',
        'East Falls Forward',
        '32nd Ward RCO',
        'Yorktown Community Organization'
    ];
    
    // Sort RCOs alphabetically
    rcoOptions.sort();
    
    rcoOptions.forEach(rco => {
        const option = document.createElement('option');
        option.value = rco;
        option.textContent = rco;
        rcoSelect.appendChild(option);
    });
    
    // Populate Council District dropdown
    const councilDistrictSelect = document.getElementById('council-district-select');
    for (let i = 1; i <= 10; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `District ${i}`;
        councilDistrictSelect.appendChild(option);
    }
}

// Export the function to be used in main.js
export { initializeSearchTypeHandler };