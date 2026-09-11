import React, { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Segmented, Empty } from 'antd';
import { useTranslation } from 'react-i18next';

interface MetricsChartProps {
  history: any[];
  isDark: boolean;
}

const MetricsChart: React.FC<MetricsChartProps> = ({ history, isDark }) => {
  const { t } = useTranslation();
  const [metricMode, setMetricMode] = useState<'latency' | 'bandwidth'>('latency');

  // Filter out pure speed records from latency view to avoid 0ms plunges
  const pingHistory = useMemo(() => {
    return history.filter((h) => {
      const lat = h.latency_ms || h.LatencyMs || 0;
      const loss = h.packet_loss || h.PacketLoss || 0;
      const down = h.speed_down || h.SpeedDown || 0;
      const up = h.speed_up || h.SpeedUp || 0;
      // If speed only, filter out from ping chart
      if ((down > 0 || up > 0) && lat === 0 && loss === 0) return false;
      return true;
    });
  }, [history]);

  // Filter records that have bandwidth data
  const speedHistory = useMemo(() => {
    return history.filter((h) => {
      const down = h.speed_down || h.SpeedDown || 0;
      const up = h.speed_up || h.SpeedUp || 0;
      return down > 0 || up > 0;
    });
  }, [history]);

  // Format time based on data range
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatFullTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const currentDataset = metricMode === 'latency' ? pingHistory : speedHistory;

  const times = currentDataset.map((h) => formatTime(h.created_at || h.CreatedAt));
  const fullTimes = currentDataset.map((h) => formatFullTime(h.created_at || h.CreatedAt));

  const option = useMemo(() => {
    if (metricMode === 'latency') {
      const latency = pingHistory.map((h) => h.latency_ms || h.LatencyMs || 0);
      const loss = pingHistory.map((h) => h.packet_loss || h.PacketLoss || 0);

      return {
        backgroundColor: 'transparent',
        tooltip: { 
          trigger: 'axis',
          formatter: (params: any) => {
            const idx = params[0]?.dataIndex;
            if (idx === undefined) return '';
            let result = `<div style="font-weight:600;margin-bottom:4px">${fullTimes[idx]}</div>`;
            params.forEach((p: any) => {
              const unit = p.seriesName === 'Latency' ? ' ms' : ' %';
              result += `<div>${p.marker} ${p.seriesName}: <b>${p.value.toFixed(1)}${unit}</b></div>`;
            });
            return result;
          }
        },
        grid: { top: 25, bottom: 25, left: 45, right: 15 },
        xAxis: {
          type: 'category',
          data: times,
          axisLine: { lineStyle: { color: isDark ? 'rgba(255, 255, 255, 0.15)' : '#d9d9d9' } },
          axisLabel: { 
            rotate: 0,
            interval: Math.max(0, Math.floor(times.length / 5) - 1)
          },
        },
        yAxis: {
          type: 'value',
          splitLine: { lineStyle: { color: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f0f0f0' } },
        },
        series: [
          {
            name: 'Latency',
            type: 'line',
            smooth: true,
            data: latency,
            itemStyle: { color: '#1677ff' },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(22, 119, 255, 0.25)' },
                  { offset: 1, color: 'rgba(22, 119, 255, 0.0)' }
                ]
              }
            },
            showSymbol: pingHistory.length < 30,
          },
          {
            name: 'Packet Loss',
            type: 'line',
            smooth: true,
            data: loss,
            itemStyle: { color: '#ff4d4f' },
            showSymbol: pingHistory.length < 30,
          },
        ],
      };
    } else {
      // Bandwidth mode
      const speedDown = speedHistory.map((h) => h.speed_down || h.SpeedDown || 0);
      const speedUp = speedHistory.map((h) => h.speed_up || h.SpeedUp || 0);

      return {
        backgroundColor: 'transparent',
        tooltip: { 
          trigger: 'axis',
          formatter: (params: any) => {
            const idx = params[0]?.dataIndex;
            if (idx === undefined) return '';
            let result = `<div style="font-weight:600;margin-bottom:4px">${fullTimes[idx]}</div>`;
            params.forEach((p: any) => {
              result += `<div>${p.marker} ${p.seriesName}: <b>${p.value.toFixed(2)} Mbps</b></div>`;
            });
            return result;
          }
        },
        grid: { top: 25, bottom: 25, left: 45, right: 15 },
        xAxis: {
          type: 'category',
          data: times,
          axisLine: { lineStyle: { color: isDark ? 'rgba(255, 255, 255, 0.15)' : '#d9d9d9' } },
          axisLabel: { 
            rotate: 0,
            interval: Math.max(0, Math.floor(times.length / 5) - 1)
          },
        },
        yAxis: {
          type: 'value',
          splitLine: { lineStyle: { color: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f0f0f0' } },
        },
        series: [
          {
            name: 'Download',
            type: 'line',
            smooth: true,
            data: speedDown,
            itemStyle: { color: '#52c41a' },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(82, 196, 26, 0.25)' },
                  { offset: 1, color: 'rgba(82, 196, 26, 0.0)' }
                ]
              }
            },
            showSymbol: speedHistory.length < 30,
          },
          {
            name: 'Upload',
            type: 'line',
            smooth: true,
            data: speedUp,
            itemStyle: { color: '#722ed1' },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(114, 46, 209, 0.25)' },
                  { offset: 1, color: 'rgba(114, 46, 209, 0.0)' }
                ]
              }
            },
            showSymbol: speedHistory.length < 30,
          },
        ],
      };
    }
  }, [metricMode, pingHistory, speedHistory, times, fullTimes, isDark]);

  const hasSpeedData = speedHistory.length > 0;

  return (
    <div>
      {hasSpeedData && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <Segmented
            size="small"
            value={metricMode}
            onChange={(val) => setMetricMode(val as 'latency' | 'bandwidth')}
            options={[
              { label: t('dashboard.avgLatency') || 'Latency', value: 'latency' },
              { label: t('dashboard.bandwidth') || 'Bandwidth', value: 'bandwidth' },
            ]}
          />
        </div>
      )}

      {currentDataset.length === 0 ? (
        <div style={{ height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Empty description={t('logs.noLogs') || 'No metrics data'} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      ) : (
        <ReactECharts option={option} style={{ height: 380 }} notMerge={true} theme={isDark ? 'dark' : 'light'} />
      )}
    </div>
  );
};

export default MetricsChart;

