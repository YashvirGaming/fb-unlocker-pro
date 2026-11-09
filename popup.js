const toggle = document.getElementById('toggle-enabled');
const statusText = document.getElementById('status-text');

function updateUI(enabled) {
  toggle.checked = enabled;
  if (enabled) {
    statusText.textContent = '● Active on Facebook';
    statusText.classList.remove('off');
  } else {
    statusText.textContent = '○ Paused';
    statusText.classList.add('off');
  }
}

chrome.storage.local.get({ fbUnlockerEnabled: true }, (data) => {
  updateUI(data.fbUnlockerEnabled);
});

toggle.addEventListener('change', () => {
  const enabled = toggle.checked;
  chrome.storage.local.set({ fbUnlockerEnabled: enabled }, () => {
    updateUI(enabled);
  });
});
