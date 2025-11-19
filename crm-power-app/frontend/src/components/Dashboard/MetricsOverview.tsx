import React from 'react';
import {
  Stack,
  Text,
  FontSizes,
  FontWeights,
  Card,
  CardItemType,
  getTheme,
  mergeStyles,
  Shimmer,
  ShimmerElementsType,
} from '@fluentui/react';
import {
  Icon,
  FontIcon,
} from '@fluentui/react/lib/Icon';

interface MetricsOverviewProps {
  metrics: any;
  loading: boolean;
}

const MetricsOverview: React.FC<MetricsOverviewProps> = ({ metrics, loading }) => {
  const theme = getTheme();

  const metricCardStyles = mergeStyles({
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    backgroundColor: theme.palette.white,
    minHeight: '120px',
  });

  const metricTitleStyles = mergeStyles({
    fontSize: FontSizes.medium,
    fontWeight: FontWeights.regular,
    color: theme.palette.neutralSecondary,
    marginBottom: '8px',
  });

  const metricValueStyles = mergeStyles({
    fontSize: FontSizes.xxLargePlus,
    fontWeight: FontWeights.semibold,
    color: theme.palette.neutralPrimary,
    marginBottom: '4px',
  });

  const metricChangeStyles = mergeStyles({
    fontSize: FontSizes.small,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  });

  const positiveChangeStyles = mergeStyles({
    color: theme.palette.greenDark,
  });

  const negativeChangeStyles = mergeStyles({
    color: theme.palette.redDark,
  });

  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    icon?: string;
    change?: number;
    changeLabel?: string;
    color?: string;
  }> = ({ title, value, icon, change, changeLabel, color }) => (
    <div className={metricCardStyles}>
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
        <div style={{ flex: 1 }}>
          <Text className={metricTitleStyles}>{title}</Text>
          <Text className={metricValueStyles} style={{ color }}>
            {value}
          </Text>
          {change !== undefined && (
            <div className={`${metricChangeStyles} ${change >= 0 ? positiveChangeStyles : negativeChangeStyles}`}>
              <Icon
                iconName={change >= 0 ? 'CaretUpSolid8' : 'CaretDownSolid8'}
              />
              <Text>
                {Math.abs(change)}% {changeLabel || 'from last month'}
              </Text>
            </div>
          )}
        </div>
        {icon && (
          <FontIcon
            iconName={icon}
            style={{
              fontSize: '32px',
              color: color || theme.palette.themePrimary,
              opacity: 0.8,
            }}
          />
        )}
      </Stack>
    </div>
  );

  const MetricCardShimmer: React.FC = () => (
    <div className={metricCardStyles}>
      <Stack>
        <Shimmer
          width="60%"
          height={16}
          shimmerElements={[{ type: ShimmerElementsType.line, width: "100%" }]}
          styles={{ root: { marginBottom: '8px' } }}
        />
        <Shimmer
          width="80%"
          height={32}
          shimmerElements={[{ type: ShimmerElementsType.line, width: "100%" }]}
          styles={{ root: { marginBottom: '4px' } }}
        />
        <Shimmer
          width="40%"
          height={12}
          shimmerElements={[{ type: ShimmerElementsType.line, width: "100%" }]}
        />
      </Stack>
    </div>
  );

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
          Dashboard Overview
        </Text>

        <Stack horizontal tokens={{ childrenGap: 16 }} wrap>
          {[1, 2, 3, 4].map((index) => (
            <Stack.Item key={index} grow={1} minWidth={280}>
              <MetricCardShimmer />
            </Stack.Item>
          ))}
        </Stack>
      </Stack>
    );
  }

  if (!metrics) {
    return (
      <Text
        variant="large"
        styles={{
          root: {
            textAlign: 'center',
            padding: '40px',
            color: theme.palette.neutralSecondary,
          },
        }}
      >
        No metrics data available
      </Text>
    );
  }

  return (
    <Stack tokens={{ childrenGap: 24 }}>
      <Text
        variant="xLarge"
        styles={{
          root: {
            fontWeight: FontWeights.semibold,
          },
        }}
      >
        Dashboard Overview
      </Text>

      {/* Primary Metrics */}
      <Stack horizontal tokens={{ childrenGap: 16 }} wrap>
        <Stack.Item grow={1} minWidth={280}>
          <MetricCard
            title="Total Tickets"
            value={metrics.totalTickets || 0}
            icon="Bug"
            change={12}
            changeLabel="from last month"
            color={theme.palette.blueDark}
          />
        </Stack.Item>

        <Stack.Item grow={1} minWidth={280}>
          <MetricCard
            title="Open Tickets"
            value={metrics.openTickets || 0}
            icon="Clock"
            change={-5}
            changeLabel="from last month"
            color={theme.palette.orangeDark}
          />
        </Stack.Item>

        <Stack.Item grow={1} minWidth={280}>
          <MetricCard
            title="Customer Satisfaction"
            value={`${(metrics.customerSatisfactionScore || 0).toFixed(1)}/5.0`}
            iconLike="Like"
            change={3}
            changeLabel="from last month"
            color={theme.palette.greenDark}
          />
        </Stack.Item>

        <Stack.Item grow={1} minWidth={280}>
          <MetricCard
            title="Avg Resolution Time"
            value={`${(metrics.averageResolutionTime || 0).toFixed(1)}h`}
            icon="Timer"
            change={-8}
            changeLabel="improvement"
            color={theme.palette.purpleDark}
          />
        </Stack.Item>
      </Stack>

      {/* Secondary Metrics */}
      <Stack horizontal tokens={{ childrenGap: 16 }} wrap>
        <Stack.Item grow={1} minWidth={280}>
          <MetricCard
            title="Overdue Tickets"
            value={metrics.ticketsOverdue || 0}
            icon="Warning"
            change={15}
            changeLabel="from last month"
            color={theme.palette.redDark}
          />
        </Stack.Item>

        <Stack.Item grow={1} minWidth={280}>
          <MetricCard
            title="Agent Utilization"
            value={`${(metrics.agentUtilizationRate || 0).toFixed(0)}%`}
            icon="People"
            change={5}
            changeLabel="from last month"
            color={theme.palette.tealDark}
          />
        </Stack.Item>

        <Stack.Item grow={1} minWidth={280}>
          <MetricCard
            title="Resolved Today"
            value={Math.floor((metrics.resolvedTickets || 0) * 0.1)}
            icon="CheckMark"
            color={theme.palette.greenDark}
          />
        </Stack.Item>

        <Stack.Item grow={1} minWidth={280}>
          <MetricCard
            title="Avg First Response"
            value={`${(metrics.averageFirstResponseTime || 0).toFixed(1)}h`}
            icon="Mail"
            change={-12}
            changeLabel="improvement"
            color={theme.palette.magentaDark}
          />
        </Stack.Item>
      </Stack>

      {/* Priority Distribution */}
      <Stack tokens={{ childrenGap: 16 }}>
        <Text
          variant="large"
          styles={{
            root: {
              fontWeight: FontWeights.semibold,
            },
          }}
        >
          Tickets by Priority
        </Text>

        <Stack horizontal tokens={{ childrenGap: 16 }} wrap>
          <Stack.Item grow={1} minWidth={200}>
            <MetricCard
              title="High Priority"
              value={metrics.ticketsByPriority?.High || 0}
              icon="ErrorBadge"
              color={theme.palette.redDark}
            />
          </Stack.Item>

          <Stack.Item grow={1} minWidth={200}>
            <MetricCard
              title="Medium Priority"
              value={metrics.ticketsByPriority?.Medium || 0}
              icon="Warning"
              color={theme.palette.orangeDark}
            />
          </Stack.Item>

          <Stack.Item grow={1} minWidth={200}>
            <MetricCard
              title="Low Priority"
              value={metrics.ticketsByPriority?.Low || 0}
              icon="Info"
              color={theme.palette.blueDark}
            />
          </Stack.Item>
        </Stack>
      </Stack>
    </Stack>
  );
};

export default MetricsOverview;