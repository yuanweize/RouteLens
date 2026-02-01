import React from 'react';
import { Layout, Menu, Typography, Space, Switch, Button } from 'antd';
import {
  DashboardOutlined,
  DeploymentUnitOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  LogoutOutlined,
  MoonOutlined,
  SunOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
  isDark: boolean;
  onToggleTheme: () => void;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, isDark, onToggleTheme }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const onLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/targets', icon: <DeploymentUnitOutlined />, label: 'Targets' },
    { key: '/settings', icon: <SettingOutlined />, label: 'Settings' },
    { key: '/about', icon: <InfoCircleOutlined />, label: 'About' },
  ];

  return (
    <Layout className="app-shell">
      <Sider theme={isDark ? 'dark' : 'light'} width={220}>
        <div style={{ padding: 20 }}>
          <Typography.Title level={4} style={{ margin: 0, color: isDark ? '#fff' : '#111' }}>
            RouteLens
          </Typography.Title>
          <Typography.Text type="secondary">v1.1.0</Typography.Text>
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
            <Typography.Title level={5} style={{ margin: 0 }}>RouteLens Console</Typography.Title>
            <div className="header-actions">
              <Space>
                <Switch
                  checked={isDark}
                  onChange={onToggleTheme}
                  checkedChildren={<MoonOutlined />}
                  unCheckedChildren={<SunOutlined />}
                />
                <Button icon={<LogoutOutlined />} onClick={onLogout}>Logout</Button>
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
