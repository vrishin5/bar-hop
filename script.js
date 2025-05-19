const statusDiv = document.getElementById('location-status');
const barList = document.getElementById('bar-list');

navigator.geolocation.getCurrentPosition(async (position) => {
  const { latitude, longitude } = position.coords;
  statusDiv.textContent = `Your location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

  // You’ll later replace this with a real API call
  const dummyBars = [
    { name: "Club Midnight", distance: "0.5 mi" },
    { name: "The Tipsy Turtle", distance: "0.8 mi" },
  ];

  dummyBars.forEach(bar => {
    const li = document.createElement('li');
    li.textContent = `${bar.name} - ${bar.distance}`;
    barList.appendChild(li);
  });

}, () => {
  statusDiv.textContent = "Failed to get your location.";
});
