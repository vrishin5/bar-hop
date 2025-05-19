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
  map = new google.maps.Map(
    document.getElementById('map'),
    { center, zoom: 15 }
  );
  service = new google.maps.places.PlacesService(map);

  const request = { location: center, radius: 1000, type: ['bar'] };

  searchNearby(request)
    .then(results => {
      if (results.length === 0) {
        statusDiv.textContent = 'No bars found nearby.';
      } else {
        handleResults(results);
      }
    })
    .catch(err => {
      console.error('Places search error:', err);
      statusDiv.textContent = `Places API error: ${err.message}`;
    });
}

/**
 * Wraps service.nearbySearch in your own Promise so you catch everything.
 */
function searchNearby(request) {
  return new Promise((resolve, reject) => {
    try {
      service.nearbySearch(request, (results, status) => {
        console.log('PlacesService status:', status, 'results:', results);
        if (status !== google.maps.places.PlacesServiceStatus.OK) {
          reject(new Error(status));
        } else {
          resolve(results);
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}

function handleResults(results) {
  // clear out old items
  barList.innerHTML = '';

  results.forEach(place => {
    // add a marker
    new google.maps.Marker({
      map,
      position: place.geometry.location,
      title:    place.name,
    });

    // add to list
    const li = document.createElement('li');
    li.innerHTML = `
      <strong>${place.name}</strong><br/>
      ${place.vicinity || 'Address N/A'}<br/>
      Rating: ${place.rating ?? 'N/A'}
    `;
    barList.appendChild(li);
  });
}
