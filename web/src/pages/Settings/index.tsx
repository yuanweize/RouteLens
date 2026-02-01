import React, { useEffect, useState } from 'react';
import { Table, Button, Card, Modal, Form, Input, Switch, Message, Space, Typography, Popconfirm, Tabs, Select, Tag, Grid, Descriptions, Spin, Progress } from '@arco-design/web-react';
import { IconPlus, IconDelete, IconEdit, IconSafe, IconUnorderedList, IconRefresh, IconApps } from '@arco-design/web-react/icon';
import { getTargets, saveTarget, deleteTarget, updatePassword, getSystemInfo, checkUpdate, performUpdate } from '../../api';
import type { Target, SystemInfo, UpdateCheckResult } from '../../api';

const { TabPane } = Tabs;
const { Row, Col } = Grid;

const Settings: React.FC = () => {
    const [targets, setTargets] = useState<Target[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [passForm] = Form.useForm();
    const [editingId, setEditingId] = useState<number | null>(null);
    
    // System info & update state
    const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
    const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
    const [checkingUpdate, setCheckingUpdate] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [updateProgress, setUpdateProgress] = useState(0);

    const fetchTargets = async () => {
        setLoading(true);
        try {
            const data = await getTargets();
            setTargets(data as any);
        } catch (e) {
            Message.error('Failed to fetch targets');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTargets();
        fetchSystemInfo();
    }, []);
    
    const fetchSystemInfo = async () => {
        try {
            const info = await getSystemInfo();
            setSystemInfo(info);
        } catch (e) {
            console.error('Failed to fetch system info:', e);
        }
    };
    
    const handleCheckUpdate = async () => {
        setCheckingUpdate(true);
        try {
            const result = await checkUpdate();
            setUpdateInfo(result);
            if (result.has_update) {
                Message.info(`New version ${result.latest_version} available!`);
            } else {
                Message.success('You are on the latest version.');
            }
        } catch (e) {
            Message.error('Failed to check for updates');
        } finally {
            setCheckingUpdate(false);
        }
    };
    
    const handlePerformUpdate = async () => {
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
                Message.success('Update successful! Restarting service...');
                setTimeout(() => window.location.reload(), 3000);
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

    const handleAdd = () => {
        setEditingId(null);
        form.resetFields();
        form.setFieldValue('probe_type', 'MODE_ICMP');
        setIsModalVisible(true);
    };

    const handleEdit = (record: Target) => {
        setEditingId(record.id || null);
        form.setFieldsValue(record);
        setIsModalVisible(true);
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteTarget(id);
            Message.success('Target deleted');
            fetchTargets();
        } catch (e) {
            Message.error('Delete failed');
        }
    };

    const handleOk = async () => {
        try {
            const values = await form.validate();
            await saveTarget({ ...values, id: editingId || undefined });
            Message.success(editingId ? 'Target updated' : 'Target added');
            setIsModalVisible(false);
            fetchTargets();
        } catch (e) {
            // Validation or API error handled by Arco/Intercept
        }
    };

    const handlePassUpdate = async (values: any) => {
        try {
            await updatePassword(values.newPassword);
            Message.success('Password updated successfully');
            passForm.resetFields();
        } catch (e) { console.error(e); }
    };

    const columns = [
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'Address', dataIndex: 'address', key: 'address' },
        { title: 'Probe Mode', dataIndex: 'probe_type', key: 'probe_type', render: (val: string) => <Tag color="arcoblue">{val || 'MODE_ICMP'}</Tag> },
        {
            title: 'Status',
            dataIndex: 'enabled',
            render: (enabled: boolean) => <Switch checked={enabled} disabled />,
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: Target) => (
                <Space>
                    <Button type="text" icon={<IconEdit />} onClick={() => handleEdit(record)}>Edit</Button>
                    <Popconfirm
                        title="Delete this target?"
                        onOk={() => { if (record.id) handleDelete(record.id) }}
                    >
                        <Button type="text" status="danger" icon={<IconDelete />}>Delete</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Typography.Title heading={4} style={{ marginBottom: 24 }}>System Settings</Typography.Title>

            <Tabs defaultActiveTab='1' type='card-gutter'>
                <TabPane
                    key='1'
                    title={<span><IconUnorderedList style={{ marginRight: 6 }} />Target Management</span>}
                >
                    <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button type="primary" icon={<IconPlus />} onClick={handleAdd}>Add Target</Button>
                    </div>
                    <Card bordered={false}>
                        <Table
                            columns={columns}
                            data={targets}
                            loading={loading}
                            rowKey="id"
                        />
                    </Card>
                </TabPane>

                <TabPane
                    key='2'
                    title={<span><IconSafe style={{ marginRight: 6 }} />Security</span>}
                >
                    <Card title="Change Password" style={{ maxWidth: 500 }}>
                        <Form form={passForm} layout="vertical" onSubmit={handlePassUpdate}>
                            <Form.Item label="New Password" field="newPassword" rules={[{ required: true, min: 6 }]}>
                                <Input.Password placeholder="Enter new password" />
                            </Form.Item>
                            <Form.Item label="Confirm Password" field="confirm" rules={[
                                { required: true },
                                {
                                    validator: (v, cb) => {
                                        if (v !== passForm.getFieldValue('newPassword')) cb('Passwords do not match');
                                        else cb();
                                    }
                                }
                            ]}>
                                <Input.Password placeholder="Confirm new password" />
                            </Form.Item>
                            <Form.Item>
                                <Button type="primary" htmlType="submit">Update Password</Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </TabPane>

                <TabPane
                    key='3'
                    title={<span><IconApps style={{ marginRight: 6 }} />About & Updates</span>}
                >
                    <Row gutter={24}>
                        <Col span={12}>
                            <Card title="System Information" bordered={false}>
                                {systemInfo ? (
                                    <Descriptions 
                                        column={1} 
                                        labelStyle={{ width: 120 }}
                                        data={[
                                            { label: 'Version', value: <Tag color="arcoblue">{systemInfo.version}</Tag> },
                                            { label: 'Commit', value: <Typography.Text code>{systemInfo.commit.slice(0, 8)}</Typography.Text> },
                                            { label: 'Build Date', value: systemInfo.build_date },
                                            { label: 'Go Version', value: systemInfo.go_version },
                                            { label: 'OS / Arch', value: `${systemInfo.os} / ${systemInfo.arch}` },
                                        ]}
                                    />
                                ) : (
                                    <Spin />
                                )}
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card title="Software Update" bordered={false}>
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    {updateInfo && (
                                        <Descriptions 
                                            column={1}
                                            labelStyle={{ width: 120 }}
                                            data={[
                                                { label: 'Current', value: updateInfo.current_version },
                                                { label: 'Latest', value: updateInfo.latest_version || 'Unknown' },
                                                { label: 'Status', value: updateInfo.has_update 
                                                    ? <Tag color="orange">Update Available</Tag> 
                                                    : <Tag color="green">Up to Date</Tag> 
                                                },
                                            ]}
                                        />
                                    )}
                                    
                                    <Space style={{ marginTop: 16 }}>
                                        <Button 
                                            type="secondary" 
                                            icon={<IconRefresh />}
                                            onClick={handleCheckUpdate}
                                            loading={checkingUpdate}
                                        >
                                            Check for Updates
                                        </Button>
                                        
                                        {updateInfo?.has_update && (
                                            <Button 
                                                type="primary" 
                                                onClick={handlePerformUpdate}
                                                loading={updating}
                                            >
                                                Install Update
                                            </Button>
                                        )}
                                    </Space>
                                    
                                    {updateInfo?.release_notes && (
                                        <Card title="Release Notes" style={{ marginTop: 16 }} size="small">
                                            <Typography.Paragraph 
                                                style={{ 
                                                    maxHeight: 200, 
                                                    overflow: 'auto',
                                                    whiteSpace: 'pre-wrap',
                                                    fontSize: 12 
                                                }}
                                            >
                                                {updateInfo.release_notes}
                                            </Typography.Paragraph>
                                        </Card>
                                    )}
                                </Space>
                            </Card>
                        </Col>
                    </Row>
                    
                    {/* Update Progress Modal */}
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
                </TabPane>
            </Tabs>

            <Modal
                title={editingId ? "Edit Target" : "Add Target"}
                visible={isModalVisible}
                onOk={handleOk}
                onCancel={() => setIsModalVisible(false)}
                autoFocus={false}
                focusLock={true}
                style={{ width: 600 }}
            >
                <Form form={form} layout="vertical">
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Name" field="name" rules={[{ required: true }]}>
                                <Input placeholder="e.g. HK VPS" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Address (IP/Domain)" field="address" rules={[{ required: true }]}>
                                <Input placeholder="e.g. 1.2.3.4" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Probe Mode" field="probe_type" initialValue="MODE_ICMP">
                                <Select>
                                    <Select.Option value="MODE_ICMP">ICMP/MTR (Default)</Select.Option>
                                    <Select.Option value="MODE_SSH">SSH Speed Test</Select.Option>
                                    <Select.Option value="MODE_HTTP">HTTP Download</Select.Option>
                                    <Select.Option value="MODE_IPERF">Iperf3 Client</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Probe Config" field="probe_config" tooltip="JSON: SSH {user,password,key_path,port}, HTTP {url}, IPERF {port}">
                                <Input placeholder='{"url":"https://example.com/test.zip"}' />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item label="Description" field="desc">
                        <Input.TextArea placeholder="Details about this target..." />
                    </Form.Item>
                    <Form.Item label="Enabled" field="enabled" triggerPropName="checked" initialValue={true}>
                        <Switch />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Settings;
