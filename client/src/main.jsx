import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { store, persistor } from './redux/store.js';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import ThemeProvider from './components/ThemeProvider.jsx';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClientProvider } from '@tanstack/react-query'; // 1. Import
import { queryClient } from './lib/queryClient.js';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <Provider store={store}>
            <PersistGate persistor={persistor}>
                <QueryClientProvider client={queryClient}>
                    <HelmetProvider>
                        <ThemeProvider>
                            <App />
                        </ThemeProvider>
                    </HelmetProvider>
                </QueryClientProvider>
            </PersistGate>
        </Provider>
    </React.StrictMode>
);
