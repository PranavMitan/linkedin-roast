// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function() {
  // Get reference to our toggle button
  const toggleButton = document.getElementById('toggleRoaster');
  const statusDiv = document.getElementById('status');
  
  // Initialize storage if needed
  chrome.storage.local.get(['roasterEnabled'], function(result) {
    const isEnabled = result.roasterEnabled || false;
    updateUI(isEnabled);
  });

  // Add click handler to toggle button
  toggleButton.addEventListener('click', function() {
    chrome.storage.local.get(['roasterEnabled'], function(result) {
      const newState = !result.roasterEnabled;
      chrome.storage.local.set({ roasterEnabled: newState }, function() {
        updateUI(newState);
      });
    });
  });

  function updateUI(isEnabled) {
    toggleButton.textContent = isEnabled ? 'Disable Roaster' : 'Enable Roaster';
    statusDiv.textContent = isEnabled ? 'Roaster is active! 🔥' : 'Roaster is disabled 😴';
    toggleButton.className = isEnabled ? 'active' : '';
  }
}); 