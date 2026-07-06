import { createBrowserRouter } from 'react-router-dom';

import { AdminLayout } from './layouts/admin-layout';
import { DashboardLayout } from './layouts/dashboard-layout';
import { PublicLayout } from './layouts/public-layout';
import { AdminLoginPage } from './pages/admin-login-page';
import { AdminPage } from './pages/admin-page';
import { ChatPage } from './pages/chat-page';
import { DashboardPage } from './pages/dashboard-page';
import { HomePage } from './pages/home-page';
import { NotFoundPage } from './pages/not-found-page';
import { PrivacyPage } from './pages/privacy-page';
import { TermsPage } from './pages/terms-page';

export const router = createBrowserRouter([
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
      { index: true, element: <DashboardPage /> },
      { path: 'chat/:threadId', element: <ChatPage /> },
    ],
  },
  {
    path: '/admin',
    children: [
      { path: 'login', element: <AdminLoginPage /> },
      {
        element: <AdminLayout />,
        children: [{ index: true, element: <AdminPage /> }],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
