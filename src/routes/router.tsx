import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute, RootRedirect } from './guards';
import { AuthPage } from '../features/auth/AuthPage';
import { AppShell } from '../layouts/AppShell';
import { HomePage } from '../features/home/HomePage';
import { PageLoader } from '../components/ui/PageLoader';

// The editor pulls in Monaco + React Flow — load it only when needed.
const EditorPage = lazy(() => import('../features/editor/EditorPage').then((m) => ({ default: m.EditorPage })));


export const router = createBrowserRouter([
  { path: '/', element: <RootRedirect /> },
  { path: '/auth', element: <AuthPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [{ path: '/home', element: <HomePage /> }],
      },
      // Full-screen tools live outside the shell.
      {
        path: '/editor',
        element: (
          <Suspense fallback={<PageLoader />}>
            <EditorPage />
          </Suspense>
        ),
      },
    ],
  },
  { path: '*', element: <RootRedirect /> },
]);
