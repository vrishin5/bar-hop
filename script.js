const statusDiv = document.getElementById('status');
const barList   = document.getElementById('bar-list');
let map, service;

window.addEventListener('load', init);

function init() {
  // Check if geolocation is supported
  if (!navigator.geolocation) {
    statusDiv.textContent = 'Geolocation not supported by your browser.';
    return;
  }

  // Update status while waiting for location
  statusDiv.textContent = 'Requesting your location...';

  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude, longitude } = pos.coords;
      statusDiv.textContent = `You're at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

      // Create location object for Google Maps
      const center = new google.maps.LatLng(latitude, longitude);
      console.log('Geolocation center:', center.toString());

      // Initialize map with location
      initMap(center);
    },
    err => {
      // Handle geolocation errors with more descriptive messages
      let errorMsg = 'Unable to retrieve location: ';
      
      switch(err.code) {
        case err.PERMISSION_DENIED:
          errorMsg += 'Location access was denied. Please allow location access.';
          break;
        case err.POSITION_UNAVAILABLE:
          errorMsg += 'Location information is unavailable.';
          break;
        case err.TIMEOUT:
          errorMsg += 'Request to get location timed out.';
          break;
        default:
          errorMsg += `Error: ${err.message}`;
      }
      
      console.error('Geolocation error:', err);
      statusDiv.textContent = errorMsg;
    },
    {
      // Options for getCurrentPosition
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

function initMap(center) {
  // Create map instance
  try {
    map = new google.maps.Map(
      document.getElementById('map'),
      { 
        center, 
        zoom: 15,
        mapTypeControl: true,
        fullscreenControl: true
      }
    );
    
    // Create a marker for user's location
    new google.maps.Marker({
      position: center,
      map: map,
      title: "Your Location",
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: "#4285F4",
        fillOpacity: 0.8,
        strokeWeight: 1,
        strokeColor: "#FFFFFF"
      }
    });
    
    // Initialize Places service
    service = new google.maps.places.PlacesService(map);

    // Set up the search request
    const request = {
      location: center,
      radius: 1000,       // 1000 meters = 1km
      type: ['bar'],      // Search for bars
      rankBy: google.maps.places.RankBy.PROMINENCE
    };

    statusDiv.textContent = 'Searching for bars nearby...';
    
    console.log('🚀 nearbySearch request:', {
      location: request.location.toString(),
      radius: request.radius,
      type: request.type
    });

    // Execute the search
    searchNearby(request)
      .then(results => {
        console.log('✅ Number of results:', results.length);
        console.log('First few results:', results.slice(0, 3));
        
        if (results.length === 0) {
          statusDiv.textContent = 'No bars found within 1 km. Try expanding the search radius.';
        } else {
          statusDiv.textContent = `Found ${results.length} bars nearby.`;
          handleResults(results);
        }
      })
      .catch(err => {
        console.error('❌ Places search error:', err);
        statusDiv.textContent = `Error searching for places: ${err.message}`;
      });
      
  } catch (err) {
    console.error('Map initialization error:', err);
    statusDiv.textContent = `Error initializing map: ${err.message}`;
  }
}

function searchNearby(request) {
  return new Promise((resolve, reject) => {
    try {
      // Check if service is properly initialized
      if (!service) {
        return reject(new Error('Places service not initialized'));
      }
      
      // Make the API call
      service.nearbySearch(request, (results, status, pagination) => {
        console.log('⏳ PlacesService callback status:', status);
        
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          resolve(results);
        } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          resolve([]); // Return empty array instead of error for zero results
        } else {
          // Handle other error statuses
          reject(new Error(status));
        }
      });
      
    } catch (syncErr) {
      console.error('Synchronous error in searchNearby:', syncErr);
      reject(syncErr);
    }
  });
}

function handleResults(results) {
  barList.innerHTML = '';

  // Sort results by rating (highest first)
  const sortedResults = [...results].sort((a, b) => {
    // Handle missing ratings (null/undefined)
    const ratingA = a.rating || 0;
    const ratingB = b.rating || 0;
    return ratingB - ratingA;
  });

  sortedResults.forEach(place => {
    // Add marker for each place
    const marker = new google.maps.Marker({
      map,
      position: place.geometry.location,
      title: place.name,
      animation: google.maps.Animation.DROP
    });
    
    // Create info window for marker
    const infoContent = `
      <div style="max-width: 200px; padding: 5px;">
        <h3>${place.name}</h3>
        <p>${place.vicinity || 'Address N/A'}</p>
        <p>Rating: ${place.rating ? `${place.rating}/5 (${place.user_ratings_total || 0} reviews)` : 'N/A'}</p>
      </div>
    `;
    
    const infoWindow = new google.maps.InfoWindow({
      content: infoContent
    });
    
    // Add click listener to open info window
    marker.addListener('click', () => {
      infoWindow.open(map, marker);
    });

    // Create list item for sidebar
    const li = document.createElement('li');
    
    // Add a click event to the list item to center the map on the bar
    li.addEventListener('click', () => {
      map.setCenter(place.geometry.location);
      map.setZoom(17);
      infoWindow.open(map, marker);
    });
    
    // Build the list item content
    li.innerHTML = `
      <strong>${place.name}</strong>
      <div class="address">${place.vicinity || 'Address N/A'}</div>
      <div class="rating">
        ${getRatingStars(place.rating)}
        ${place.rating ? `<span>${place.rating.toFixed(1)}</span>` : 'No rating'}
      </div>
      ${place.price_level ? `<div class="price">${'$'.repeat(place.price_level)}</div>` : ''}
      ${place.opening_hours?.open_now ? '<div class="open">Open now</div>' : ''}
    `;
    
    barList.appendChild(li);
  });
}

// Helper function to display rating as stars
function getRatingStars(rating) {
  if (!rating) return '';
  
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  
  return (
    '★'.repeat(fullStars) + 
    (halfStar ? '½' : '') + 
    '☆'.repeat(emptyStars)
  );
}
