import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import axios from 'axios';

const MapChart: React.FC = () => {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Fetch World Map GeoJSON
        const fetchMap = async () => {
            try {
                const res = await axios.get('https://raw.githubusercontent.com/apache/echarts/master/test/data/map/json/world.json');
                echarts.registerMap('world', res.data);
                setIsLoaded(true);
            } catch (err) {
                console.error("Failed to load map data", err);
            }
        };
        fetchMap();
    }, []);

    const option = {
        backgroundColor: 'transparent',
        geo: {
            map: 'world',
            roam: true,
            label: {
                emphasis: {
                    show: false
                }
            },
            itemStyle: {
                normal: {
                    areaColor: '#323c48',
                    borderColor: '#111'
                },
                emphasis: {
                    areaColor: '#2a333d'
                }
            }
        },
        series: [
            // TOD0: Add Lines for Traceroute paths
            {
                type: 'lines',
                coordinateSystem: 'geo',
                effect: {
                    show: true,
                    period: 6,
                    trailLength: 0.7,
                    color: '#fff',
                    symbolSize: 3
                },
                lineStyle: {
                    normal: {
                        color: '#a6c84c',
                        width: 0,
                        curveness: 0.2
                    }
                },
                data: [] // To be populated from props
            }
        ]
    };

    return (
        <div style={{ height: '400px', width: '100%' }}>
            {isLoaded ? <ReactECharts option={option} style={{ height: '100%', width: '100%' }} /> : 'Loading Map...'}
        </div>
    );
};

export default MapChart;
