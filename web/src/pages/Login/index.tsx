import React, { useState } from 'react';
import { Form, Input, Button, Card, Message, Typography } from '@arco-design/web-react';
import { IconLock } from '@arco-design/web-react/icon';
import { useNavigate } from 'react-router-dom';
import { login } from '../../api';

const Login: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [form] = Form.useForm();

    const handleSubmit = async (values: any) => {
        setLoading(true);
        try {
            // Explicitly assert the return type or adjust request.post to return data directly
            // Currently interceptors return response.data
            const res: any = await login(values.password);
            localStorage.setItem('token', res.token);
            Message.success('Login Successful');
            navigate('/dashboard');
        } catch (err) {
            // Error handled by interceptor or here
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            background: '#f0f2f5'
        }}>
            <Card style={{ width: 400, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <Typography.Title heading={3}>RouteLens</Typography.Title>
                    <Typography.Text type="secondary">Network Observability Platform</Typography.Text>
                </div>
                <Form form={form} onSubmit={handleSubmit} autoComplete="off">
                    <Form.Item field="password" rules={[{ required: true, message: 'Password is required' }]}>
                        <Input.Password
                            prefix={<IconLock />}
                            placeholder="Admin Password"
                            onPressEnter={() => form.submit()}
                        />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" long loading={loading}>
                            Login
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default Login;
