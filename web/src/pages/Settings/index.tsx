import React, { useEffect, useState } from 'react';
import { Table, Button, Card, Modal, Form, Input, Switch, Message, Space, Typography, Popconfirm } from '@arco-design/web-react';
import { IconPlus, IconDelete, IconEdit } from '@arco-design/web-react/icon';
import { getTargets, saveTarget, deleteTarget } from '../../api';
import type { Target } from '../../api';

const Settings: React.FC = () => {
    const [targets, setTargets] = useState<Target[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [editingId, setEditingId] = useState<number | null>(null);

    const fetchTargets = async () => {
        setLoading(true);
        try {
            const res = await getTargets();
            setTargets(res.data);
        } catch (e) {
            Message.error('Failed to fetch targets');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTargets();
    }, []);

    const handleAdd = () => {
        setEditingId(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    const handleEdit = (record: Target) => {
        setEditingId(record.ID || null);
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
            await saveTarget({ ...values, ID: editingId || undefined });
            Message.success(editingId ? 'Target updated' : 'Target added');
            setIsModalVisible(false);
            fetchTargets();
        } catch (e) {
            // Validation or API error handled by Arco/Intercept
        }
    };

    const columns = [
        { title: 'Name', dataIndex: 'Name', key: 'Name' },
        { title: 'Address', dataIndex: 'Address', key: 'Address' },
        { title: 'Description', dataIndex: 'Desc', key: 'Desc' },
        {
            title: 'Status',
            dataIndex: 'Enabled',
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
                        onOk={() => { if (record.ID) handleDelete(record.ID) }}
                    >
                        <Button type="text" status="danger" icon={<IconDelete />}>Delete</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography.Title heading={4} style={{ margin: 0 }}>Target Management</Typography.Title>
                <Button type="primary" icon={<IconPlus />} onClick={handleAdd}>Add Target</Button>
            </div>

            <Card>
                <Table
                    columns={columns}
                    data={targets}
                    loading={loading}
                    rowKey="ID"
                />
            </Card>

            <Modal
                title={editingId ? "Edit Target" : "Add Target"}
                visible={isModalVisible}
                onOk={handleOk}
                onCancel={() => setIsModalVisible(false)}
                autoFocus={false}
                focusLock={true}
            >
                <Form form={form} layout="vertical">
                    <Form.Item label="Name" field="Name" rules={[{ required: true }]}>
                        <Input placeholder="e.g. HK VPS" />
                    </Form.Item>
                    <Form.Item label="Address" field="Address" rules={[{ required: true }]}>
                        <Input placeholder="e.g. 1.2.3.4 or nas.yuanweize.win" />
                    </Form.Item>
                    <Form.Item label="Description" field="Desc">
                        <Input.TextArea placeholder="Details about this target..." />
                    </Form.Item>
                    <Form.Item label="Enabled" field="Enabled" triggerPropName="checked" initialValue={true}>
                        <Switch />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Settings;
