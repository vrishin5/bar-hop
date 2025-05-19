// 1) Catch any unhandled promise rejections
window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled promise rejection:', event.reason);
  document.getElementById('status').textContent =
    `Error: ${event.reason?.message || event.reason}`;
});

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
  map = new google.maps.Map(
    document.getElementById('map'),
    { center, zoom: 15 }
  );
  service = new google.maps.places.PlacesService(map);

  const request = {
    location: center,
    radius:   1000,
    type:     ['bar'],
  };

  // 2) Wrap in try/catch for sync errors
  try {
    // 3) Get return value in case it's a Promise
    const maybePromise = service.nearbySearch(request, (results, status) => {
      console.log('PlacesService status:', status, 'results:', results);
      if (status !== google.maps.places.PlacesServiceStatus.OK) {
        statusDiv.textContent = `Places API error: ${status}`;
        return;
      }
      handleResults(results);
    });

    // 4) If it is a Promise, catch rejects here
    if (maybePromise && typeof maybePromise.catch === 'function') {
      maybePromise.catch(err => {
        console.error('Nearby search promise error:', err);
        statusDiv.textContent = 
          `Places API error: ${err.message || err}`;
      });
    }

  } catch (err) {
    console.error('Nearby search threw:', err);
    statusDiv.textContent = `Places API error: ${err.message || err}`;
  }
}

function handleResults(results) {
  barList.innerHTML = '';
  if (!results || results.length === 0) {
    statusDiv.textContent = 'No bars found nearby.';
    return;
  }

  results.forEach(place => {
    new google.maps.Marker({
      map,
      position: place.geometry.location,
      title:    place.name
    });

    const li = document.createElement('li');
    li.innerHTML = `
      <strong>${place.name}</strong><br/>
      ${place.vicinity || 'Address N/A'}<br/>
      Rating: ${place.rating || 'N/A'}
    `;
    barList.appendChild(li);
  });
}
