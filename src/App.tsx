
import { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from '@/contexts/AuthContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { BrandingProvider } from '@/contexts/BrandingContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from '@/components/ui/toaster';
import { SecurityProvider } from '@/components/security/SecurityProvider';
import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/Login';
import Settings from '@/pages/Settings';
import Register from '@/pages/Register';
import Loading from '@/components/Loading';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrandingProvider>
            <CurrencyProvider>
              <SecurityProvider>
                <Router>
                  <div className="App">
                    <Suspense fallback={<Loading />}>
                      <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/" element={<Dashboard />} />
                      </Routes>
                    </Suspense>
                    <Toaster />
                  </div>
                </Router>
              </SecurityProvider>
            </CurrencyProvider>
          </BrandingProvider>
        </AuthProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
