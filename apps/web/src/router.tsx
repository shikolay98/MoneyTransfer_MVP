import { createBrowserRouter } from 'react-router-dom';

import { AdminLayout } from './layouts/admin-layout';
import { DashboardLayout } from './layouts/dashboard-layout';
import { PublicLayout } from './layouts/public-layout';
import { RootLayout } from './layouts/root-layout';
import { HomePage } from './pages/home-page';
import { NotFoundPage } from './pages/not-found-page';
import { PrivacyPage } from './pages/privacy-page';
import { TermsPage } from './pages/terms-page';

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: '/',
        element: <PublicLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'privacy', element: <PrivacyPage /> },
          { path: 'terms', element: <TermsPage /> },
        ],
      },
      {
        path: '/dashboard',
        element: <DashboardLayout />,
        children: [
          {
            index: true,
            lazy: () =>
              import('./pages/dashboard-page').then((m) => ({ Component: m.DashboardPage })),
          },
          {
            path: 'chat/:threadId',
            lazy: () => import('./pages/chat-page').then((m) => ({ Component: m.ChatPage })),
          },
        ],
      },
      {
        path: '/admin',
        children: [
          {
            path: 'login',
            lazy: () =>
              import('./pages/admin-login-page').then((m) => ({ Component: m.AdminLoginPage })),
          },
          {
            element: <AdminLayout />,
            children: [
              {
                index: true,
                lazy: () => import('./pages/admin-page').then((m) => ({ Component: m.AdminPage })),
              },
            ],
          },
        ],
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
