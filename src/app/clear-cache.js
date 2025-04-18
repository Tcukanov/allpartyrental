// Simple script to clear browser cache
// Run this in your browser console

(function clearBrowserCache() {
  if ('caches' in window) {
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        return caches.delete(key);
      }));
    });
    console.log('Cache cleared. You might need to reload the page.');
  } else {
    console.log('Cache API not available in this browser.');
  }
})();

// Alternatively, for Next.js specific cache:
// Try hard reloading your browser with Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
// Or append ?refresh=true to your URL 