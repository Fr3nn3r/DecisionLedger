import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { SpacemanThemeProvider, ThemeAnimationType } from '@space-man/react-theme-animation';
import { AppProvider } from '@/context/AppContext';
import { ToastProvider } from '@/components/shared/Toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <SpacemanThemeProvider
        defaultTheme="system"
        defaultColorTheme="northern-lights"
        themes={['light', 'dark', 'system']}
        colorThemes={['northern-lights', 'default', 'pink']}
        animationType={ThemeAnimationType.CIRCLE}
        duration={500}
      >
        <AppProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AppProvider>
      </SpacemanThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
