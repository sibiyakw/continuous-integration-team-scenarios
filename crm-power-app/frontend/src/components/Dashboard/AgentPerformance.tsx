import React, { useState, useEffect } from 'react';
import {
  DetailsList,
  DetailsListLayoutMode,
  SelectionMode,
  IColumn,
  Stack,
  Text,
  FontSizes,
  FontWeights,
  Shimmer,
  ShimmerElementType,
  Dropdown,
  IDropdownOption,
  getTheme,
} from '@fluentui/react';
import { apiService } from '../../services/api';

interface AgentPerformanceData {
  agentId: string;
  agentName: string;
  department: string;
  ticketsHandled: number;
  ticketsAssigned: number;
  averageResolutionTime: number;
  averageFirstResponseTime: number;
  customerSatisfactionScore: number;
  utilizationRate: number;
  responseTimeDistribution: {
    under1Hour: number;
    under4Hours: number;
    under24Hours: number;
    over24Hours: number;
  };
}

const AgentPerformance: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<AgentPerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const theme = getTheme();

  useEffect(() => {
    loadAgentPerformance();
  }, [timeRange]);

  const loadAgentPerformance = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAgentPerformance(timeRange);
      setPerformanceData(response.data || []);
    } catch (error) {
      console.error('Error loading agent performance:', error);
      setPerformanceData([]);
    } finally {
      setLoading(false);
    }
  };

  const timeRangeOptions: IDropdownOption[] = [
    { key: '7d', text: 'Last 7 days' },
    { key: '30d', text: 'Last 30 days' },
    { key: '90d', text: 'Last 90 days' },
    { key: '1y', text: 'Last year' },
  ];

  const columns: IColumn[] = [
    {
      key: 'agentName',
      name: 'Agent',
      fieldName: 'agentName',
      minWidth: 150,
      isResizable: true,
    },
    {
      key: 'department',
      name: 'Department',
      fieldName: 'department',
      minWidth: 120,
    },
    {
      key: 'ticketsHandled',
      name: 'Tickets Handled',
      fieldName: 'ticketsHandled',
      minWidth: 120,
      onRender: (item: AgentPerformanceData) => (
        <Text variant="medium">{item.ticketsHandled}</Text>
      ),
    },
    {
      key: 'averageResolutionTime',
      name: 'Avg Resolution Time',
      fieldName: 'averageResolutionTime',
      minWidth: 140,
      onRender: (item: AgentPerformanceData) => (
        <Text variant="medium">{item.averageResolutionTime.toFixed(1)}h</Text>
      ),
    },
    {
      key: 'averageFirstResponseTime',
      name: 'Avg First Response',
      fieldName: 'averageFirstResponseTime',
      minWidth: 140,
      onRender: (item: AgentPerformanceData) => (
        <Text variant="medium">{item.averageFirstResponseTime.toFixed(1)}h</Text>
      ),
    },
    {
      key: 'customerSatisfactionScore',
      name: 'Customer Satisfaction',
      fieldName: 'customerSatisfactionScore',
      minWidth: 150,
      onRender: (item: AgentPerformanceData) => (
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
          <Text variant="medium">{item.customerSatisfactionScore.toFixed(1)}/5.0</Text>
          <Text
            variant="small"
            styles={{
              root: {
                color: item.customerSatisfactionScore >= 4.5
                  ? theme.palette.green
                  : item.customerSatisfactionScore >= 3.5
                  ? theme.palette.orange
                  : theme.palette.red,
              },
            }}
          >
            {item.customerSatisfactionScore >= 4.5 ? 'Excellent'
              : item.customerSatisfactionScore >= 3.5 ? 'Good'
              : 'Needs Improvement'}
          </Text>
        </Stack>
      ),
    },
    {
      key: 'utilizationRate',
      name: 'Utilization',
      fieldName: 'utilizationRate',
      minWidth: 100,
      onRender: (item: AgentPerformanceData) => (
        <Text variant="medium">{item.utilizationRate.toFixed(0)}%</Text>
      ),
    },
  ];

  if (loading) {
    return (
      <Stack tokens={{ childrenGap: 16 }}>
        <Text
          variant="xLarge"
          styles={{
            root: {
              fontWeight: FontWeights.semibold,
              marginBottom: '16px',
            },
          }}
        >
          Team Performance
        </Text>

        <Shimmer
          width="200px"
          height={32}
          shimmerElementType={ShimmerElementType.line}
          styles={{ root: { marginBottom: '16px' } }}
        />

        {Array.from({ length: 5 }).map((_, index) => (
          <Shimmer
            key={index}
            width="100%"
            height={60}
            shimmerElementType={ShimmerElementType.line}
            styles={{ root: { marginBottom: '8px' } }}
          />
        ))}
      </Stack>
    );
  }

  return (
    <Stack tokens={{ childrenGap: 24 }}>
      {/* Header */}
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
        <Text
          variant="xLarge"
          styles={{
            root: {
              fontWeight: FontWeights.semibold,
            },
          }}
        >
          Team Performance
        </Text>

        <Dropdown
          options={timeRangeOptions}
          selectedKey={timeRange}
          onChange={(e, option) => setTimeRange(option?.key as string)}
          styles={{
            root: {
              minWidth: 150,
            },
          }}
        />
      </Stack>

      {performanceData.length === 0 ? (
        <Stack
          horizontalAlign="center"
          verticalAlign="center"
          styles={{
            root: {
              padding: '60px 20px',
              border: `1px solid ${theme.palette.neutralLight}`,
              borderRadius: '4px',
              backgroundColor: theme.palette.white,
            },
          }}
        >
          <Text
            variant="large"
            styles={{
              root: {
                color: theme.palette.neutralSecondary,
                textAlign: 'center',
              },
            }}
          >
            No performance data available for the selected time range.
          </Text>
        </Stack>
      ) : (
        <Stack tokens={{ childrenGap: 16 }}>
          {/* Performance Table */}
          <div style={{
            border: `1px solid ${theme.palette.neutralLight}`,
            borderRadius: '4px',
            backgroundColor: theme.palette.white,
            overflow: 'hidden',
          }}>
            <DetailsList
              items={performanceData}
              columns={columns}
              selectionMode={SelectionMode.none}
              layoutMode={DetailsListLayoutMode.justified}
              isHeaderVisible={true}
            />
          </div>

          {/* Performance Summary */}
          <Stack horizontal tokens={{ childrenGap: 24 }} wrap>
            {performanceData.slice(0, 3).map((agent, index) => (
              <Stack.Item key={agent.agentId} grow={1} minWidth={250}>
                <div style={{
                  padding: '16px',
                  border: `1px solid ${theme.palette.neutralLight}`,
                  borderRadius: '4px',
                  backgroundColor: theme.palette.white,
                }}>
                  <Text
                    variant="medium"
                    styles={{
                      root: {
                        fontWeight: FontWeights.semibold,
                        marginBottom: '8px',
                      },
                    }}
                  >
                    {index === 0 ? '🏆 Top Performer' : index === 1 ? '🥈 Second Place' : '🥉 Third Place'}
                  </Text>

                  <Text
                    variant="large"
                    styles={{
                      root: {
                        fontWeight: FontWeights.semibold,
                        marginBottom: '4px',
                      },
                    }}
                  >
                    {agent.agentName}
                  </Text>

                  <Text
                    variant="small"
                    styles={{
                      root: {
                        color: theme.palette.neutralSecondary,
                        marginBottom: '12px',
                      },
                    }}
                  >
                    {agent.department}
                  </Text>

                  <Stack tokens={{ childrenGap: 4 }}>
                    <Text variant="small">
                      <strong>{agent.ticketsHandled}</strong> tickets handled
                    </Text>
                    <Text variant="small">
                      <strong>{agent.customerSatisfactionScore.toFixed(1)}</strong> satisfaction score
                    </Text>
                    <Text variant="small">
                      <strong>{agent.utilizationRate.toFixed(0)}%</strong> utilization rate
                    </Text>
                  </Stack>
                </div>
              </Stack.Item>
            ))}
          </Stack>
        </Stack>
      )}
    </Stack>
  );
};

export default AgentPerformance;