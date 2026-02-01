import React from 'react';
import { Card, Form, Input, Button, Typography } from 'antd';
import { useRequest } from 'ahooks';
import { login } from '../api';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();

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

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <Card className="page-card" style={{ width: 420 }}>
        <Typography.Title level={3}>Login</Typography.Title>
        <Typography.Paragraph type="secondary">
          Sign in to manage RouteLens.
        </Typography.Paragraph>
        <Form layout="vertical" form={form} onFinish={run}>
          <Form.Item name="username" label="Username" rules={[{ required: true }]}>
            <Input placeholder="admin" />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true }]}>
            <Input.Password placeholder="Password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Login
          </Button>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
