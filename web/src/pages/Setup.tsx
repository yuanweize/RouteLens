import React from 'react';
import { Card, Form, Input, Button, Typography, Space, Dropdown, Tooltip, message } from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  GlobalOutlined, 
  MoonOutlined, 
  SunOutlined, 
  SafetyCertificateOutlined 
} from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { setupAdmin, login } from '../api';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';

const { Title, Text, Paragraph } = Typography;

const Setup: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { t, i18n } = useTranslation();
  const { isDark, toggleTheme } = useTheme();

  const { run, loading } = useRequest(
    async (values: { username: string; password: string }) => {
      // 1. Perform setup
      await setupAdmin({ username: values.username, password: values.password });
      // 2. Automatically log in to get JWT token
      const loginRes = await login(values.username, values.password);
      localStorage.setItem('token', loginRes.token);
      return loginRes;
    },
    {
      manual: true,
      onSuccess: () => {
        message.success(t('setup.success') || 'Setup completed! Welcome to RouteLens.');
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
          <div className="auth-logo-badge" style={{ background: 'linear-gradient(135deg, #52c41a 0%, #1677ff 100%)' }}>
            <SafetyCertificateOutlined />
          </div>
          <Title level={3} style={{ margin: '0 0 6px' }}>
            {t('setup.title')}
          </Title>
          <Paragraph type="secondary" style={{ margin: 0, fontSize: 13 }}>
            {t('setup.subtitle')}
          </Paragraph>
        </div>

        <Form layout="vertical" form={form} onFinish={run} size="large">
          <Form.Item 
            name="username" 
            rules={[
              { required: true, message: t('login.invalidCredentials') },
              { min: 3, max: 32, message: '3-32 characters' }
            ]}
          >
            <Input 
              prefix={<UserOutlined style={{ color: 'rgba(140, 140, 140, 0.7)' }} />} 
              placeholder={t('setup.username')} 
              autoComplete="username"
            />
          </Form.Item>
          <Form.Item 
            name="password" 
            rules={[
              { required: true, message: t('login.invalidCredentials') },
              { min: 6, max: 72, message: 'Min 6 characters' }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined style={{ color: 'rgba(140, 140, 140, 0.7)' }} />} 
              placeholder={t('setup.password')} 
              autoComplete="new-password"
            />
          </Form.Item>
          <Form.Item 
            name="confirmPassword" 
            dependencies={['password']}
            rules={[
              { required: true, message: t('setup.confirmPassword') },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(t('setup.passwordMismatch') || 'Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined style={{ color: 'rgba(140, 140, 140, 0.7)' }} />} 
              placeholder={t('setup.confirmPassword')} 
              autoComplete="new-password"
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
              background: 'linear-gradient(135deg, #1677ff 0%, #13c2c2 100%)',
              boxShadow: '0 4px 14px rgba(22, 119, 255, 0.35)'
            }}
          >
            {t('setup.submit')}
          </Button>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            RouteLens • Security First Architecture
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Setup;

