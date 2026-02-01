import React from 'react';
import ReactECharts from 'echarts-for-react';

interface MetricsChartProps {
  history: any[];
  isDark: boolean;
}

const MetricsChart: React.FC<MetricsChartProps> = ({ history, isDark }) => {
  const times = history.map((h) => new Date(h.created_at || h.CreatedAt).toLocaleTimeString());
  const latency = history.map((h) => h.latency_ms || h.LatencyMs || 0);
  const loss = history.map((h) => h.packet_loss || h.PacketLoss || 0);

  const option = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    grid: { top: 30, bottom: 30, left: 50, right: 20 },
    xAxis: {
      type: 'category',
      data: times,
      axisLine: { lineStyle: { color: isDark ? '#303030' : '#d9d9d9' } },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: isDark ? '#2f2f2f' : '#f0f0f0' } },
    },
    series: [
      {
        name: 'Latency',
        type: 'line',
        smooth: true,
        data: latency,
        itemStyle: { color: '#1677ff' },
      },
      {
        name: 'Packet Loss',
        type: 'line',
        smooth: true,
        data: loss,
        itemStyle: { color: '#ff7a45' },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 320 }} notMerge={true} theme={isDark ? 'dark' : 'light'} />;
};

export default MetricsChart;
