import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import axios from 'axios';

const MapChart: React.FC = () => {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const fetchMap = async () => {
            try {
                const res = await axios.get('https://raw.githubusercontent.com/apache/echarts/master/test/data/map/json/world.json');
                echarts.registerMap('world', res.data);
                setIsLoaded(true);
            } catch (err) { console.error(err); }
        };
        fetchMap();
    }, []);

    // Simulated path data for demonstration
    // In production, this comes from backend Traceroute JSON
    const linesData = [
        {
            coords: [[116.46, 39.92], [2.35, 48.85]], // Beijing -> Paris
            lineStyle: { color: '#165dff' }
        },
        {
            coords: [[2.35, 48.85], [-74.00, 40.71]], // Paris -> New York
            lineStyle: { color: '#00b42a' }
        },
        {
            coords: [[-74.00, 40.71], [116.46, 39.92]], // New York -> Beijing
            lineStyle: { color: '#ff7d00' }
        }
    ];

    const option = {
        backgroundColor: 'transparent',
        tooltip: { trigger: 'item' },
        geo: {
            map: 'world',
            roam: true,
            silent: true,
            itemStyle: {
                areaColor: 'var(--color-fill-3)',
                borderColor: 'var(--color-border-3)'
            }
        },
        series: [
            {
                type: 'lines',
                coordinateSystem: 'geo',
                zlevel: 1,
                effect: {
                    show: true,
                    period: 4,
                    trailLength: 0.7,
                    color: '#fff',
                    symbolSize: 3
                },
                lineStyle: {
                    width: 0,
                    curveness: 0.2
                },
                data: linesData
            },
            {
                type: 'lines',
                coordinateSystem: 'geo',
                zlevel: 2,
                symbol: ['none', 'arrow'],
                symbolSize: 10,
                effect: {
                    show: true,
                    period: 4,
                    trailLength: 0,
                    symbol: 'circle',
                    symbolSize: 1
                },
                lineStyle: {
                    width: 1,
                    opacity: 0.6,
                    curveness: 0.2
                },
                data: linesData
            }
        ]
    };

    return (
        <div style={{ height: '450px', width: '100%' }}>
            {isLoaded ? <ReactECharts option={option} style={{ height: '100%', width: '100%' }} /> : 'Loading Map...'}
        </div>
    );
};

export default MapChart;
