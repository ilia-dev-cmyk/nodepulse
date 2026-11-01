import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './app/App';
import { DemoProvider } from './store/DemoDataContext';
import { ToastProvider } from './store/ToastContext';
import './styles/tokens.css';
import './styles/global.css';
import './styles/components.css';
import './styles/layout.css';
import './styles/marketing.css';
import './styles/pages.css';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <DemoProvider>
          <App />
        </DemoProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
);
