import React, { useEffect, useMemo, useState } from 'react';
import { ConfigProvider, theme } from 'antd';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { checkNeedSetup } from './api';
import AppLayout from './components/AppLayout';
import { ThemeProvider } from './context/ThemeContext';
import Setup from './pages/Setup';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Targets from './pages/Targets';
import Settings from './pages/Settings';
import About from './pages/About';
import Logs from './pages/Logs';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const [isDark, setIsDark] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(media.matches);
    const listener = (event: MediaQueryListEvent) => setIsDark(event.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  // Sync theme to HTML attribute for CSS selectors
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

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

  const themeConfig = useMemo(() => ({
    algorithm,
    token: {
      colorPrimary: '#3b82f6',
      borderRadius: 8,
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      colorBgContainer: isDark ? '#1e293b' : '#ffffff',
      colorBgLayout: isDark ? '#0f172a' : '#f8fafc',
    },
  }), [algorithm, isDark]);

  // Determine Ant Design locale based on i18n language
  const antdLocale = useMemo(() => {
    const lang = i18n.language;
    if (lang === 'zh-CN' || lang === 'zh') return zhCN;
    return enUS;
  }, [i18n.language]);

  if (checking) return null;

  const toggleTheme = () => setIsDark((prev) => !prev);

  return (
    <ConfigProvider theme={themeConfig} locale={antdLocale}>
      <ThemeProvider isDark={isDark} toggle={toggleTheme}>
        <Routes>
          <Route path="/setup" element={<Setup />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout isDark={isDark} onToggleTheme={toggleTheme}>
                  <Routes>
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="targets" element={<Targets />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="logs" element={<Logs />} />
                    <Route path="about" element={<About />} />
                    <Route path="" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </AppLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </ThemeProvider>
    </ConfigProvider>
  );
};

export default App;
