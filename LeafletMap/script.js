const map = L.map('map').setView([39.5, -98.35], 4);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18
}).addTo(map);

let zipLayer;

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

    setupDropdowns(data.features);
  });

function getColor(count) {
  return count > 350 ? '#4a1486' :
         count > 300 ? '#6a51a3' :
         count > 250  ? '#807dba' :
         count > 200  ? '#9e9ac8' :
         count > 100  ? '#bcbddc' :
         count > 50   ? '#dadaeb' :
         count > 10   ? '#f2f0f7' :
                        '#fefefe';
}

function setupDropdowns(features) {
  const stateSelect = document.getElementById('stateSelect');
  const programSelect = document.getElementById('programSelect');

  // Populate states
  const states = [...new Set(features.map(f => f.properties.state))].sort();
  states.forEach(state => {
    const opt = document.createElement('option');
    opt.value = opt.text = state;
    stateSelect.add(opt);
  });

  // When state changes, update program list
  stateSelect.addEventListener('change', () => {
    programSelect.innerHTML = '<option value="">Select Program</option>';
    const selectedState = stateSelect.value;

    const programSites = [...new Set(features
      .filter(f => f.properties.state === selectedState)
      .map(f => f.properties.name_of_program_site))].sort();

    programSites.forEach(site => {
      const opt = document.createElement('option');
      opt.value = opt.text = site;
      programSelect.add(opt);
    });
  });

  // When program is selected, zoom to it
  programSelect.addEventListener('change', () => {
    const selectedState = stateSelect.value;
    const selectedProgram = programSelect.value;

    const matches = features.filter(f =>
      f.properties.state === selectedState &&
      f.properties.name_of_program_site === selectedProgram
    );

    if (matches.length) {
      const group = L.geoJSON(matches);
      map.fitBounds(group.getBounds().pad(0.2));
    }
  });
}



