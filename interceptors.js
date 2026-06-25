(function() {
  const originalFetch = window.fetch;
  let isRefreshing = false;
  let refreshPromise = null;

  window.fetch = async function(...args) {
    const response = await originalFetch(...args);

    const requestObj = args[0];
    const url = typeof requestObj === 'string' ? requestObj : requestObj.url;
    
    // Check if we hit a 401, but ignore if the request itself was a refresh or login/signup attempt
    if (response.status === 401 && !url.includes('/api/refresh') && !url.includes('/api/login') && !url.includes('/api/signup')) {
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = originalFetch('/api/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }).then(res => {
          isRefreshing = false;
          if (!res.ok) {
            // Silent redirect if refresh fails
            if (window.location.pathname !== '/login.html' && window.location.pathname !== '/login') {
               window.location.href = '/login.html?session_expired=true';
            }
            throw new Error('Token refresh failed');
          }
          return res;
        }).catch(err => {
          isRefreshing = false;
          throw err;
        });
      }

      try {
        await refreshPromise;
        // Token refreshed successfully, re-execute the original failed request
        // The browser will automatically send the new cookies
        return originalFetch(...args);
      } catch (e) {
        // If refresh fails, return the original 401 response
        return response;
      }
    }
    
    return response;
  };
})();
