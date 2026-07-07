import { Outlet } from 'react-router-dom';

import { ScrollManager } from '../components/scroll-manager';

export const RootLayout = () => (
  <>
    <ScrollManager />
    <Outlet />
  </>
);
