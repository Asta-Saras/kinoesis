import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes/router';
import { useAuthStore } from './stores/authStore';

function App() {
  // Validate the cached user against the server session once on load
  // (e.g. cookie expired or user deleted). Network errors keep the cache.
  useEffect(() => {
    if (useAuthStore.getState().user) useAuthStore.getState().refresh().catch(() => {});
  }, []);

  return <RouterProvider router={router} />;
}

export default App;
