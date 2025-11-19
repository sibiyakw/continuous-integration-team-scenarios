import React, { useState, useEffect } from 'react';
import {
  DetailsList,
  DetailsListLayoutMode,
  SelectionMode,
  IColumn,
  ConstrainMode,
  Icon,
  DefaultButton,
  PrimaryButton,
  TextField,
  Dropdown,
  IDropdownOption,
  Stack,
  Text,
  FontSizes,
  FontWeights,
  Shimmer,
  ShimmerElementType,
  CommandBar,
  ICommandBarItemProps,
  getTheme,
  mergeStyles,
} from '@fluentui/react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import CreateTicketModal from './CreateTicketModal';
import TicketDetails from './TicketDetails';

interface Ticket {
  id: string;
  title: string;
  description: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High';
  category: string;
  createdDate: string;
  lastUpdatedDate: string;
  resolvedDate?: string;
  dueDate?: string;
  tags: string[];
  attachments: any[];
}

const TicketsList: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
  });

  const theme = getTheme();

  useEffect(() => {
    loadTickets();
  }, [filters, pagination.page]);

  const loadTickets = async () => {
    try {
      setLoading(true);

      const filterParams: any = {};
      if (filters.status) filterParams.status = filters.status;
      if (filters.priority) filterParams.priority = filters.priority;
      if (user?.role === 'Customer') filterParams.customerId = user.id;

      const response = await apiService.getTickets({
        ...filterParams,
        page: pagination.page,
        limit: pagination.limit,
      });

      setTickets(response.data.tickets || []);
      setPagination(prev => ({ ...prev, total: response.data.total || 0 }));
    } catch (error) {
      console.error('Error loading tickets:', error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTicketUpdate = async (ticketId: string, updates: Partial<Ticket>) => {
    try {
      await apiService.updateTicket(ticketId, updates);
      loadTickets(); // Refresh the list
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(null); // Close details panel
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };

  const handleTicketCreate = async (ticketData: any) => {
    try {
      await apiService.createTicket(ticketData);
      setIsCreateModalOpen(false);
      loadTickets(); // Refresh the list
    } catch (error) {
      console.error('Error creating ticket:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return theme.palette.orange;
      case 'In Progress':
        return theme.palette.blue;
      case 'Resolved':
        return theme.palette.green;
      case 'Closed':
        return theme.palette.neutralSecondary;
      default:
        return theme.palette.neutralSecondary;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return theme.palette.red;
      case 'Medium':
        return theme.palette.orange;
      case 'Low':
        return theme.palette.green;
      default:
        return theme.palette.neutralSecondary;
    }
  };

  const columns: IColumn[] = [
    {
      key: 'id',
      name: 'ID',
      fieldName: 'id',
      minWidth: 80,
      maxWidth: 120,
    },
    {
      key: 'title',
      name: 'Title',
      fieldName: 'title',
      minWidth: 200,
      isResizable: true,
    },
    {
      key: 'customerName',
      name: 'Customer',
      fieldName: 'customerName',
      minWidth: 150,
      isResizable: true,
    },
    {
      key: 'priority',
      name: 'Priority',
      fieldName: 'priority',
      minWidth: 100,
      onRender: (item: Ticket) => (
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 4 }}>
          <Icon
            iconName="CircleFill"
            style={{ color: getPriorityColor(item.priority), fontSize: '8px' }}
          />
          <Text>{item.priority}</Text>
        </Stack>
      ),
    },
    {
      key: 'status',
      name: 'Status',
      fieldName: 'status',
      minWidth: 120,
      onRender: (item: Ticket) => (
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 4 }}>
          <Icon
            iconName="CircleFill"
            style={{ color: getStatusColor(item.status), fontSize: '8px' }}
          />
          <Text>{item.status}</Text>
        </Stack>
      ),
    },
    {
      key: 'assignedAgentName',
      name: 'Assigned To',
      fieldName: 'assignedAgentName',
      minWidth: 150,
      onRender: (item: Ticket) => (
        <Text>{item.assignedAgentName || 'Unassigned'}</Text>
      ),
    },
    {
      key: 'createdDate',
      name: 'Created',
      fieldName: 'createdDate',
      minWidth: 120,
      onRender: (item: Ticket) => (
        <Text>{new Date(item.createdDate).toLocaleDateString()}</Text>
      ),
    },
    {
      key: 'actions',
      name: 'Actions',
      minWidth: 100,
      onRender: (item: Ticket) => (
        <DefaultButton
          text="View"
          onClick={() => setSelectedTicket(item)}
          iconProps={{ iconName: 'View' }}
        />
      ),
    },
  ];

  const commandBarItems: ICommandBarItemProps[] = [
    {
      key: 'newTicket',
      text: 'New Ticket',
      iconProps: { iconName: 'Add' },
      onClick: () => setIsCreateModalOpen(true),
    },
    {
      key: 'refresh',
      text: 'Refresh',
      iconProps: { iconName: 'Refresh' },
      onClick: () => loadTickets(),
    },
  ];

  const statusOptions: IDropdownOption[] = [
    { key: '', text: 'All Statuses' },
    { key: 'Open', text: 'Open' },
    { key: 'In Progress', text: 'In Progress' },
    { key: 'Resolved', text: 'Resolved' },
    { key: 'Closed', text: 'Closed' },
  ];

  const priorityOptions: IDropdownOption[] = [
    { key: '', text: 'All Priorities' },
    { key: 'High', text: 'High' },
    { key: 'Medium', text: 'Medium' },
    { key: 'Low', text: 'Low' },
  ];

  if (loading) {
    return (
      <Stack tokens={{ childrenGap: 16 }}>
        <Shimmer
          width="100%"
          height={40}
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
    <div style={{ display: 'flex', height: '100%' }}>
      <div style={{ flex: selectedTicket ? '1 0 60%' : '1 0 100%', paddingRight: selectedTicket ? '16px' : '0' }}>
        <Stack tokens={{ childrenGap: 16 }}>
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
              Tickets ({pagination.total})
            </Text>

            <CommandBar
              items={commandBarItems}
              styles={{
                root: {
                  padding: 0,
                  backgroundColor: 'transparent',
                },
              }}
            />
          </Stack>

          {/* Filters */}
          <Stack horizontal tokens={{ childrenGap: 12 }} wrap>
            <TextField
              placeholder="Search tickets..."
              value={filters.search}
              onChange={(e, value) => setFilters(prev => ({ ...prev, search: value || '' }))}
              styles={{
                root: {
                  minWidth: 200,
                  maxWidth: 300,
                },
              }}
              iconProps={{ iconName: 'Search' }}
            />

            <Dropdown
              placeholder="Status"
              options={statusOptions}
              selectedKey={filters.status}
              onChange={(e, option) => setFilters(prev => ({ ...prev, status: option?.key as string || '' }))}
              styles={{
                root: {
                  minWidth: 150,
                },
              }}
            />

            <Dropdown
              placeholder="Priority"
              options={priorityOptions}
              selectedKey={filters.priority}
              onChange={(e, option) => setFilters(prev => ({ ...prev, priority: option?.key as string || '' }))}
              styles={{
                root: {
                  minWidth: 150,
                },
              }}
            />
          </Stack>

          {/* Tickets List */}
          <div style={{ border: `1px solid ${theme.palette.neutralLight}`, borderRadius: '4px' }}>
            <DetailsList
              items={tickets}
              columns={columns}
              selectionMode={SelectionMode.none}
              layoutMode={DetailsListLayoutMode.justified}
              constrainMode={ConstrainMode.unconstrained}
              isHeaderVisible={true}
              emptyMessage="No tickets found"
            />
          </div>

          {/* Pagination */}
          {pagination.total > pagination.limit && (
            <Stack horizontal horizontalAlign="center" tokens={{ childrenGap: 8 }}>
              <DefaultButton
                text="Previous"
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              />
              <Text variant="medium">
                Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
              </Text>
              <DefaultButton
                text="Next"
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              />
            </Stack>
          )}
        </Stack>
      </div>

      {/* Ticket Details Panel */}
      {selectedTicket && (
        <div style={{ flex: '1 0 40%', borderLeft: `1px solid ${theme.palette.neutralLight}`, paddingLeft: '16px' }}>
          <TicketDetails
            ticket={selectedTicket}
            onClose={() => setSelectedTicket(null)}
            onUpdate={handleTicketUpdate}
            currentUser={user!}
          />
        </div>
      )}

      {/* Create Ticket Modal */}
      {isCreateModalOpen && (
        <CreateTicketModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleTicketCreate}
          currentUser={user!}
        />
      )}
    </div>
  );
};

export default TicketsList;