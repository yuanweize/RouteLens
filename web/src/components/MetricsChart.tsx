import React from 'react';
import ReactECharts from 'echarts-for-react';

interface MetricsChartProps {
  history: any[];
  isDark: boolean;
}

const MetricsChart: React.FC<MetricsChartProps> = ({ history, isDark }) => {
  // Format time based on data range
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // For tooltip, show full datetime
  const formatFullTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const times = history.map((h) => formatTime(h.created_at || h.CreatedAt));
  const fullTimes = history.map((h) => formatFullTime(h.created_at || h.CreatedAt));
  const latency = history.map((h) => h.latency_ms || h.LatencyMs || 0);
  const loss = history.map((h) => h.packet_loss || h.PacketLoss || 0);

  const option = {
    backgroundColor: 'transparent',
    tooltip: { 
      trigger: 'axis',
      formatter: (params: any) => {
        const idx = params[0]?.dataIndex;
        if (idx === undefined) return '';
        let result = `<div style="font-weight:500">${fullTimes[idx]}</div>`;
        params.forEach((p: any) => {
          const unit = p.seriesName === 'Latency' ? 'ms' : '%';
          result += `<div>${p.marker} ${p.seriesName}: ${p.value.toFixed(1)}${unit}</div>`;
        });
        return result;
      }
    },
    grid: { top: 30, bottom: 30, left: 50, right: 20 },
    xAxis: {
      type: 'category',
      data: times,
      axisLine: { lineStyle: { color: isDark ? '#303030' : '#d9d9d9' } },
      axisLabel: { 
        rotate: 0,
        interval: Math.max(0, Math.floor(times.length / 6) - 1)
      },
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
        showSymbol: history.length < 50,
      },
      {
        name: 'Packet Loss',
        type: 'line',
        smooth: true,
        data: loss,
        itemStyle: { color: '#ff7a45' },
        showSymbol: history.length < 50,
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 320 }} notMerge={true} theme={isDark ? 'dark' : 'light'} />;
};

export default MetricsChart;
