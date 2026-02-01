import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Select, Typography } from 'antd';
import { useRequest } from 'ahooks';
import { getHistory, getLatestTrace, getTargets } from '../api';
import MapChart from '../components/MapChart';
import MetricsChart from '../components/MetricsChart';
import { useTheme } from '../context/ThemeContext';

const Dashboard: React.FC = () => {
  const { isDark } = useTheme();
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [trace, setTrace] = useState<any>(null);

  const { data: targets = [] } = useRequest(getTargets);

  useEffect(() => {
    if (targets.length > 0 && !selectedTarget) {
      setSelectedTarget(targets[0].address);
    }
  }, [targets, selectedTarget]);

  const { data: history = [] } = useRequest(() => getHistory({ target: selectedTarget }), {
    refreshDeps: [selectedTarget],
    ready: !!selectedTarget,
  });

  useRequest(() => getLatestTrace(selectedTarget), {
    refreshDeps: [selectedTarget],
    ready: !!selectedTarget,
    onSuccess: (data) => setTrace(data),
  });

  const avgLatency = history.length
    ? history.reduce((sum: number, h: any) => sum + (h.latency_ms || h.LatencyMs || 0), 0) / history.length
    : 0;
  const avgLoss = history.length
    ? history.reduce((sum: number, h: any) => sum + (h.packet_loss || h.PacketLoss || 0), 0) / history.length
    : 0;
  const lastSpeed = history.length
    ? history[history.length - 1].speed_down || history[history.length - 1].SpeedDown || 0
    : 0;

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Typography.Title level={4} style={{ margin: 0 }}>Dashboard</Typography.Title>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card className="page-card">
            <Statistic title="Avg Latency" value={avgLatency} suffix="ms" precision={1} />
          </Card>
        </Col>
        <Col span={8}>
          <Card className="page-card">
            <Statistic title="Packet Loss" value={avgLoss} suffix="%" precision={2} />
          </Card>
        </Col>
        <Col span={8}>
          <Card className="page-card">
            <Statistic title="Downlink" value={lastSpeed} suffix="Mbps" precision={1} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={16}>
          <Card
            className="chart-card"
            title="Route Map"
            extra={
              <Select
                style={{ width: 240 }}
                value={selectedTarget}
                onChange={setSelectedTarget}
                options={targets.map((t) => ({ label: `${t.name} (${t.address})`, value: t.address }))}
              />
            }
          >
            <MapChart trace={trace} isDark={isDark} />
          </Card>
        </Col>
        <Col span={8}>
          <Card className="chart-card" title="Historical Metrics">
            <MetricsChart history={history} isDark={isDark} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
