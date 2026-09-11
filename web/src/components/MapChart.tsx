import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { Spin, Button, Result, Tooltip } from 'antd';
import { ReloadOutlined, CompressOutlined } from '@ant-design/icons';

interface MapChartProps {
  trace?: any;
  isDark: boolean;
}

interface ClusteredNode {
  name: string;
  coord: [number, number];
  hops: number[];
  firstHop: number;
  lastHop: number;
  latency: number;
  precision: string;
  isStart?: boolean;
  isEnd?: boolean;
}

const MapChart: React.FC<MapChartProps> = ({ trace, isDark }) => {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const echartsRef = useRef<any>(null);
  const { i18n } = useTranslation();

  const fetchMap = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let geoData: any;
      try {
        // Priority 1: Local bundled geojson
        const res = await axios.get('/world.json', { timeout: 8000 });
        if (typeof res.data === 'string') {
          if (res.data.trim().startsWith('<')) {
            throw new Error('Received HTML instead of GeoJSON');
          }
          geoData = JSON.parse(res.data);
        } else {
          geoData = res.data;
        }
      } catch (localErr) {
        console.warn('Local world.json load failed, trying remote fallback:', localErr);
        // Priority 2: Remote fallback
        const res = await axios.get('https://raw.githubusercontent.com/apache/echarts/master/test/data/map/json/world.json', { timeout: 10000 });
        geoData = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
      }
      echarts.registerMap('world', geoData);
      setReady(true);
    } catch (err: any) {
      console.error('Failed to load world map:', err);
      setError(err?.message || 'Failed to load world map data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMap();
  }, [fetchMap]);

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

  // Helper to format localized location name
  const getLocalizedName = useCallback((h: any) => {
    const lang = i18n.language;
    if (lang === 'zh-CN' || lang === 'zh') {
      return h.city || h.subdiv || h.country || h.host || h.ip;
    }
    return h.city_en || h.subdiv_en || h.country_en || h.city || h.subdiv || h.host || h.ip;
  }, [i18n.language]);

  // Cluster co-located hops to prevent stacking multiple big circles on the same spot
  const clusteredNodes = useMemo(() => {
    const hops = traceData?.hops || [];
    const validHops = hops.filter((h: any) => {
      const lon = h.lon ?? h.longitude;
      const lat = h.lat ?? h.latitude;
      return Number.isFinite(lon) && Number.isFinite(lat) && (lon !== 0 || lat !== 0);
    });

    if (validHops.length === 0) return [];

    const map = new Map<string, ClusteredNode>();

    validHops.forEach((h: any) => {
      const lon = h.lon ?? h.longitude;
      const lat = h.lat ?? h.latitude;
      // Key with ~10km precision to group co-located gateway hops
      const key = `${lon.toFixed(1)}_${lat.toFixed(1)}`;
      const latVal = h.latency_last_ms || h.latency_avg_ms || h.latency_ms || 0;
      const name = getLocalizedName(h);
      const precision = h.geo_precision || (h.city ? 'city' : h.subdiv ? 'subdivision' : 'country');

      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          name,
          coord: [lon, lat],
          hops: [h.hop],
          firstHop: h.hop,
          lastHop: h.hop,
          latency: latVal,
          precision,
        });
      } else {
        existing.hops.push(h.hop);
        existing.firstHop = Math.min(existing.firstHop, h.hop);
        existing.lastHop = Math.max(existing.lastHop, h.hop);
        existing.latency = latVal; // Update with latest hop latency
        if (precision === 'city' && existing.precision !== 'city') {
          existing.name = name;
          existing.precision = precision;
        }
      }
    });

    const list = Array.from(map.values()).sort((a, b) => a.firstHop - b.firstHop);

    if (list.length > 0) {
      list[0].isStart = true;
      list[list.length - 1].isEnd = true;
    }
    return list;
  }, [traceData, getLocalizedName]);

  // Calculate bounding box for auto-zoom
  const boundingBox = useMemo(() => {
    if (clusteredNodes.length === 0) return null;

    let minLon = Infinity, maxLon = -Infinity;
    let minLat = Infinity, maxLat = -Infinity;

    clusteredNodes.forEach((node) => {
      const [lon, lat] = node.coord;
      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    });

    if (minLon === maxLon) {
      minLon -= 8;
      maxLon += 8;
    }
    if (minLat === maxLat) {
      minLat -= 6;
      maxLat += 6;
    }

    const lonSpan = maxLon - minLon;
    const latSpan = maxLat - minLat;

    // Generous padding so dots and labels are not cut off at borders
    const lonPadding = Math.max(lonSpan * 0.25, 8);
    const latPadding = Math.max(latSpan * 0.25, 6);

    return {
      minLon: minLon - lonPadding,
      maxLon: maxLon + lonPadding,
      minLat: minLat - latPadding,
      maxLat: maxLat + latPadding,
      centerLon: (minLon + maxLon) / 2,
      centerLat: (minLat + maxLat) / 2,
      lonSpan,
      latSpan,
    };
  }, [clusteredNodes]);

  // Tuned auto-zoom level mapping
  const zoomLevel = useMemo(() => {
    if (!boundingBox || clusteredNodes.length < 2) return 1.2;
    const maxSpan = Math.max(boundingBox.lonSpan, boundingBox.latSpan);

    if (maxSpan > 150) return 1.1;
    if (maxSpan > 80) return 1.35; // Global / Continental (e.g. Europe to China ~100 deg)
    if (maxSpan > 45) return 1.9;
    if (maxSpan > 20) return 2.8;
    if (maxSpan > 10) return 3.8;
    if (maxSpan > 5) return 5.0;
    return 6.0;
  }, [boundingBox, clusteredNodes.length]);

  const colorForLatency = (latency: number) => {
    if (latency > 200) return '#ef4444'; // Red
    if (latency > 100) return '#f59e0b'; // Amber
    return '#10b981'; // Green
  };

  // Line segments between clustered sequential nodes
  const segments = useMemo(() => {
    if (clusteredNodes.length < 2) return [];
    const segs: any[] = [];
    for (let i = 0; i < clusteredNodes.length - 1; i++) {
      const curr = clusteredNodes[i];
      const next = clusteredNodes[i + 1];
      segs.push({
        name: `${curr.name} → ${next.name}`,
        coords: [curr.coord, next.coord],
        lineStyle: {
          color: colorForLatency(next.latency),
        },
      });
    }
    return segs;
  }, [clusteredNodes]);

  // Partition nodes: Start & End get subtle ripple effects; Intermediate transit nodes use clean dots
  const endpointNodes = useMemo(() => {
    return clusteredNodes.filter((n) => n.isStart || n.isEnd);
  }, [clusteredNodes]);

  const transitNodes = useMemo(() => {
    return clusteredNodes.filter((n) => !n.isStart && !n.isEnd);
  }, [clusteredNodes]);

  // Reset view handler
  const handleResetView = () => {
    const instance = echartsRef.current?.getEchartsInstance();
    if (instance && boundingBox) {
      instance.setOption({
        geo: {
          center: [boundingBox.centerLon, boundingBox.centerLat],
          zoom: zoomLevel,
        },
      });
    }
  };

  const option = useMemo(() => {
    const isZh = i18n.language === 'zh-CN' || i18n.language === 'zh';
    const precisionLabels: Record<string, string> = {
      city: isZh ? '🎯 城市' : '🎯 City',
      subdivision: isZh ? '📍 省份' : '📍 Province',
      country: isZh ? '🌐 国家' : '🌐 Country',
    };

    const labelStyle = {
      show: true,
      position: 'top' as const,
      distance: 6,
      fontSize: 11,
      fontWeight: 500,
      color: isDark ? '#f1f5f9' : '#0f172a',
      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.82)' : 'rgba(255, 255, 255, 0.88)',
      padding: [2, 6],
      borderRadius: 4,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
      borderWidth: 1,
      shadowColor: 'rgba(0,0,0,0.2)',
      shadowBlur: 4,
    };

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.95)',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
        textStyle: { color: isDark ? '#f8fafc' : '#0f172a', fontSize: 12 },
        formatter: (params: any) => {
          if (params.seriesType === 'effectScatter' || params.seriesType === 'scatter') {
            const data = params.data as ClusteredNode;
            if (!data) return params.name;
            const hopRange = data.hops.length > 1 ? `#${data.firstHop} - #${data.lastHop}` : `#${data.firstHop}`;
            const precisionLabel = precisionLabels[data.precision] || precisionLabels.country;
            const role = data.isStart ? (isZh ? ' [起点]' : ' [Origin]') : data.isEnd ? (isZh ? ' [终点]' : ' [Destination]') : '';
            return `
              <div style="font-weight: 600; margin-bottom: 4px; color: ${isDark ? '#38bdf8' : '#0284c7'}">
                ${data.name} ${role}
              </div>
              <div style="font-size: 11px; line-height: 1.6;">
                ${isZh ? '跳数' : 'Hop'}: <b>${hopRange}</b><br/>
                ${isZh ? '延迟' : 'Latency'}: <b>${data.latency.toFixed(1)} ms</b><br/>
                ${isZh ? '精度' : 'Precision'}: ${precisionLabel}
              </div>
            `;
          }
          if (params.seriesType === 'lines') {
            return params.name;
          }
          return params.name;
        },
      },
      geo: {
        map: 'world',
        roam: true,
        center: boundingBox ? [boundingBox.centerLon, boundingBox.centerLat] : [20, 25],
        zoom: zoomLevel,
        itemStyle: {
          areaColor: isDark ? '#181e29' : '#f1f5f9',
          borderColor: isDark ? '#273244' : '#cbd5e1',
          borderWidth: 0.8,
        },
        emphasis: {
          itemStyle: { areaColor: isDark ? '#222d3d' : '#e2e8f0' },
          label: { show: false },
        },
      },
      series: [
        // 1. Moving flight particle effect
        {
          type: 'lines',
          coordinateSystem: 'geo',
          zlevel: 1,
          effect: {
            show: true,
            period: 5,
            trailLength: 0.6,
            color: '#38bdf8',
            symbol: 'circle',
            symbolSize: 3.5,
          },
          lineStyle: { width: 0, curveness: 0.2 },
          data: segments,
        },
        // 2. Main route lines with subtle arrow
        {
          type: 'lines',
          coordinateSystem: 'geo',
          zlevel: 2,
          symbol: ['none', 'arrow'],
          symbolSize: 6,
          lineStyle: {
            width: 2.2,
            opacity: 0.75,
            curveness: 0.2,
          },
          data: segments,
        },
        // 3. Transit intermediate nodes (clean, neat solid dots without overwhelming ripple)
        {
          type: 'scatter',
          coordinateSystem: 'geo',
          zlevel: 3,
          symbolSize: 6,
          itemStyle: {
            color: isDark ? '#0284c7' : '#38bdf8',
            borderColor: '#ffffff',
            borderWidth: 1.2,
          },
          label: {
            ...labelStyle,
            formatter: (params: any) => params.data?.name || '',
          },
          labelLayout: { hideOverlap: true, moveOverlap: 'shiftY' },
          data: transitNodes.map((n) => ({
            ...n,
            value: n.coord,
          })),
        },
        // 4. Start and End endpoints (distinctive ripple effect)
        {
          type: 'effectScatter',
          coordinateSystem: 'geo',
          zlevel: 4,
          rippleEffect: {
            brushType: 'stroke',
            scale: 2.8,
            period: 3,
          },
          symbolSize: 8,
          itemStyle: {
            color: (params: any) => {
              const d = params.data as ClusteredNode;
              if (d?.isStart) return '#10b981'; // Green for origin
              return colorForLatency(d?.latency ?? 0); // Dynamic for destination
            },
            borderColor: '#ffffff',
            borderWidth: 1.5,
          },
          label: {
            ...labelStyle,
            fontSize: 12,
            fontWeight: 600,
            formatter: (params: any) => {
              const d = params.data as ClusteredNode;
              const rolePrefix = d?.isStart ? '● ' : '★ ';
              return `${rolePrefix}${d?.name || ''}`;
            },
          },
          labelLayout: { hideOverlap: true, moveOverlap: 'shiftY' },
          data: endpointNodes.map((n) => ({
            ...n,
            value: n.coord,
          })),
        },
      ],
    };
  }, [boundingBox, zoomLevel, isDark, segments, transitNodes, endpointNodes, i18n.language]);

  return (
    <div
      className="map-container"
      style={{
        position: 'relative',
        height: 430,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderRadius: 8,
      }}
    >
      {loading && !ready && (
        <Spin tip={i18n.language === 'zh-CN' ? '正在加载世界地图数据...' : 'Loading world map data...'} size="large" />
      )}
      {error && !ready && (
        <Result
          status="warning"
          title={i18n.language === 'zh-CN' ? '地图数据加载失败' : 'Failed to load map data'}
          subTitle={error}
          extra={
            <Button type="primary" icon={<ReloadOutlined />} onClick={fetchMap}>
              {i18n.language === 'zh-CN' ? '重试加载' : 'Retry'}
            </Button>
          }
        />
      )}
      {ready && (
        <>
          <ReactECharts
            ref={echartsRef}
            key={traceData?.target || 'trace-map'}
            option={option}
            style={{ height: '100%', width: '100%' }}
            notMerge={true}
            lazyUpdate={true}
            theme={isDark ? 'dark' : 'light'}
          />
          {/* Quick Floating Map Toolbar */}
          {clusteredNodes.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                zIndex: 10,
                display: 'flex',
                gap: 6,
              }}
            >
              <Tooltip title={i18n.language === 'zh-CN' ? '重置视野居中' : 'Reset View'}>
                <Button
                  size="small"
                  icon={<CompressOutlined />}
                  onClick={handleResetView}
                  style={{
                    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(4px)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
                  }}
                />
              </Tooltip>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MapChart;
