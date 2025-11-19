import React, { useState } from 'react';
import {
  Stack,
  Text,
  FontSizes,
  FontWeights,
  DefaultButton,
  PrimaryButton,
  Dropdown,
  IDropdownOption,
  TextField,
  Label,
  ActionButton,
  getTheme,
  mergeStyles,
} from '@fluentui/react';

interface TicketDetailsProps {
  ticket: any;
  onClose: () => void;
  onUpdate: (ticketId: string, updates: any) => Promise<void>;
  currentUser: any;
}

const TicketDetails: React.FC<TicketDetailsProps> = ({
  ticket,
  onClose,
  onUpdate,
  currentUser,
}) => {
  const theme = getTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    status: ticket.status,
    priority: ticket.priority,
    assignedAgentId: ticket.assignedAgentId,
  });

  const statusOptions: IDropdownOption[] = [
    { key: 'Open', text: 'Open' },
    { key: 'In Progress', text: 'In Progress' },
    { key: 'Resolved', text: 'Resolved' },
    { key: 'Closed', text: 'Closed' },
  ];

  const priorityOptions: IDropdownOption[] = [
    { key: 'Low', text: 'Low' },
    { key: 'Medium', text: 'Medium' },
    { key: 'High', text: 'High' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return theme.palette.orange;
      case 'In Progress': return theme.palette.blue;
      case 'Resolved': return theme.palette.green;
      case 'Closed': return theme.palette.neutralSecondary;
      default: return theme.palette.neutralSecondary;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return theme.palette.red;
      case 'Medium': return theme.palette.orange;
      case 'Low': return theme.palette.green;
      default: return theme.palette.neutralSecondary;
    }
  };

  const handleSave = async () => {
    try {
      await onUpdate(ticket.id, editForm);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };

  const handleCancel = () => {
    setEditForm({
      status: ticket.status,
      priority: ticket.priority,
      assignedAgentId: ticket.assignedAgentId,
    });
    setIsEditing(false);
  };

  const detailsSectionStyles = mergeStyles({
    padding: '12px 0',
    borderBottom: `1px solid ${theme.palette.neutralLight}`,
  });

  const labelStyles = mergeStyles({
    fontSize: FontSizes.small,
    fontWeight: FontWeights.semibold,
    color: theme.palette.neutralSecondary,
    marginBottom: '4px',
  });

  const valueStyles = mergeStyles({
    fontSize: FontSizes.medium,
    color: theme.palette.neutralPrimary,
  });

  return (
    <div>
      {/* Header */}
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center" styles={{
        root: {
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: `1px solid ${theme.palette.neutralLight}`,
        },
      }}>
        <div style={{ flex: 1 }}>
          <Text
            variant="large"
            styles={{
              root: {
                fontWeight: FontWeights.semibold,
                marginBottom: '4px',
              },
            }}
          >
            {ticket.title}
          </Text>
          <Text
            variant="small"
            styles={{
              root: {
                color: theme.palette.neutralSecondary,
              },
            }}
          >
            ID: {ticket.id}
          </Text>
        </div>

        <ActionButton
          iconProps={{ iconName: 'Cancel' }}
          onClick={onClose}
          styles={{
            root: {
              color: theme.palette.neutralSecondary,
            },
          }}
        />
      </Stack>

      {/* Edit Controls */}
      {currentUser.role !== 'Customer' && (
        <Stack horizontal horizontalAlign="end" tokens={{ childrenGap: 8 }} styles={{
          root: {
            marginBottom: '16px',
          },
        }}>
          {!isEditing ? (
            <DefaultButton
              text="Edit"
              iconProps={{ iconName: 'Edit' }}
              onClick={() => setIsEditing(true)}
            />
          ) : (
            <>
              <DefaultButton
                text="Cancel"
                onClick={handleCancel}
              />
              <PrimaryButton
                text="Save"
                iconProps={{ iconName: 'Save' }}
                onClick={handleSave}
              />
            </>
          )}
        </Stack>
      )}

      {/* Ticket Details */}
      <Stack tokens={{ childrenGap: 20 }}>
        {/* Basic Info */}
        <div className={detailsSectionStyles}>
          <div className={labelStyles}>Customer</div>
          <div className={valueStyles}>{ticket.customerName}</div>
          <Text variant="small" styles={{ root: { color: theme.palette.neutralSecondary } }}>
            {ticket.customerEmail}
          </Text>
        </div>

        <div className={detailsSectionStyles}>
          <div className={labelStyles}>Description</div>
          <div className={valueStyles} style={{ whiteSpace: 'pre-wrap' }}>
            {ticket.description}
          </div>
        </div>

        {/* Status and Priority */}
        <Stack horizontal tokens={{ childrenGap: 16 }}>
          <Stack.Item grow={1}>
            <div className={labelStyles}>Status</div>
            {isEditing && currentUser.role !== 'Customer' ? (
              <Dropdown
                options={statusOptions}
                selectedKey={editForm.status}
                onChange={(e, option) => setEditForm(prev => ({ ...prev, status: option?.key as string }))}
              />
            ) : (
              <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: getStatusColor(ticket.status),
                  }}
                />
                <Text className={valueStyles}>{ticket.status}</Text>
              </Stack>
            )}
          </Stack.Item>

          <Stack.Item grow={1}>
            <div className={labelStyles}>Priority</div>
            {isEditing && currentUser.role !== 'Customer' ? (
              <Dropdown
                options={priorityOptions}
                selectedKey={editForm.priority}
                onChange={(e, option) => setEditForm(prev => ({ ...prev, priority: option?.key as string }))}
              />
            ) : (
              <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: getPriorityColor(ticket.priority),
                  }}
                />
                <Text className={valueStyles}>{ticket.priority}</Text>
              </Stack>
            )}
          </Stack.Item>
        </Stack>

        {/* Assigned Agent */}
        {currentUser.role !== 'Customer' && (
          <div className={detailsSectionStyles}>
            <div className={labelStyles}>Assigned Agent</div>
            {isEditing ? (
              <TextField
                value={editForm.assignedAgentId || ''}
                onChange={(e, value) => setEditForm(prev => ({ ...prev, assignedAgentId: value || '' }))}
                placeholder="Unassigned"
              />
            ) : (
              <Text className={valueStyles}>
                {ticket.assignedAgentName || 'Unassigned'}
              </Text>
            )}
          </div>
        )}

        {/* Metadata */}
        <Stack horizontal tokens={{ childrenGap: 32 }}>
          <div>
            <div className={labelStyles}>Category</div>
            <Text className={valueStyles}>{ticket.category}</Text>
          </div>

          <div>
            <div className={labelStyles}>Created</div>
            <Text className={valueStyles}>
              {new Date(ticket.createdDate).toLocaleDateString()}
            </Text>
          </div>

          {ticket.resolvedDate && (
            <div>
              <div className={labelStyles}>Resolved</div>
              <Text className={valueStyles}>
                {new Date(ticket.resolvedDate).toLocaleDateString()}
              </Text>
            </div>
          )}
        </Stack>

        {/* Tags */}
        {ticket.tags && ticket.tags.length > 0 && (
          <div className={detailsSectionStyles}>
            <div className={labelStyles}>Tags</div>
            <Stack horizontal tokens={{ childrenGap: 8 }} wrap>
              {ticket.tags.map((tag: string, index: number) => (
                <div
                  key={index}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: theme.palette.neutralLight,
                    borderRadius: '4px',
                    fontSize: FontSizes.small,
                  }}
                >
                  {tag}
                </div>
              ))}
            </Stack>
          </div>
        )}

        {/* Attachments */}
        {ticket.attachments && ticket.attachments.length > 0 && (
          <div className={detailsSectionStyles}>
            <div className={labelStyles}>Attachments ({ticket.attachments.length})</div>
            <Stack tokens={{ childrenGap: 8 }}>
              {ticket.attachments.map((attachment: any, index: number) => (
                <Stack
                  key={index}
                  horizontal
                  verticalAlign="center"
                  tokens={{ childrenGap: 12 }}
                  styles={{
                    root: {
                      padding: '8px 12px',
                      border: `1px solid ${theme.palette.neutralLight}`,
                      borderRadius: '4px',
                      backgroundColor: theme.palette.white,
                    },
                  }}
                >
                  <Text styles={{ root: { flex: 1 } }}>{attachment.fileName}</Text>
                  <Text
                    variant="small"
                    styles={{ root: { color: theme.palette.neutralSecondary } }}
                  >
                    {attachment.fileSize ? `${(attachment.fileSize / 1024).toFixed(1)} KB` : ''}
                  </Text>
                  <ActionButton
                    iconProps={{ iconName: 'Download' }}
                    href={attachment.sharePointUrl}
                    target="_blank"
                  />
                </Stack>
              ))}
            </Stack>
          </div>
        )}
      </Stack>
    </div>
  );
};

export default TicketDetails;