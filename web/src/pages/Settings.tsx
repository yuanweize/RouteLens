import React from 'react';
import { Card, Form, Input, Button, Typography } from 'antd';
import { useRequest } from 'ahooks';
import { updatePassword } from '../api';

const Settings: React.FC = () => {
  const [form] = Form.useForm();

  const { run, loading } = useRequest(
    async (values: { newPassword: string }) => updatePassword(values.newPassword),
    {
      manual: true,
      onSuccess: () => form.resetFields(),
    }
  );

  return (
    <Card className="page-card" title="Settings">
      <Typography.Title level={5}>Change Admin Password</Typography.Title>
      <Form layout="vertical" form={form} onFinish={run} style={{ maxWidth: 420 }}>
        <Form.Item name="newPassword" label="New Password" rules={[{ required: true, min: 6 }]}>
          <Input.Password placeholder="Enter new password" />
        </Form.Item>
        <Form.Item
          name="confirm"
          label="Confirm Password"
          dependencies={['newPassword']}
          rules={[
            { required: true },
            ({ getFieldValue }) => ({
              validator: (_, value) =>
                value && value !== getFieldValue('newPassword')
                  ? Promise.reject(new Error('Passwords do not match'))
                  : Promise.resolve(),
            }),
          ]}
        >
          <Input.Password placeholder="Confirm password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          Update Password
        </Button>
      </Form>
    </Card>
  );
};

export default Settings;
