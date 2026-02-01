import React, { useState } from 'react';
import { Card, Select, Button, Space, Tag, Typography, Empty } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { useTranslation } from 'react-i18next';
import { getLogs } from '../api';
import type { LogEntry } from '../api';
import { useTheme } from '../context/ThemeContext';

const levelColors: Record<string, string> = {
  DEBUG: 'default',
  INFO: 'blue',
  WARN: 'orange',
  ERROR: 'red',
};

const Logs: React.FC = () => {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [lines, setLines] = useState<number>(100);

  const { data, loading, refresh } = useRequest(
    () => getLogs({ lines, level: levelFilter || undefined }),
    { refreshDeps: [lines, levelFilter] }
  );

  const logs = data?.logs || [];

  const formatTimestamp = (ts: string) => {
    const date = new Date(ts);
    return date.toLocaleString();
  };

  return (
    <Card
      className="page-card"
      title={t('logs.title')}
      extra={
        <Space>
          <Select
            style={{ width: 120 }}
            value={levelFilter}
            onChange={setLevelFilter}
            options={[
              { label: t('logs.allLevels'), value: '' },
              { label: 'DEBUG', value: 'DEBUG' },
              { label: 'INFO', value: 'INFO' },
              { label: 'WARN', value: 'WARN' },
              { label: 'ERROR', value: 'ERROR' },
            ]}
          />
          <Select
            style={{ width: 100 }}
            value={lines}
            onChange={setLines}
            options={[
              { label: '50', value: 50 },
              { label: '100', value: 100 },
              { label: '200', value: 200 },
              { label: '500', value: 500 },
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={refresh} loading={loading}>
            {t('logs.refresh')}
          </Button>
        </Space>
      }
    >
      <div
        className="log-terminal"
        style={{
          background: isDark ? '#1a1a1a' : '#0d1117',
          color: '#c9d1d9',
          padding: 16,
          borderRadius: 8,
          fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, monospace',
          fontSize: 12,
          lineHeight: 1.6,
          minHeight: 500,
          maxHeight: 'calc(100vh - 300px)',
          overflowY: 'auto',
        }}
      >
        {logs.length === 0 ? (
          <Empty
            description={<span style={{ color: '#8b949e' }}>{t('logs.noLogs')}</span>}
            style={{ paddingTop: 100 }}
          />
        ) : (
          logs.map((entry: LogEntry, idx: number) => (
            <div key={idx} style={{ marginBottom: 4, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <Typography.Text style={{ color: '#8b949e', flexShrink: 0, fontSize: 11 }}>
                {formatTimestamp(entry.timestamp)}
              </Typography.Text>
              <Tag
                color={levelColors[entry.level] || 'default'}
                style={{ margin: 0, flexShrink: 0, fontSize: 10, lineHeight: '16px' }}
              >
                {entry.level}
              </Tag>
              {entry.source && (
                <Typography.Text style={{ color: '#58a6ff', flexShrink: 0 }}>
                  [{entry.source}]
                </Typography.Text>
              )}
              <Typography.Text
                style={{
                  color: entry.level === 'ERROR' ? '#f85149' : entry.level === 'WARN' ? '#d29922' : '#c9d1d9',
                  wordBreak: 'break-word',
                }}
              >
                {entry.message}
              </Typography.Text>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default Logs;
