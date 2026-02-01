import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Select, Typography, Collapse, Table, Tag, Space } from 'antd';
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

  const traceData = React.useMemo(() => {
    if (!trace) return null;
    if (typeof trace === 'string') {
      try {
        return JSON.parse(trace);
      } catch {
        return null;
      }
    }
    return trace;
  }, [trace]);

  const renderLatencyTag = (value: any, color?: string) => {
    if (typeof value === 'number' && value > 0) {
      return <Tag color={color}>{`${value}ms`}</Tag>;
    }
    return (
      <Tag>
        <Typography.Text type="secondary">N/A</Typography.Text>
      </Tag>
    );
  };

  const renderLoss = (value: any) => {
    if (typeof value === 'number') {
      return value;
    }
    return <Typography.Text type="secondary">N/A</Typography.Text>;
  };

  const hopRows = (traceData?.hops || []).map((hop: any) => ({
    key: hop.hop,
    hop: hop.hop,
    host: hop.host || hop.ip,
    ip: hop.ip,
    location: [hop.city, hop.country].filter(Boolean).join(', '),
    isp: hop.isp,
    loss: hop.loss,
    last: hop.latency_last_ms,
    avg: hop.latency_avg_ms,
    best: hop.latency_best_ms,
    worst: hop.latency_worst_ms,
    asn: hop.asn,
  }));

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
          <Card className="chart-card" style={{ marginTop: 16 }}>
            <Collapse
              defaultActiveKey={['hops']}
              items={[
                {
                  key: 'hops',
                  label: (
                    <Space>
                      <span>MTR Hop Details</span>
                      {traceData?.truncated ? <Tag color="orange">Truncated</Tag> : null}
                    </Space>
                  ),
                  children: (
                    <Table
                      size="small"
                      dataSource={hopRows}
                      defaultExpandAllRows
                      pagination={false}
                      columns={[
                        { title: 'Hop #', dataIndex: 'hop', width: 70 },
                        { title: 'IP/Host', dataIndex: 'host' },
                        {
                          title: 'Location (GeoIP)',
                          render: (_, row: any) => (
                            <div>
                              <div>{row.location || '-'}</div>
                              <Typography.Text type="secondary">{row.isp || ''}</Typography.Text>
                            </div>
                          ),
                        },
                        { title: 'Loss %', dataIndex: 'loss', render: (val: number) => renderLoss(val) },
                        {
                          title: 'Latency (Last/Avg/Best/Worst)',
                          render: (_, row: any) => (
                            <Space>
                              {renderLatencyTag(row.last, 'green')}
                              {renderLatencyTag(row.avg, 'blue')}
                              {renderLatencyTag(row.best)}
                              {renderLatencyTag(row.worst)}
                            </Space>
                          ),
                        },
                        { title: 'ASN', dataIndex: 'asn', width: 120 },
                      ]}
                    />
                  ),
                },
              ]}
            />
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
