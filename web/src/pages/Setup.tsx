import React from 'react';
import { Card, Form, Input, Button, Typography } from 'antd';
import { useRequest } from 'ahooks';
import { setupAdmin } from '../api';
import { useNavigate } from 'react-router-dom';

const Setup: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const { run, loading } = useRequest(
    async (values: { username: string; password: string }) => setupAdmin(values),
    {
      manual: true,
      onSuccess: () => {
        navigate('/dashboard');
      },
    }
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <Card className="page-card" style={{ width: 420 }}>
        <Typography.Title level={3}>Initial Setup</Typography.Title>
        <Typography.Paragraph type="secondary">
          Create your admin account to secure RouteLens.
        </Typography.Paragraph>
        <Form layout="vertical" form={form} onFinish={run}>
          <Form.Item name="username" label="Admin Username" rules={[{ required: true }]}>
            <Input placeholder="admin" />
          </Form.Item>
          <Form.Item name="password" label="Admin Password" rules={[{ required: true, min: 6 }]}>
            <Input.Password placeholder="Enter a strong password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Complete Setup
          </Button>
        </Form>
      </Card>
    </div>
  );
};

export default Setup;
