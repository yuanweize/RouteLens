import React, { useEffect, useState } from 'react';
import { Layout, Menu, Typography, Space, Switch, Button, Alert, Modal, Progress, message } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  SettingOutlined,
  LogoutOutlined,
  MoonOutlined,
  SunOutlined,
  CloudDownloadOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { checkUpdate, performUpdate, getSystemInfo, type UpdateCheckResult, type SystemInfo } from '../api';

const { Header, Sider, Content, Footer } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
  isDark: boolean;
  onToggleTheme: () => void;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, isDark, onToggleTheme }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // System info & update state
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [bannerDismissed, setBannerDismissed] = useState(false);

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

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/logs', icon: <FileTextOutlined />, label: 'System Logs' },
    { key: '/settings', icon: <SettingOutlined />, label: 'Settings' },
  ];

  return (
    <Layout className="app-shell">
      <Sider theme={isDark ? 'dark' : 'light'} width={220}>
        <div style={{ padding: 20 }}>
          <Typography.Title level={4} style={{ margin: 0, color: isDark ? '#fff' : '#111' }}>
            RouteLens
          </Typography.Title>
          <Typography.Text type="secondary">
            {systemInfo?.version || 'Loading...'}
          </Typography.Text>
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
        
        <Footer style={{ textAlign: 'center' }}>
          RouteLens ©2026 - Network Monitoring Tool
        </Footer>
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
