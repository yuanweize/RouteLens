import React from 'react';
import { Layout, Menu, Typography, Space, Switch, Button, Dropdown } from 'antd';
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
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

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

  const languageMenu = {
    items: [
      { key: 'en', label: '🇺🇸 English' },
      { key: 'zh-CN', label: '🇨🇳 中文' },
    ],
    onClick: ({ key }: { key: string }) => changeLanguage(key),
  };

  return (
    <Layout className="app-shell">
      <Sider theme={isDark ? 'dark' : 'light'} width={220}>
        <div style={{ padding: 20 }}>
          <Typography.Title level={4} style={{ margin: 0, color: isDark ? '#fff' : '#111' }}>
            {t('common.appName')}
          </Typography.Title>
          <Typography.Text type="secondary">{t('common.version')}</Typography.Text>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={(item) => navigate(item.key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: 'transparent', padding: '0 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
            <Typography.Title level={5} style={{ margin: 0 }}>{t('dashboard.console')}</Typography.Title>
            <div className="header-actions">
              <Space>
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
                <Button icon={<LogoutOutlined />} onClick={onLogout}>{t('common.logout')}</Button>
              </Space>
            </div>
          </div>
        </Header>
        <Content className="content-wrapper">{children}</Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
