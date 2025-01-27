// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function() {
  // Get UI elements
  const toggleButton = document.querySelector('.toggle-button');
  const buttonText = toggleButton?.querySelector('.button-text');
  const popup = document.querySelector('.popup');
  const closeButton = document.querySelector('.close-button');
  const loadingIndicator = document.querySelector('.loading-indicator');
  const defaultDescription = document.querySelector('.description.default-state');
  const activeDescription = document.querySelector('.description.active-state');
  
  // Initialize storage
  chrome.storage.local.get(['roasterEnabled'], function(result) {
    const isEnabled = result.roasterEnabled || false;
    updateUI(isEnabled);
  });
  
  // Add event listeners
  toggleButton?.addEventListener('click', handleToggle);
  closeButton?.addEventListener('click', () => window.close());
  
  function handleToggle() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (!tabs[0]?.url?.includes('linkedin.com')) {
        const message = document.createElement('div');
        message.className = 'error-message';
        message.textContent = 'Please open LinkedIn to use this extension';
        popup.appendChild(message);
        setTimeout(() => message.remove(), 3000);
        return;
      }

      chrome.storage.local.get(['roasterEnabled'], function(result) {
        const newState = !result.roasterEnabled;
        chrome.storage.local.set({ roasterEnabled: newState }, function() {
          updateUI(newState);
          chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleRoaster', enabled: newState });
        });
      });
    });
  }
  
  function updateUI(isEnabled) {
    if (!buttonText || !popup) return;
    
    buttonText.textContent = isEnabled ? 'Enough for today' : 'Start Cooking';
    popup.classList.toggle('active', isEnabled);
    toggleButton?.classList.toggle('active', isEnabled);
    
    if (defaultDescription) {
      defaultDescription.style.display = isEnabled ? 'none' : 'block';
    }
    if (activeDescription) {
      activeDescription.style.display = isEnabled ? 'flex' : 'none';
    }
  }
  
  function showLoading(show) {
    if (!loadingIndicator || !toggleButton) return;
    loadingIndicator.style.display = show ? 'flex' : 'none';
    toggleButton.style.display = show ? 'none' : 'block';
  }

  // Simple error message styles
  const style = document.createElement('style');
  style.textContent = `
    .error-message {
      background: #FEE2E2;
      color: #991B1B;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      margin-top: 8px;
      text-align: center;
      animation: fadeIn 0.3s ease-out;
    }
    
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  document.head.appendChild(style);
}); 