const statusDiv = document.getElementById('status');
const barList   = document.getElementById('bar-list');
let map, service;

// 1. Get user location
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
    () => {
      statusDiv.textContent = 'Unable to retrieve location.';
    }
  );
}

// 2. Initialize map and PlacesService
function initMap(center) {
  map = new google.maps.Map(document.getElementById('map'), {
    center,
    zoom: 15,
  });

  service = new google.maps.places.PlacesService(map);

  // 3. Search for nearby bars
  service.nearbySearch(
    {
      location: center,
      radius: 1000,
      type: ['bar'],
    },
    handleResults
  );
}

// 4. Handle the API results
function handleResults(results, status) {
  if (status !== google.maps.places.PlacesServiceStatus.OK) {
    statusDiv.textContent = 'Failed to fetch nearby bars.';
    return;
  }

  // clear previous list
  barList.innerHTML = '';

  results.forEach(place => {
    // add marker
    new google.maps.Marker({
      map,
      position: place.geometry.location,
      title: place.name
    });

    // add to list
    const li = document.createElement('li');
    li.innerHTML = `
      <strong>${place.name}</strong>
      ${place.vicinity || 'Address N/A'}<br/>
      Rating: ${place.rating || 'N/A'}
    `;
    barList.appendChild(li);
  });
}

// kick things off
window.addEventListener('load', init);
