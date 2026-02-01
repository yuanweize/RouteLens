import React from 'react';
import { Card, Typography } from 'antd';

const About: React.FC = () => {
  return (
    <Card className="page-card" title="About RouteLens">
      <Typography.Paragraph>
        RouteLens is a modern, agentless network observability platform built with Go + React.
      </Typography.Paragraph>
      <Typography.Paragraph type="secondary">
        Version v1.1.0 | Ant Design v5 | ECharts
      </Typography.Paragraph>
    </Card>
  );
};

export default About;
