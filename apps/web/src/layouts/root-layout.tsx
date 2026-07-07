import { Outlet } from 'react-router-dom';

import { ScrollManager } from '../components/scroll-manager';
import { ScrollReveal } from '../components/scroll-reveal';

export const RootLayout = () => (
  <>
    <ScrollManager />
    <ScrollReveal />
    <Outlet />
  </>
);
