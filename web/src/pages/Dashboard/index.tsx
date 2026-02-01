import React, { useEffect, useState } from 'react';
import { Card, Grid, Statistic, Button, Typography } from '@arco-design/web-react';
import { IconThunderbolt } from '@arco-design/web-react/icon';
import MapChart from '../../components/MapChart';
import MetricsChart from '../../components/MetricsChart';
import { getStatus, triggerProbe } from '../../api';

const { Row, Col } = Grid;

const Dashboard: React.FC = () => {
    const [status, setStatus] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);

    const fetchData = async () => {
        try {
            const s = await getStatus();
            setStatus(s);
            // Mock history fetch for valid chart
            // In real app, we pass target
            // const h = await getHistory({});
            // setHistory(h);

            // Generate mock history for demo
            const mockHistory = Array.from({ length: 20 }).fill(0).map((_, i) => ({
                CreatedAt: new Date(Date.now() - (20 - i) * 60000).toISOString(),
                LatencyMs: 20 + Math.random() * 10,
                PacketLoss: Math.random() > 0.8 ? 5 : 0,
                SpeedDown: 50 + Math.random() * 50
            }));
            // Use history to avoid unsued var warning if we were using real API, 
            // but here we set it.
            setHistory(mockHistory);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchData();
        const timer = setInterval(fetchData, 5000);
        return () => clearInterval(timer);
    }, []);

    const handleProbe = async () => {
        await triggerProbe();
        fetchData(); // Refresh immediately
    };

    return (
        <div style={{ padding: 20, background: '#f4f5f7', minHeight: '100vh' }}>
            <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}>
                <Typography.Title heading={4} style={{ margin: 0 }}>RouteLens Dashboard</Typography.Title>
                <Button type="primary" icon={<IconThunderbolt />} onClick={handleProbe}>
                    Trigger Probe
                </Button>
            </div>

            <Row gutter={20} style={{ marginBottom: 20 }}>
                <Col span={6}>
                    <Card>
                        <Statistic title="Avg Latency" value={24.5} precision={1} suffix="ms" />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        {/* Removed valueStyle, using style for color (if generic prop supported) or just no color for now to pass build */}
                        <Statistic title="Packet Loss" value={0} precision={2} suffix="%" style={{ color: '#0fbf60' }} />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic title="Bandwidth" value={120.5} precision={1} suffix="Mbps" />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic title="Active Nodes" value={status?.targets?.length || 0} />
                    </Card>
                </Col>
            </Row>

            <Row gutter={20}>
                <Col span={16}>
                    <Card title="Global Connectivity Map">
                        <MapChart />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card title="Real-time Metrics">
                        <MetricsChart history={history} />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Dashboard;
