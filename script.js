const map = L.map('map').setView([39.5, -98.35], 4);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18
}).addTo(map);

let zipLayer;

// Mediation Counts and Program site added to mouseover tooltip polygon/shape
fetch('data/filtered_zips_with_mediations.geojson') 
  .then(res => res.json())
  .then(data => {
    zipLayer = L.geoJSON(data, {
      style: feature => ({
        fillColor: getColor(feature.properties.mediation_count), 
        weight: 1,
        color: "#444",
        fillOpacity: 0.7
      }),
      onEachFeature: (feature, layer) => {
        const props = feature.properties;
        layer.bindTooltip(
          `<strong>${props.name_of_program_site}</strong><br> 
           ZIP: ${props.GEOID20}<br>
           Mediations: ${props.mediation_count || 0}`,
          { sticky: true }
        );
      }
    }).addTo(map);

    console.log("First feature properties:", data.features[0].properties);  // 👈 Add this
    setupDropdowns(data.features);
  });

  
function getColor(count) {
  return count > 350 ? '#4a1486' :
         count > 250 ? '#6a51a3' :
         count > 150  ? '#807dba' :
         count > 75  ? '#9e9ac8' :
         count > 50  ? '#bcbddc' :
         count > 25   ? '#dadaeb' :
         count > 5   ? '#f2f0f7' :
                        '#fefefe';
}

// Add Dropdown filter for map
function setupDropdowns(features) {
  const stateSelect = document.getElementById('stateSelect');
  const citySelect = document.getElementById('programSelect');

  // Parse URL parameters
  const params = new URLSearchParams(window.location.search);
  const defaultState = params.get('state');
  const defaultCity = params.get('city');

  // Populate unique states
  const states = [...new Set(features.map(f => f.properties.state))].sort();
  states.forEach(state => {
    const opt = document.createElement('option');
    opt.value = opt.text = state;
    stateSelect.add(opt);
  });

  // If URL includes a default state, pre-select it
  if (defaultState && states.includes(defaultState)) {
    stateSelect.value = defaultState;

    // Populate cities for default state
    const cities = [...new Set(features
      .filter(f => f.properties.state === defaultState)
      .map(f => f.properties.city))].sort();

    citySelect.innerHTML = '<option value="">Select City</option>';
    cities.forEach(city => {
      const opt = document.createElement('option');
      opt.value = opt.text = city;
      citySelect.add(opt);
    });

    // If URL includes a default city, pre-select and zoom to it
    if (defaultCity && cities.includes(defaultCity)) {
      citySelect.value = defaultCity;

      const matches = features.filter(f =>
        f.properties.state === defaultState &&
        f.properties.city === defaultCity
      );

      if (matches.length) {
        const group = L.geoJSON(matches);
        map.fitBounds(group.getBounds().pad(0.25));
      }
    }
  }

  // When state changes manually, update cities
  stateSelect.addEventListener('change', () => {
    const selectedState = stateSelect.value;

    citySelect.innerHTML = '<option value="">Select City</option>';

    const cities = [...new Set(features
      .filter(f => f.properties.state === selectedState)
      .map(f => f.properties.city))].sort();

    cities.forEach(city => {
      const opt = document.createElement('option');
      opt.value = opt.text = city;
      citySelect.add(opt);
    });
  });

  // When city changes manually, zoom to selected ZIPs
  citySelect.addEventListener('change', () => {
    const selectedState = stateSelect.value;
    const selectedCity = citySelect.value;

    const matches = features.filter(f =>
      f.properties.state === selectedState &&
      f.properties.city === selectedCity
    );

    if (matches.length) {
      const group = L.geoJSON(matches);
      map.fitBounds(group.getBounds().pad(0.25));
    }
  });
}