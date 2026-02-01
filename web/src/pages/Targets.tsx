import React, { useMemo, useState } from 'react';
import { Button, Card, Form, Input, Modal, Select, Space, Table, Tag, Upload, message } from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import type { Target } from '../api';
import { deleteTarget, getTargets, saveTarget } from '../api';

const probeOptions = [
  { label: 'ICMP', value: 'MODE_ICMP' },
  { label: 'HTTP', value: 'MODE_HTTP' },
  { label: 'SSH', value: 'MODE_SSH' },
  { label: 'IPERF', value: 'MODE_IPERF' },
];

const Targets: React.FC = () => {
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Target | null>(null);

  const { data = [], refresh, loading } = useRequest(getTargets);

  const columns = useMemo(() => [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Host/IP', dataIndex: 'address' },
    { title: 'Probe', dataIndex: 'probe_type', render: (val: string) => <Tag color="blue">{val}</Tag> },
    { title: 'Enabled', dataIndex: 'enabled', render: (val: boolean) => (val ? <Tag color="green">Enabled</Tag> : <Tag color="red">Disabled</Tag>) },
    {
      title: 'Actions',
      render: (_: any, record: Target) => (
        <Space>
          <Button type="link" onClick={() => onEdit(record)}>Edit</Button>
          <Button type="link" danger onClick={() => onDelete(record.id)}>Delete</Button>
        </Space>
      ),
    },
  ], []);

  const onEdit = (record: Target) => {
    setEditing(record);
    form.setFieldsValue({
      name: record.name,
      address: record.address,
      desc: record.desc,
      enabled: record.enabled,
      probe_type: record.probe_type,
      probe_config: record.probe_config,
    });
    setOpen(true);
  };

  const onDelete = async (id?: number) => {
    if (!id) return;
    await deleteTarget(id);
    refresh();
  };

  const onCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ enabled: true, probe_type: 'MODE_ICMP' });
    setOpen(true);
  };

  const handleUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      form.setFieldValue('ssh_key_text', reader.result as string);
      message.success('SSH key loaded');
    };
    reader.readAsText(file);
    return false;
  };

  const buildProbeConfig = (values: any) => {
    switch (values.probe_type) {
      case 'MODE_HTTP':
        return JSON.stringify({ url: values.http_url || '' });
      case 'MODE_SSH':
        return JSON.stringify({
          user: values.ssh_user || 'root',
          key_path: values.ssh_key_path || '',
          key_text: values.ssh_key_text || '',
          port: Number(values.ssh_port || 22),
        });
      case 'MODE_IPERF':
        return JSON.stringify({ port: Number(values.iperf_port || 5201) });
      default:
        return '';
    }
  };

  const onSubmit = async () => {
    const values = await form.validateFields();
    const payload: Target = {
      id: editing?.id,
      name: values.name,
      address: values.address,
      desc: values.desc || '',
      enabled: values.enabled ?? true,
      probe_type: values.probe_type,
      probe_config: buildProbeConfig(values),
    };
    await saveTarget(payload);
    setOpen(false);
    refresh();
  };

  return (
    <Card className="page-card" title="Targets" extra={<Button icon={<PlusOutlined />} onClick={onCreate}>New Target</Button>}>
      <Table rowKey="id" loading={loading} dataSource={data} columns={columns} />

      <Modal
        title={editing ? 'Edit Target' : 'New Target'}
        open={open}
        onOk={onSubmit}
        onCancel={() => setOpen(false)}
        destroyOnClose
      >
        <Form layout="vertical" form={form} preserve={false}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input placeholder="Hong Kong VPS" />
          </Form.Item>
          <Form.Item name="address" label="Host/IP" rules={[{ required: true }]}>
            <Input placeholder="1.2.3.4" />
          </Form.Item>
          <Form.Item name="probe_type" label="Probe Type" rules={[{ required: true }]}>
            <Select options={probeOptions} />
          </Form.Item>
          <Form.Item shouldUpdate={(prev, cur) => prev.probe_type !== cur.probe_type}>
            {({ getFieldValue }) => {
              const mode = getFieldValue('probe_type');
              if (mode === 'MODE_HTTP') {
                return (
                  <Form.Item name="http_url" label="HTTP URL" rules={[{ required: true }]}>
                    <Input placeholder="https://example.com/test.zip" />
                  </Form.Item>
                );
              }
              if (mode === 'MODE_SSH') {
                return (
                  <>
                    <Form.Item name="ssh_user" label="SSH User" rules={[{ required: true }]}>
                      <Input placeholder="root" />
                    </Form.Item>
                    <Form.Item name="ssh_port" label="SSH Port">
                      <Input placeholder="22" />
                    </Form.Item>
                    <Form.Item name="ssh_key_path" label="SSH Key Path">
                      <Input placeholder="/root/.ssh/id_rsa" />
                    </Form.Item>
                    <Form.Item name="ssh_key_text" label="SSH Key Text">
                      <Input.TextArea rows={4} placeholder="Paste private key content" />
                    </Form.Item>
                    <Upload beforeUpload={handleUpload} showUploadList={false}>
                      <Button icon={<UploadOutlined />}>Upload SSH Key</Button>
                    </Upload>
                  </>
                );
              }
              if (mode === 'MODE_IPERF') {
                return (
                  <Form.Item name="iperf_port" label="Iperf Port" rules={[{ required: true }]}>
                    <Input placeholder="5201" />
                  </Form.Item>
                );
              }
              return null;
            }}
          </Form.Item>
          <Form.Item name="desc" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default Targets;
