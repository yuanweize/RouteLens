import React from 'react';
import { Card, Form, Input, Button, Typography, Space, Dropdown, Tooltip } from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  GlobalOutlined, 
  MoonOutlined, 
  SunOutlined, 
  RadarChartOutlined 
} from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { login } from '../api';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';

const { Title, Text, Paragraph } = Typography;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { t, i18n } = useTranslation();
  const { isDark, toggleTheme } = useTheme();

  const { run, loading } = useRequest(
    async (values: { username: string; password: string }) => login(values.username, values.password),
    {
      manual: true,
      onSuccess: (data) => {
        localStorage.setItem('token', data.token);
        navigate('/dashboard');
      },
    }
  );

  const languageMenu = {
    items: [
      { key: 'en', label: '🇺🇸 English' },
      { key: 'zh-CN', label: '🇨🇳 中文' },
    ],
    onClick: ({ key }: { key: string }) => i18n.changeLanguage(key),
  };

  return (
    <div className="auth-container">
      {/* Top right quick settings */}
      <div style={{ position: 'absolute', top: 20, right: 24, zIndex: 10 }}>
        <Space>
          <Dropdown menu={languageMenu} placement="bottomRight">
            <Button size="small" icon={<GlobalOutlined />}>
              {i18n.language === 'zh-CN' ? '中文' : 'EN'}
            </Button>
          </Dropdown>
          <Tooltip title={isDark ? t('settings.lightMode') : t('settings.darkMode')}>
            <Button 
              size="small" 
              icon={isDark ? <SunOutlined /> : <MoonOutlined />} 
              onClick={toggleTheme} 
            />
          </Tooltip>
        </Space>
      </div>

      <Card className="auth-card fade-in">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div className="auth-logo-badge">
            <RadarChartOutlined />
          </div>
          <Title level={3} style={{ margin: '0 0 6px' }}>
            {t('login.welcome')}
          </Title>
          <Paragraph type="secondary" style={{ margin: 0, fontSize: 13 }}>
            {t('login.subtitle')}
          </Paragraph>
        </div>

        <Form layout="vertical" form={form} onFinish={run} size="large">
          <Form.Item 
            name="username" 
            rules={[{ required: true, message: t('login.invalidCredentials') }]}
          >
            <Input 
              prefix={<UserOutlined style={{ color: 'rgba(140, 140, 140, 0.7)' }} />} 
              placeholder={t('login.username')} 
              autoComplete="username"
            />
          </Form.Item>
          <Form.Item 
            name="password" 
            rules={[{ required: true, message: t('login.invalidCredentials') }]}
          >
            <Input.Password 
              prefix={<LockOutlined style={{ color: 'rgba(140, 140, 140, 0.7)' }} />} 
              placeholder={t('login.password')} 
              autoComplete="current-password"
            />
          </Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading} 
            block 
            style={{ 
              height: 44, 
              fontSize: 15, 
              fontWeight: 500, 
              marginTop: 8,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #1677ff 0%, #3a5ccc 100%)',
              boxShadow: '0 4px 14px rgba(22, 119, 255, 0.35)'
            }}
          >
            {t('login.submit')}
          </Button>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            RouteLens • Modern Agentless Network Observability
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Login;

