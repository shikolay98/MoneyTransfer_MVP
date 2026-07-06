import { RouterProvider } from 'react-router-dom';

import { AuthProvider } from './lib/auth-context';
import { BootstrapProvider } from './lib/bootstrap-context';
import { ToastProvider } from './lib/toast-context';
import { router } from './router';

export const App = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <BootstrapProvider>
          <RouterProvider router={router} />
        </BootstrapProvider>
      </AuthProvider>
    </ToastProvider>
  );
};
