// Global handler for uncaught promise rejections from the Places API
window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled promise rejection:', event.reason);
  document.getElementById('status').textContent = `Error: ${event.reason.message || event.reason}`;
});

const statusDiv = document.getElementById('status');
const barList   = document.getElementById('bar-list');
let map, service;

// Kick things off on load
window.addEventListener('load', init);

function init() {
  if (!navigator.geolocation) {
    statusDiv.textContent = 'Geolocation not supported.';
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude, longitude } = pos.coords;
      statusDiv.textContent = `You’re at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      initMap({ lat: latitude, lng: longitude });
    },
    err => {
      console.error('Geolocation error:', err);
      statusDiv.textContent = 'Unable to retrieve location.';
    }
  );
}

function initMap(center) {
  console.log('initMap center:', center);
  map = new google.maps.Map(document.getElementById('map'), {
    center,
    zoom: 15,
  });

  service = new google.maps.places.PlacesService(map);

  // Perform the nearby search with a callback that handles status
  service.nearbySearch(
    {
      location: center,
      radius: 1000,
      type: ['bar'],
    },
    (results, status) => {
      console.log('PlacesService status:', status, 'results:', results);
      if (status !== google.maps.places.PlacesServiceStatus.OK) {
        statusDiv.textContent = `Places API error: ${status}`;
        return;
      }
      handleResults(results);
    }
  );
}

function handleResults(results) {
  barList.innerHTML = '';
  if (!results || results.length === 0) {
    statusDiv.textContent = 'No bars found nearby.';
    return;
  }

  results.forEach(place => {
    // Marker
    new google.maps.Marker({
      map,
      position: place.geometry.location,
      title: place.name
    });

    // List item
    const li = document.createElement('li');
    li.innerHTML = `
      <strong>${place.name}</strong>
      ${place.vicinity || 'Address N/A'}<br/>
      Rating: ${place.rating || 'N/A'}
    `;
    barList.appendChild(li);
  });
}
