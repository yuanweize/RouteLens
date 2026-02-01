import React, { useEffect, useMemo, useState } from 'react';
import { ConfigProvider, theme } from 'antd';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { checkNeedSetup } from './api';
import AppLayout from './components/AppLayout';
import { ThemeProvider } from './context/ThemeContext';
import Setup from './pages/Setup';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Targets from './pages/Targets';
import Settings from './pages/Settings';
import About from './pages/About';

const App: React.FC = () => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(media.matches);
    const listener = (event: MediaQueryListEvent) => setIsDark(event.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await checkNeedSetup();
        if (res.need_setup && window.location.pathname !== '/setup') {
          navigate('/setup');
        }
      } catch (error) {
        console.error(error);
      } finally {
        setChecking(false);
      }
    };
    run();
  }, [navigate]);

  const algorithm = useMemo(() => (isDark ? theme.darkAlgorithm : theme.defaultAlgorithm), [isDark]);

  if (checking) return null;

  const toggleTheme = () => setIsDark((prev) => !prev);

  return (
    <ConfigProvider theme={{ algorithm }}>
      <ThemeProvider isDark={isDark} toggle={toggleTheme}>
        <Routes>
          <Route path="/setup" element={<Setup />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <AppLayout isDark={isDark} onToggleTheme={toggleTheme}>
                <Routes>
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="targets" element={<Targets />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="about" element={<About />} />
                  <Route path="" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </AppLayout>
            }
          />
        </Routes>
      </ThemeProvider>
    </ConfigProvider>
  );
};

export default App;
