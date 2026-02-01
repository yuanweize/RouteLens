import React, { useEffect, useState } from 'react';
import { Card, Grid, Statistic, Button, Typography, Select, Space } from '@arco-design/web-react';
import { IconThunderbolt } from '@arco-design/web-react/icon';
import MapChart from '../../components/MapChart';
import MetricsChart from '../../components/MetricsChart';
import { triggerProbe, getTargets } from '../../api';
import type { Target } from '../../api';

const { Row, Col } = Grid;

const Dashboard: React.FC = () => {
    const [targets, setTargets] = useState<Target[]>([]);
    const [selectedTarget, setSelectedTarget] = useState<string>('');
    const [history, setHistory] = useState<any[]>([]);

    const fetchInitialData = async () => {
        try {
            const res = await getTargets();
            setTargets(res.data);
            if (res.data.length > 0 && !selectedTarget) {
                setSelectedTarget(res.data[0].Address);
            }
        } catch (e) { console.error(e); }
    };

    const fetchHistory = async () => {
        if (!selectedTarget) return;
        try {
            // In real app, we use getHistory(selectedTarget)
            const mockHistory = Array.from({ length: 20 }).fill(0).map((_, i) => ({
                CreatedAt: new Date(Date.now() - (20 - i) * 60000).toISOString(),
                LatencyMs: 20 + Math.random() * 10,
                PacketLoss: Math.random() > 0.8 ? 5 : 0,
                SpeedDown: 50 + Math.random() * 50
            }));
            setHistory(mockHistory);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        fetchHistory();
        const timer = setInterval(fetchHistory, 5000);
        return () => clearInterval(timer);
    }, [selectedTarget]);

    const handleProbe = async () => {
        await triggerProbe();
        fetchHistory();
    };

    return (
        <div style={{ minHeight: '80vh' }}>
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space size="large">
                    <Typography.Title heading={4} style={{ margin: 0 }}>Network Observer</Typography.Title>
                    <Select
                        placeholder='Select Target'
                        style={{ width: 240 }}
                        value={selectedTarget}
                        onChange={setSelectedTarget}
                    >
                        {targets.map(t => <Select.Option key={t.Address} value={t.Address}>{t.Name} ({t.Address})</Select.Option>)}
                    </Select>
                </Space>
                <Button type="primary" icon={<IconThunderbolt />} onClick={handleProbe}>
                    Quick Probe
                </Button>
            </div>

            <Row gutter={24} style={{ marginBottom: 24 }}>
                <Col span={6}>
                    <Card bordered={false} hoverable>
                        <Statistic title="Avg Latency" value={24.5} precision={1} suffix="ms" groupSeparator />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card bordered={false} hoverable>
                        <Statistic title="Packet Loss" value={0} precision={2} suffix="%" style={{ color: 'var(--color-success-text)' }} />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card bordered={false} hoverable>
                        <Statistic title="Bandwidth" value={120.5} precision={1} suffix="Mbps" />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card bordered={false} hoverable>
                        <Statistic title="Monitoring Nodes" value={targets.length} />
                    </Card>
                </Col>
            </Row>

            <Row gutter={24}>
                <Col span={16}>
                    <Card title="Traffic Path Visualization" bordered={false} extra={<Typography.Text type="secondary">Real-time Path</Typography.Text>}>
                        <MapChart />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card title="Connectivity Trends" bordered={false}>
                        <MetricsChart history={history} />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Dashboard;
