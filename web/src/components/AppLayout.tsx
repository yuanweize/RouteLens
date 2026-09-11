import React, { useEffect, useState } from 'react';
import { Layout, Menu, Typography, Space, Switch, Button, Dropdown, Alert, Modal, Progress, message, Drawer } from 'antd';
import {
  DashboardOutlined,
  DeploymentUnitOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  LogoutOutlined,
  MoonOutlined,
  SunOutlined,
  FileTextOutlined,
  GlobalOutlined,
  CloudDownloadOutlined,
  MenuOutlined,
  RadarChartOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getSystemInfo, checkUpdate, performUpdate, type SystemInfo, type UpdateCheckResult } from '../api';

const { Header, Sider, Content } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
  isDark: boolean;
  onToggleTheme: () => void;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, isDark, onToggleTheme }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  
  // System info & update state
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Track window resize for responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch system info and check for updates on mount
  useEffect(() => {
    const init = async () => {
      try {
        const info = await getSystemInfo();
        setSystemInfo(info);
      } catch (e) {
        console.error('Failed to fetch system info:', e);
      }
      
      try {
        const result = await checkUpdate();
        if (result && result.has_update) {
          setUpdateInfo(result);
        }
      } catch (e) {
        console.error('Failed to check for updates:', e);
      }
    };
    init();
  }, []);

  const handleUpdate = async () => {
    setUpdating(true);
    setUpdateProgress(0);
    
    const progressInterval = setInterval(() => {
      setUpdateProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 500);

    try {
      const result = await performUpdate();
      clearInterval(progressInterval);
      setUpdateProgress(100);
      
      if (result.updated) {
        message.success('Update successful! Restarting service...');
        setTimeout(() => window.location.reload(), 3000);
      } else {
        message.info(result.message || 'No update available');
        setUpdating(false);
        setUpdateProgress(0);
      }
    } catch (e: any) {
      clearInterval(progressInterval);
      message.error(e?.message || 'Update failed');
      setUpdating(false);
      setUpdateProgress(0);
    }
  };

  const onLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: t('nav.dashboard') },
    { key: '/targets', icon: <DeploymentUnitOutlined />, label: t('nav.targets') },
    { key: '/logs', icon: <FileTextOutlined />, label: t('nav.logs') },
    { key: '/settings', icon: <SettingOutlined />, label: t('nav.settings') },
    { key: '/about', icon: <InfoCircleOutlined />, label: t('nav.about') },
  ];

  const handleMenuClick = (key: string) => {
    navigate(key);
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  };

  const languageMenu = {
    items: [
      { key: 'en', label: '🇺🇸 English' },
      { key: 'zh-CN', label: '🇨🇳 中文' },
    ],
    onClick: ({ key }: { key: string }) => changeLanguage(key),
  };

  const brandHeader = (
    <div style={{ padding: '18px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: 'linear-gradient(135deg, #1677ff 0%, #722ed1 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: 18,
        flexShrink: 0,
        boxShadow: '0 4px 12px rgba(22, 119, 255, 0.3)'
      }}>
        <RadarChartOutlined />
      </div>
      <div>
        <Typography.Title level={5} style={{ margin: 0, lineHeight: 1.2, fontWeight: 600 }}>
          {t('common.appName')}
        </Typography.Title>
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
          {systemInfo?.version ? `v${systemInfo.version}` : t('common.version')}
        </Typography.Text>
      </div>
    </div>
  );

  return (
    <Layout className="app-shell">
      {/* Desktop Sider */}
      {!isMobile && (
        <Sider 
          theme={isDark ? 'dark' : 'light'} 
          width={220}
          style={{
            borderRight: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)'
          }}
        >
          {brandHeader}
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={(item) => handleMenuClick(item.key)}
            style={{ borderRight: 0 }}
          />
        </Sider>
      )}

      {/* Mobile Drawer Navigation */}
      <Drawer
        placement="left"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        width={260}
        bodyStyle={{ padding: 0 }}
      >
        {brandHeader}
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={(item) => handleMenuClick(item.key)}
          style={{ borderRight: 0 }}
        />
      </Drawer>

      <Layout>
        <Header style={{ background: 'transparent', padding: isMobile ? '0 12px' : '0 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {isMobile && (
                <Button
                  icon={<MenuOutlined />}
                  onClick={() => setMobileDrawerOpen(true)}
                  style={{ marginRight: 4 }}
                />
              )}
              <Typography.Title level={5} style={{ margin: 0 }}>
                {t('dashboard.console')}
              </Typography.Title>
            </div>
            <div className="header-actions">
              <Space size={isMobile ? 'small' : 'middle'}>
                <Dropdown menu={languageMenu} placement="bottomRight">
                  <Button icon={<GlobalOutlined />}>
                    {i18n.language === 'zh-CN' ? '中文' : 'EN'}
                  </Button>
                </Dropdown>
                <Switch
                  checked={isDark}
                  onChange={onToggleTheme}
                  checkedChildren={<MoonOutlined />}
                  unCheckedChildren={<SunOutlined />}
                />
                <Button icon={<LogoutOutlined />} onClick={onLogout}>
                  {!isMobile && t('common.logout')}
                </Button>
              </Space>
            </div>
          </div>
        </Header>
        
        {/* Update Banner */}
        {updateInfo && updateInfo.has_update && !bannerDismissed && (
          <Alert
            type="info"
            banner
            closable
            icon={<CloudDownloadOutlined />}
            message={
              <Space>
                <span>
                  New version <strong>{updateInfo.latest_version}</strong> available! 
                  (Current: {updateInfo.current_version})
                </span>
                <Button 
                  type="primary" 
                  size="small" 
                  onClick={handleUpdate}
                  loading={updating}
                >
                  Update Now
                </Button>
              </Space>
            }
            onClose={() => setBannerDismissed(true)}
          />
        )}
        
        <Content className="content-wrapper">{children}</Content>
      </Layout>
      
      {/* Update Progress Modal */}
      <Modal
        title="Updating RouteLens"
        open={updating}
        footer={null}
        closable={false}
        maskClosable={false}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Progress 
            percent={Math.round(updateProgress)} 
            status={updateProgress >= 100 ? 'success' : 'active'}
          />
          <Typography.Text style={{ marginTop: 16, display: 'block' }}>
            {updateProgress >= 100 
              ? 'Update complete! Restarting service...' 
              : 'Downloading and installing update...'}
          </Typography.Text>
        </div>
      </Modal>
    </Layout>
  );
};

export default AppLayout;
