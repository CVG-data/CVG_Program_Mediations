const map = L.map('map').setView([39.5, -98.35], 4);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18
}).addTo(map);

let zipLayer;

// Load and render the GeoJSON data
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

    zoomFromURL(data.features);
  });

function getColor(count) {
  return count > 350 ? '#4a1486' :
         count > 250 ? '#6a51a3' :
         count > 150 ? '#807dba' :
         count > 75  ? '#9e9ac8' :
         count > 50  ? '#bcbddc' :
         count > 25  ? '#dadaeb' :
         count > 5   ? '#f2f0f7' :
                       '#fefefe';
}

// Zoom based on state/city passed via URL
function zoomFromURL(features) {
  const params = new URLSearchParams(window.location.search);
  const state = params.get('state');
  const city = params.get('city');

  if (!state || !city) return;

  const matches = features.filter(f =>
    f.properties.state === state &&
    f.properties.city === city
  );

  if (matches.length) {
    const group = L.geoJSON(matches);
    map.fitBounds(group.getBounds().pad(0.25));
  }
}
