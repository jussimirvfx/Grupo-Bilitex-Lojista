import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { configureMetaPixel, MetaPixelProvider } from 'scoretrack';
import { MetaScrollTracking } from './components/MetaScrollTracking';

configureMetaPixel({
  PIXEL_ID: import.meta.env.VITE_META_PIXEL_ID || '2080143396195017',
  // scoretrack 1.0.0 exige um valor mesmo usando a rota local. Não é uma credencial.
  ACCESS_TOKEN: 'server-managed',
  VERBOSE: import.meta.env.DEV,
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MetaPixelProvider><App /><MetaScrollTracking /></MetaPixelProvider>
  </StrictMode>,
);
