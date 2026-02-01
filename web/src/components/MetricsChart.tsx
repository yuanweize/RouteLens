import React from 'react';
import ReactECharts from 'echarts-for-react';
import { Tabs } from '@arco-design/web-react';

const { TabPane } = Tabs;

interface MetricsChartProps {
    history: any[]; // MonitorRecord[]
}

const MetricsChart: React.FC<MetricsChartProps> = ({ history }) => {

    const getOption = (metric: 'latency' | 'loss' | 'speed') => {
        const times = history.map(h => new Date(h.CreatedAt).toLocaleTimeString());

        let seriesData = [];
        let yAxisName = '';
        let type = 'line';

        if (metric === 'latency') {
            seriesData = history.map(h => h.LatencyMs);
            yAxisName = 'ms';
        } else if (metric === 'loss') {
            seriesData = history.map(h => h.PacketLoss);
            yAxisName = '%';
            type = 'area'; // Gradient area?
        } else {
            // Speed Down
            seriesData = history.map(h => h.SpeedDown);
            yAxisName = 'Mbps';
            type = 'bar';
        }

        return {
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: times },
            yAxis: { type: 'value', name: yAxisName },
            series: [{
                data: seriesData,
                type: type === 'area' ? 'line' : type,
                areaStyle: metric === 'loss' ? {} : undefined,
                smooth: true
            }]
        };
    };

    return (
        <Tabs defaultActiveTab="latency">
            <TabPane key="latency" title="Latency & Jitter">
                <ReactECharts option={getOption('latency')} style={{ height: 300 }} />
            </TabPane>
            <TabPane key="loss" title="Packet Loss">
                <ReactECharts option={getOption('loss')} style={{ height: 300 }} />
            </TabPane>
            <TabPane key="speed" title="Bandwidth">
                <ReactECharts option={getOption('speed')} style={{ height: 300 }} />
            </TabPane>
        </Tabs>
    );
};

export default MetricsChart;
