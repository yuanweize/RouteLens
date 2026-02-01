import React, { useEffect, useState } from 'react';
import { Layout, Menu, Button, Space, Typography, Select, Avatar, Dropdown, ConfigProvider, Alert, Modal, Progress, Message } from '@arco-design/web-react';
import { IconDashboard, IconSettings, IconMoonFill, IconSunFill, IconPublic, IconUser, IconRefresh } from '@arco-design/web-react/icon';
import { useNavigate, useLocation } from 'react-router-dom';
import '@arco-design/web-react/dist/css/arco.css';
import { AppContextProvider, useAppContext } from '../utils/appContext';
import { checkUpdate, performUpdate, type UpdateCheckResult } from '../api';

const { Header, Footer, Sider, Content } = Layout;
const MenuItem = Menu.Item;

const AppLayoutInner: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isDark, setIsDark, targets, selectedTarget, setSelectedTarget, refreshTargets } = useAppContext();
    
    // Update state
    const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
    const [updating, setUpdating] = useState(false);
    const [updateProgress, setUpdateProgress] = useState(0);

    // Check for updates on mount
    useEffect(() => {
        const doCheckUpdate = async () => {
            try {
                const result = await checkUpdate();
                if (result && result.has_update) {
                    setUpdateInfo(result);
                }
            } catch (e) {
                console.error('Failed to check for updates:', e);
            }
        };
        doCheckUpdate();
    }, []);

    const handleUpdate = async () => {
        setUpdating(true);
        setUpdateProgress(0);
        
        // Simulate progress (actual download is server-side)
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
                Message.success('Update successful! Restarting service...');
                // Wait for service to restart, then reload
                setTimeout(() => {
                    window.location.reload();
                }, 3000);
            } else {
                Message.info(result.message || 'No update available');
                setUpdating(false);
            }
        } catch (e: any) {
            clearInterval(progressInterval);
            Message.error(e?.message || 'Update failed');
            setUpdating(false);
        }
    };

    useEffect(() => {
        const stored = localStorage.getItem('theme');
        if (stored) {
            setIsDark(stored === 'dark');
        } else {
            const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            setIsDark(darkModeMediaQuery.matches);
            const listener = (e: MediaQueryListEvent) => setIsDark(e.matches);
            darkModeMediaQuery.addEventListener('change', listener);
            return () => darkModeMediaQuery.removeEventListener('change', listener);
        }
    }, [setIsDark]);

    useEffect(() => {
        refreshTargets();
    }, [refreshTargets]);

    useEffect(() => {
        if (isDark) {
            document.body.setAttribute('arco-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.removeAttribute('arco-theme');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    const toggleTheme = () => setIsDark(!isDark);

    return (
        <ConfigProvider theme={isDark ? { theme: 'dark' } : undefined}>
            <Layout className="layout-container" style={{ minHeight: '100vh' }}>
                <Sider
                    breakpoint="lg"
                    onBreakpoint={() => { }}
                    collapsible
                    theme={isDark ? 'dark' : 'light'}
                >
                    <div className="logo" style={{ height: 40, margin: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IconPublic style={{ fontSize: 20, marginRight: 8, color: '#165dff' }} />
                        <Typography.Text bold style={{ color: isDark ? '#fff' : '#000' }}>RouteLens</Typography.Text>
                    </div>
                    <Menu
                        selectedKeys={[location.pathname]}
                        onClickMenuItem={(key) => navigate(key)}
                        style={{ width: '100%' }}
                    >
                        <MenuItem key="/dashboard">
                            <IconDashboard /> Dashboard
                        </MenuItem>
                        <MenuItem key="/targets">
                            <IconPublic /> Targets
                        </MenuItem>
                        <MenuItem key="/settings">
                            <IconSettings /> Settings
                        </MenuItem>
                    </Menu>
                </Sider>
                <Layout>
                    <Header
                        style={{
                            padding: '0 20px',
                            background: isDark ? '#17171a' : '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottom: '1px solid var(--color-border)'
                        }}
                    >
                        <Space size="large">
                            <Typography.Title heading={5} style={{ margin: 0 }}>RouteLens</Typography.Title>
                            <Select
                                placeholder='Select Target'
                                style={{ width: 260 }}
                                value={selectedTarget}
                                onChange={setSelectedTarget}
                            >
                                {targets.map(t => (
                                    <Select.Option key={t.address} value={t.address}>
                                        {t.name} ({t.address})
                                    </Select.Option>
                                ))}
                            </Select>
                        </Space>
                        <Space>
                            <Button
                                shape="circle"
                                type="secondary"
                                icon={isDark ? <IconSunFill /> : <IconMoonFill />}
                                onClick={toggleTheme}
                            />
                            <Dropdown
                                droplist={
                                    <Menu>
                                        <MenuItem key="profile">Profile</MenuItem>
                                        <MenuItem key="logout">Logout</MenuItem>
                                    </Menu>
                                }
                            >
                                <Avatar size={32} style={{ backgroundColor: '#165dff' }}>
                                    <IconUser />
                                </Avatar>
                            </Dropdown>
                        </Space>
                    </Header>
                    
                    {/* Update Banner */}
                    {updateInfo && updateInfo.has_update && (
                        <Alert
                            type="info"
                            banner
                            closable
                            icon={<IconRefresh />}
                            content={
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
                            onClose={() => setUpdateInfo(null)}
                        />
                    )}
                    
                    {/* Update Modal */}
                    <Modal
                        title="Updating RouteLens"
                        visible={updating}
                        footer={null}
                        closable={false}
                        maskClosable={false}
                    >
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <Progress 
                                percent={Math.round(updateProgress)} 
                                status={updateProgress >= 100 ? 'success' : 'normal'}
                                animation
                            />
                            <Typography.Text style={{ marginTop: 16, display: 'block' }}>
                                {updateProgress >= 100 
                                    ? 'Update complete! Restarting service...' 
                                    : 'Downloading and installing update...'}
                            </Typography.Text>
                        </div>
                    </Modal>
                    
                    <Content style={{ padding: '24px', background: 'var(--color-fill-1)' }}>
                        {children}
                    </Content>
                    <Footer style={{ textAlign: 'center', padding: 20, background: 'var(--color-bg-1)' }}>
                        RouteLens ©2026 Admin Panel
                    </Footer>
                </Layout>
            </Layout>
        </ConfigProvider>
    );
};

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AppContextProvider>
        <AppLayoutInner>{children}</AppLayoutInner>
    </AppContextProvider>
);

export default AppLayout;
