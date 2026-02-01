import React, { useEffect, useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import axios from 'axios';

interface MapChartProps {
  trace?: any;
  isDark: boolean;
}

const MapChart: React.FC<MapChartProps> = ({ trace, isDark }) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const fetchMap = async () => {
      const res = await axios.get('https://raw.githubusercontent.com/apache/echarts/master/test/data/map/json/world.json');
      echarts.registerMap('world', res.data);
      setReady(true);
    };
    fetchMap();
  }, []);

  const traceData = useMemo(() => {
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

  const points = (traceData?.hops || [])
    .filter((h: any) => Number.isFinite(h.lon) && Number.isFinite(h.lat) && (h.lon !== 0 || h.lat !== 0))
    .map((h: any) => ({
      name: h.ip,
      value: [h.lon, h.lat],
      latency: h.latency_ms,
    }));

  const lineCoords = points.map((p: any) => p.value);
  const lines = lineCoords.length >= 2 ? [{
    name: traceData?.target || 'trace',
    coords: lineCoords,
    lineStyle: { color: '#1677ff' },
  }] : [];

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        if (params.seriesType === 'effectScatter') {
          const latency = params.data?.latency ?? 0;
          return `Node: ${params.name}<br/>Latency: ${latency.toFixed(1)}ms`;
        }
        return params.name;
      },
    },
    geo: {
      map: 'world',
      roam: true,
      itemStyle: {
        areaColor: isDark ? '#1f1f1f' : '#f0f5ff',
        borderColor: isDark ? '#2f2f2f' : '#d6e4ff',
      },
      emphasis: {
        itemStyle: { areaColor: isDark ? '#2a2a2a' : '#d6e4ff' },
      },
    },
    series: [
      {
        type: 'lines',
        coordinateSystem: 'geo',
        polyline: true,
        zlevel: 1,
        effect: {
          show: true,
          period: 4,
          trailLength: 0.7,
          color: '#fff',
          symbolSize: 3,
        },
        lineStyle: {
          width: 0,
          curveness: 0.2,
        },
        data: lines,
      },
      {
        type: 'lines',
        coordinateSystem: 'geo',
        polyline: true,
        zlevel: 2,
        symbol: ['none', 'arrow'],
        symbolSize: 10,
        lineStyle: {
          width: 2,
          opacity: 0.7,
          curveness: 0.2,
        },
        data: lines,
      },
      {
        type: 'effectScatter',
        coordinateSystem: 'geo',
        zlevel: 3,
        rippleEffect: { brushType: 'stroke' },
        label: { show: true, position: 'right', formatter: '{b}' },
        symbolSize: 10,
        itemStyle: { color: '#1677ff' },
        data: points,
      },
    ],
  };

  return (
    <div className="map-container">
      {ready && <ReactECharts option={option} style={{ height: '100%', width: '100%' }} notMerge={true} theme={isDark ? 'dark' : 'light'} />}
    </div>
  );
};

export default MapChart;
