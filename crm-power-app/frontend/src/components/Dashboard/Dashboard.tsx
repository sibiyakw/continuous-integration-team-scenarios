import React, { useState, useEffect } from 'react';
import {
  DefaultButton,
  PrimaryButton,
  Pivot,
  PivotItem,
  MessageBar,
  MessageBarType,
  Stack,
  Text,
  FontSizes,
  FontWeights,
  getTheme,
  mergeStyles,
} from '@fluentui/react';
import { Icon } from '@fluentui/react/lib/Icon';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import MetricsOverview from './MetricsOverview';
import TicketsList from '../Tickets/TicketsList';
import AgentPerformance from './AgentPerformance';
import CustomerAnalytics from './CustomerAnalytics';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [selectedKey, setSelectedKey] = useState('overview');
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = getTheme();

  useEffect(() => {
    loadDashboardMetrics();
  }, [selectedKey]);

  const loadDashboardMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      if (selectedKey === 'overview') {
        const response = await apiService.getDashboardMetrics();
        setMetrics(response.data);
      }
    } catch (error: any) {
      console.error('Error loading dashboard metrics:', error);
      setError(error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const headerStyles = mergeStyles({
    backgroundColor: theme.palette.themePrimary,
    color: theme.palette.white,
    padding: '20px 24px',
    marginBottom: '20px',
  });

  const welcomeStyles = mergeStyles({
    fontSize: FontSizes.xLargePlus,
    fontWeight: FontWeights.semibold,
    marginBottom: '4px',
  });

  const subtitleStyles = mergeStyles({
    fontSize: FontSizes.medium,
    opacity: 0.9,
  });

  const handlePivotChange = (item?: PivotItem) => {
    if (item) {
      setSelectedKey(item.props.itemKey);
    }
  };

  const renderPivotContent = () => {
    switch (selectedKey) {
      case 'overview':
        return <MetricsOverview metrics={metrics} loading={loading} />;
      case 'tickets':
        return <TicketsList />;
      case 'agents':
        return user?.role !== 'Customer' ? <AgentPerformance /> : null;
      case 'customers':
        return <CustomerAnalytics />;
      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className={headerStyles}>
        <Text>Loading...</Text>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.palette.neutralLighterAlt }}>
      {/* Header */}
      <div className={headerStyles}>
        <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
          <div>
            <Text className={welcomeStyles}>
              Welcome back, {user.displayName}!
            </Text>
            <Text className={subtitleStyles}>
              {user.role === 'Admin' && 'System Administrator'}
              {user.role === 'Agent' && 'Customer Support Agent'}
              {user.role === 'Customer' && 'Customer Portal'}
              {user.department && ` • ${user.department}`}
            </Text>
          </div>
          <Stack horizontal tokens={{ childrenGap: 12 }} verticalAlign="center">
            <Text variant="small">{user.email}</Text>
            <DefaultButton
              iconProps={{ iconName: 'SignOut' }}
              onClick={logout}
              text="Logout"
            />
          </Stack>
        </Stack>
      </div>

      {/* Error Message */}
      {error && (
        <MessageBar
          messageBarType={MessageBarType.error}
          isMultiline={false}
          dismissButtonAriaLabel="Close"
          onDismiss={() => setError(null)}
          styles={{
            root: {
              margin: '0 24px 20px',
            },
          }}
        >
          {error}
        </MessageBar>
      )}

      {/* Main Content */}
      <div style={{ padding: '0 24px 24px' }}>
        <Pivot
          selectedKey={selectedKey}
          onLinkClick={handlePivotChange}
          styles={{
            root: {
              marginBottom: '24px',
            },
          }}
        >
          <PivotItem
            headerText="Overview"
            itemKey="overview"
            iconProps={{ iconName: 'ViewDashboard' }}
          />
          <PivotItem
            headerText="Tickets"
            itemKey="tickets"
            iconProps={{ iconName: 'Bug' }}
          />
          {user.role !== 'Customer' && (
            <PivotItem
              headerText="Team Performance"
              itemKey="agents"
              iconProps={{ iconName: 'People' }}
            />
          )}
          {user.role !== 'Customer' && (
            <PivotItem
              headerText="Customers"
              itemKey="customers"
              iconProps={{ iconName: 'Contact' }}
            />
          )}
        </Pivot>

        {/* Pivot Content */}
        <div style={{ minHeight: '400px' }}>
          {renderPivotContent()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;