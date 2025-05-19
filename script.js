const statusDiv = document.getElementById('status');
const barList   = document.getElementById('bar-list');
let map, service;

window.addEventListener('load', init);

function init() {
  if (!navigator.geolocation) {
    statusDiv.textContent = 'Geolocation not supported.';
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude, longitude } = pos.coords;
      statusDiv.textContent =
        `You’re at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

      // Wrap in LatLng object to guarantee valid type
      const center = new google.maps.LatLng(latitude, longitude);
      console.log('Geolocation center:', center.toString());

      initMap(center);
    },
    err => {
      console.error('Geolocation error:', err);
      statusDiv.textContent = 'Unable to retrieve location.';
    }
  );
}

function initMap(center) {
  map = new google.maps.Map(
    document.getElementById('map'),
    { center, zoom: 15 }
  );
  service = new google.maps.places.PlacesService(map);

  const request = {
    location: center,
    radius:   1000,       // meters
    type:     ['bar'],    // must be an array of valid place types
  };

  console.log('🚀 nearbySearch request:', {
    location: request.location.toString(),
    radius:   request.radius,
    type:     request.type
  });

  searchNearby(request)
    .then(results => {
      console.log('✅ nearbySearch results count:', results.length);
      if (results.length === 0) {
        statusDiv.textContent = 'No bars found within 1 km.';
      } else {
        handleResults(results);
      }
    })
    .catch(err => {
      console.error('❌ Places search error:', err);
      // Display the *exact* error message from Google
      statusDiv.textContent = `Places API error: ${err.message}`;
    });
}

function searchNearby(request) {
  return new Promise((resolve, reject) => {
    try {
      const maybePromise = service.nearbySearch(request, (results, status) => {
        console.log('⏳ PlacesService callback status:', status);
        if (status !== google.maps.places.PlacesServiceStatus.OK) {
          // Reject with the status string so you know exactly which one it is
          return reject(new Error(status));
        }
        resolve(results);
      });

      // If the library returns a Promise internally, catch that too
      if (maybePromise && typeof maybePromise.catch === 'function') {
        maybePromise.catch(innerErr => {
          reject(innerErr);
        });
      }
    } catch (syncErr) {
      reject(syncErr);
    }
  });
}

function handleResults(results) {
  barList.innerHTML = '';

  results.forEach(place => {
    new google.maps.Marker({
      map,
      position: place.geometry.location,
      title:    place.name,
    });

    const li = document.createElement('li');
    li.innerHTML = `
      <strong>${place.name}</strong><br/>
      ${place.vicinity || 'Address N/A'}<br/>
      Rating: ${place.rating ?? 'N/A'}
    `;
    barList.appendChild(li);
  });
}
