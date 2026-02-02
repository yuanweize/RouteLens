import React, { useEffect, useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

interface MapChartProps {
  trace?: any;
  isDark: boolean;
}

const MapChart: React.FC<MapChartProps> = ({ trace, isDark }) => {
  const [ready, setReady] = useState(false);
  const { i18n } = useTranslation();

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

  // Helper function to get localized location name
  const getLocalizedName = (h: any) => {
    const lang = i18n.language;
    if (lang === 'zh-CN' || lang === 'zh') {
      // Chinese: prefer zh fields
      return h.city || h.subdiv || h.host || h.ip;
    } else {
      // English: prefer *_en fields
      return h.city_en || h.subdiv_en || h.city || h.subdiv || h.host || h.ip;
    }
  };

  // High-Precision Mode: Filter out low-precision nodes (country-level only)
  // Only include nodes with city or subdivision precision for accurate map lines
  const highPrecisionPoints = useMemo(() => {
    const hops = traceData?.hops || [];
    return hops
      .filter((h: any) => {
        if (!Number.isFinite(h.lon) || !Number.isFinite(h.lat)) return false;
        if (h.lon === 0 && h.lat === 0) return false;
        const precision = h.geo_precision || '';
        if (precision === 'country' || precision === 'none') return false;
        if (!precision && !h.city && !h.subdiv) return false;
        return true;
      })
      .map((h: any) => ({
        name: getLocalizedName(h),
        value: [h.lon, h.lat],
        latency: h.latency_last_ms || h.latency_avg_ms || h.latency_ms || 0,
        hop: h.hop,
      }));
  }, [traceData, i18n.language]);

  // All points for scatter display (including low-precision)
  const allPoints = useMemo(() => {
    const hops = traceData?.hops || [];
    return hops
      .filter((h: any) => Number.isFinite(h.lon) && Number.isFinite(h.lat) && (h.lon !== 0 || h.lat !== 0))
      .map((h: any) => ({
        name: getLocalizedName(h),
        value: [h.lon, h.lat],
        latency: h.latency_last_ms || h.latency_avg_ms || h.latency_ms || 0,
        hop: h.hop,
        precision: h.geo_precision || (h.city ? 'city' : h.subdiv ? 'subdivision' : 'country'),
      }));
  }, [traceData, i18n.language]);

  // Calculate bounding box for auto-zoom
  const boundingBox = useMemo(() => {
    if (allPoints.length === 0) return null;
    
    let minLon = Infinity, maxLon = -Infinity;
    let minLat = Infinity, maxLat = -Infinity;
    
    allPoints.forEach((p: any) => {
      const [lon, lat] = p.value;
      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    });
    
    // Add padding (10% on each side)
    const lonPadding = (maxLon - minLon) * 0.15 || 10;
    const latPadding = (maxLat - minLat) * 0.15 || 10;
    
    return {
      minLon: minLon - lonPadding,
      maxLon: maxLon + lonPadding,
      minLat: minLat - latPadding,
      maxLat: maxLat + latPadding,
      centerLon: (minLon + maxLon) / 2,
      centerLat: (minLat + maxLat) / 2,
    };
  }, [allPoints]);

  const colorForLatency = (latency: number) => {
    if (latency > 200) return '#ff4d4f';
    if (latency > 100) return '#faad14';
    return '#52c41a';
  };

  // Build line segments using HIGH PRECISION points only
  const segments = useMemo(() => {
    const segs: any[] = [];
    for (let i = 0; i < highPrecisionPoints.length - 1; i += 1) {
      const curr = highPrecisionPoints[i];
      const next = highPrecisionPoints[i + 1];
      segs.push({
        name: traceData?.target || 'trace',
        coords: [curr.value, next.value],
        lineStyle: { color: colorForLatency(next.latency) },
      });
    }
    return segs;
  }, [highPrecisionPoints, traceData]);

  // Calculate zoom level based on bounding box span
  const zoomLevel = useMemo(() => {
    if (!boundingBox || allPoints.length < 2) return 1.2;
    const lonSpan = boundingBox.maxLon - boundingBox.minLon;
    const latSpan = boundingBox.maxLat - boundingBox.minLat;
    const maxSpan = Math.max(lonSpan, latSpan);
    
    // Zoom level mapping based on geographic span
    if (maxSpan > 150) return 1;
    if (maxSpan > 100) return 1.3;
    if (maxSpan > 60) return 1.8;
    if (maxSpan > 30) return 2.5;
    if (maxSpan > 15) return 3.5;
    if (maxSpan > 8) return 5;
    if (maxSpan > 4) return 6;
    return 7;
  }, [boundingBox, allPoints.length]);

  const option = useMemo(() => {
    const isZh = i18n.language === 'zh-CN' || i18n.language === 'zh';
    const precisionLabels = {
      city: isZh ? '🎯 城市' : '🎯 City',
      subdivision: isZh ? '📍 省份' : '📍 Province',
      country: isZh ? '🌐 国家' : '🌐 Country',
    };
    
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          if (params.seriesType === 'effectScatter') {
            const latency = params.data?.latency ?? 0;
            const precision = params.data?.precision || '';
            const precisionLabel = precisionLabels[precision as keyof typeof precisionLabels] || precisionLabels.country;
            const hopLabel = isZh ? '跳数' : 'Hop';
            const latencyLabel = isZh ? '延迟' : 'Latency';
            const precisionText = isZh ? '精度' : 'Precision';
            return `<b>${params.name}</b><br/>${hopLabel}: ${params.data?.hop || '-'}<br/>${latencyLabel}: ${latency.toFixed(1)}ms<br/>${precisionText}: ${precisionLabel}`;
          }
          return params.name;
        },
      },
      geo: {
        map: 'world',
        roam: true,
        center: boundingBox ? [boundingBox.centerLon, boundingBox.centerLat] : [0, 20],
        zoom: zoomLevel,
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
          effect: { show: true, period: 4, trailLength: 0.7, color: '#fff', symbolSize: 3 },
          lineStyle: { width: 0, curveness: 0.2 },
          data: segments,
        },
        {
          type: 'lines',
          coordinateSystem: 'geo',
          polyline: true,
          zlevel: 2,
          symbol: ['none', 'arrow'],
          symbolSize: 10,
          lineStyle: { width: 2, opacity: 0.7, curveness: 0.2 },
          data: segments,
        },
        {
          type: 'effectScatter',
          coordinateSystem: 'geo',
          zlevel: 3,
          rippleEffect: { brushType: 'stroke' },
          label: {
            show: true,
            position: 'right',
            formatter: (params: any) => (params.data?.precision === 'country' ? '' : params.name),
          },
          symbolSize: (_val: any, params: any) => (params.data?.precision === 'country' ? 6 : 10),
          itemStyle: { color: (params: any) => (params.data?.precision === 'country' ? '#666' : '#1677ff') },
          data: allPoints,
        },
      ],
    };
  }, [boundingBox, zoomLevel, isDark, segments, allPoints, i18n.language]);

  return (
    <div className="map-container">
      {ready && <ReactECharts option={option} style={{ height: '100%', width: '100%' }} notMerge={true} theme={isDark ? 'dark' : 'light'} />}
    </div>
  );
};

export default MapChart;
