import React, { useEffect, useState } from 'react';
import { Layout, Menu, Button, Space, Typography } from '@arco-design/web-react';
import { IconDashboard, IconSettings, IconMoonFill, IconSunFill, IconPublic } from '@arco-design/web-react/icon';
import { useNavigate, useLocation } from 'react-router-dom';
import '@arco-design/web-react/dist/css/arco.css';

const { Header, Footer, Sider, Content } = Layout;
const MenuItem = Menu.Item;

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Init theme from system preference
        const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setIsDark(darkModeMediaQuery.matches);

        const setArcoTheme = (dark: boolean) => {
            if (dark) {
                document.body.setAttribute('arco-theme', 'dark');
            } else {
                document.body.removeAttribute('arco-theme');
            }
        };

        setArcoTheme(darkModeMediaQuery.matches);

        const listener = (e: MediaQueryListEvent) => {
            setIsDark(e.matches);
            setArcoTheme(e.matches);
        };
        darkModeMediaQuery.addEventListener('change', listener);
        return () => darkModeMediaQuery.removeEventListener('change', listener);
    }, []);

    const toggleTheme = () => {
        const next = !isDark;
        setIsDark(next);
        if (next) {
            document.body.setAttribute('arco-theme', 'dark');
        } else {
            document.body.removeAttribute('arco-theme');
        }
    };

    return (
        <Layout className="layout-container" style={{ minHeight: '100vh' }}>
            <Sider
                breakpoint="lg"
                onBreakpoint={() => { }}
                collapsible
                theme={isDark ? 'dark' : 'light'}
            >
                <div className="logo" style={{ height: 32, margin: '16px', background: 'rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                    <MenuItem key="/settings">
                        <IconSettings /> Settings
                    </MenuItem>
                </Menu>
            </Sider>
            <Layout>
                <Header style={{ padding: '0 20px', background: isDark ? '#17171a' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', borderBottom: '1px solid var(--color-border)' }}>
                    <Space>
                        <Button
                            shape="circle"
                            type="secondary"
                            icon={isDark ? <IconSunFill /> : <IconMoonFill />}
                            onClick={toggleTheme}
                        />
                    </Space>
                </Header>
                <Content style={{ padding: '24px', background: 'var(--color-fill-1)' }}>
                    {children}
                </Content>
                <Footer style={{ textAlign: 'center', padding: 20, background: 'var(--color-bg-1)' }}>
                    RouteLens ©2026 Admin Panel
                </Footer>
            </Layout>
        </Layout>
    );
};

export default AppLayout;
