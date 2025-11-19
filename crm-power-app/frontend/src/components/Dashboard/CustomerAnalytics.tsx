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

interface CustomerAnalyticsData {
  customerId: string;
  customerName: string;
  customerEmail: string;
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  averageResolutionTime: number;
  customerSatisfactionScore: number;
  firstContactResolution: number;
  ticketVolume: Array<{
    month: string;
    count: number;
  }>;
}

const CustomerAnalytics: React.FC = () => {
  const [customerData, setCustomerData] = useState<CustomerAnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const theme = getTheme();

  useEffect(() => {
    loadCustomerAnalytics();
  }, [timeRange]);

  const loadCustomerAnalytics = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCustomerAnalytics();
      setCustomerData(response.data || []);
    } catch (error) {
      console.error('Error loading customer analytics:', error);
      setCustomerData([]);
    } finally {
      setLoading(false);
    }
  };

  const timeRangeOptions: IDropdownOption[] = [
    { key: '30d', text: 'Last 30 days' },
    { key: '90d', text: 'Last 90 days' },
    { key: '1y', text: 'Last year' },
  ];

  const columns: IColumn[] = [
    {
      key: 'customerName',
      name: 'Customer',
      fieldName: 'customerName',
      minWidth: 150,
      isResizable: true,
      onRender: (item: CustomerAnalyticsData) => (
        <div>
          <Text variant="medium" styles={{ root: { fontWeight: FontWeights.semibold } }}>
            {item.customerName}
          </Text>
          <Text
            variant="small"
            styles={{ root: { color: theme.palette.neutralSecondary } }}
          >
            {item.customerEmail}
          </Text>
        </div>
      ),
    },
    {
      key: 'totalTickets',
      name: 'Total Tickets',
      fieldName: 'totalTickets',
      minWidth: 100,
      onRender: (item: CustomerAnalyticsData) => (
        <Text variant="medium">{item.totalTickets}</Text>
      ),
    },
    {
      key: 'openTickets',
      name: 'Open Tickets',
      fieldName: 'openTickets',
      minWidth: 100,
      onRender: (item: CustomerAnalyticsData) => (
        <Text
          variant="medium"
          styles={{
            root: {
              color: item.openTickets > 5 ? theme.palette.red : theme.palette.neutralPrimary,
              fontWeight: item.openTickets > 5 ? FontWeights.semibold : FontWeights.normal,
            },
          }}
        >
          {item.openTickets}
        </Text>
      ),
    },
    {
      key: 'resolvedTickets',
      name: 'Resolved Tickets',
      fieldName: 'resolvedTickets',
      minWidth: 120,
      onRender: (item: CustomerAnalyticsData) => (
        <Text variant="medium">{item.resolvedTickets}</Text>
      ),
    },
    {
      key: 'averageResolutionTime',
      name: 'Avg Resolution Time',
      fieldName: 'averageResolutionTime',
      minWidth: 140,
      onRender: (item: CustomerAnalyticsData) => (
        <Text variant="medium">{item.averageResolutionTime.toFixed(1)}h</Text>
      ),
    },
    {
      key: 'customerSatisfactionScore',
      name: 'Satisfaction Score',
      fieldName: 'customerSatisfactionScore',
      minWidth: 140,
      onRender: (item: CustomerAnalyticsData) => (
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
      key: 'firstContactResolution',
      name: 'First Contact Resolution',
      fieldName: 'firstContactResolution',
      minWidth: 160,
      onRender: (item: CustomerAnalyticsData) => (
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
          <Text variant="medium">{item.firstContactResolution.toFixed(0)}%</Text>
          <Text
            variant="small"
            styles={{
              root: {
                color: item.firstContactResolution >= 80
                  ? theme.palette.green
                  : item.firstContactResolution >= 60
                  ? theme.palette.orange
                  : theme.palette.red,
              },
            }}
          >
            {item.firstContactResolution >= 80 ? 'Excellent'
              : item.firstContactResolution >= 60 ? 'Good'
              : 'Needs Improvement'}
          </Text>
        </Stack>
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
          Customer Analytics
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
          Customer Analytics
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

      {customerData.length === 0 ? (
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
            No customer analytics data available for the selected time range.
          </Text>
        </Stack>
      ) : (
        <Stack tokens={{ childrenGap: 24 }}>
          {/* Summary Cards */}
          <Stack horizontal tokens={{ childrenGap: 16 }} wrap>
            <Stack.Item grow={1} minWidth={200}>
              <div style={{
                padding: '20px',
                border: `1px solid ${theme.palette.neutralLight}`,
                borderRadius: '8px',
                backgroundColor: theme.palette.white,
              }}>
                <Text
                  variant="medium"
                  styles={{
                    root: {
                      fontWeight: FontWeights.semibold,
                      marginBottom: '8px',
                      color: theme.palette.neutralSecondary,
                    },
                  }}
                >
                  Total Customers
                </Text>
                <Text
                  variant="xxLargePlus"
                  styles={{
                    root: {
                      fontWeight: FontWeights.semibold,
                      color: theme.palette.blueDark,
                    },
                  }}
                >
                  {customerData.length}
                </Text>
              </div>
            </Stack.Item>

            <Stack.Item grow={1} minWidth={200}>
              <div style={{
                padding: '20px',
                border: `1px solid ${theme.palette.neutralLight}`,
                borderRadius: '8px',
                backgroundColor: theme.palette.white,
              }}>
                <Text
                  variant="medium"
                  styles={{
                    root: {
                      fontWeight: FontWeights.semibold,
                      marginBottom: '8px',
                      color: theme.palette.neutralSecondary,
                    },
                  }}
                >
                  Average Satisfaction
                </Text>
                <Text
                  variant="xxLargePlus"
                  styles={{
                    root: {
                      fontWeight: FontWeights.semibold,
                      color: theme.palette.greenDark,
                    },
                  }}
                >
                  {(customerData.reduce((sum, c) => sum + c.customerSatisfactionScore, 0) / customerData.length).toFixed(1)}
                </Text>
              </div>
            </Stack.Item>

            <Stack.Item grow={1} minWidth={200}>
              <div style={{
                padding: '20px',
                border: `1px solid ${theme.palette.neutralLight}`,
                borderRadius: '8px',
                backgroundColor: theme.palette.white,
              }}>
                <Text
                  variant="medium"
                  styles={{
                    root: {
                      fontWeight: FontWeights.semibold,
                      marginBottom: '8px',
                      color: theme.palette.neutralSecondary,
                    },
                  }}
                >
                  Open Tickets
                </Text>
                <Text
                  variant="xxLargePlus"
                  styles={{
                    root: {
                      fontWeight: FontWeights.semibold,
                      color: theme.palette.orangeDark,
                    },
                  }}
                >
                  {customerData.reduce((sum, c) => sum + c.openTickets, 0)}
                </Text>
              </div>
            </Stack.Item>
          </Stack>

          {/* Customer Table */}
          <div style={{
            border: `1px solid ${theme.palette.neutralLight}`,
            borderRadius: '4px',
            backgroundColor: theme.palette.white,
            overflow: 'hidden',
          }}>
            <DetailsList
              items={customerData}
              columns={columns}
              selectionMode={SelectionMode.none}
              layoutMode={DetailsListLayoutMode.justified}
              isHeaderVisible={true}
            />
          </div>
        </Stack>
      )}
    </Stack>
  );
};

export default CustomerAnalytics;