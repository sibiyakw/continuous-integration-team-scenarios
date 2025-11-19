import React, { useState } from 'react';
import {
  Modal,
  DefaultButton,
  PrimaryButton,
  TextField,
  Dropdown,
  IDropdownOption,
  Stack,
  Text,
  FontSizes,
  FontWeights,
  Label,
  IconButton,
} from '@fluentui/react';
import { useAuth } from '../../contexts/AuthContext';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (ticketData: FormData) => Promise<void>;
  currentUser: any;
}

const CreateTicketModal: React.FC<CreateTicketModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentUser,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    category: 'General',
    dueDate: '',
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const priorityOptions: IDropdownOption[] = [
    { key: 'Low', text: 'Low' },
    { key: 'Medium', text: 'Medium' },
    { key: 'High', text: 'High' },
  ];

  const categoryOptions: IDropdownOption[] = [
    { key: 'Technical Support', text: 'Technical Support' },
    { key: 'Billing', text: 'Billing' },
    { key: 'General Inquiry', text: 'General Inquiry' },
    { key: 'Account Management', text: 'Account Management' },
    { key: 'Feature Request', text: 'Feature Request' },
    { key: 'Bug Report', text: 'Bug Report' },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const ticketFormData = new FormData();

      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value) {
          ticketFormData.append(key, value);
        }
      });

      // Add attachments
      attachments.forEach((file, index) => {
        ticketFormData.append(`attachments`, file);
      });

      await onSubmit(ticketFormData);

      // Reset form
      setFormData({
        title: '',
        description: '',
        priority: 'Medium',
        category: 'General',
        dueDate: '',
      });
      setAttachments([]);
      setErrors({});
    } catch (error) {
      console.error('Error creating ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        title: '',
        description: '',
        priority: 'Medium',
        category: 'General',
        dueDate: '',
      });
      setAttachments([]);
      setErrors({});
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onDismiss={handleClose}
      containerClassName="create-ticket-modal"
      isBlocking={true}
    >
      <div style={{
        padding: '24px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '80vh',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <Stack horizontal horizontalAlign="space-between" verticalAlign="center" styles={{
          root: {
            marginBottom: '24px',
          },
        }}>
          <Text
            variant="xLarge"
            styles={{
              root: {
                fontWeight: FontWeights.semibold,
              },
            }}
          >
            Create New Ticket
          </Text>
          <IconButton
            iconProps={{ iconName: 'Cancel' }}
            onClick={handleClose}
            disabled={loading}
          />
        </Stack>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Stack tokens={{ childrenGap: 16 }}>
            {/* Title */}
            <TextField
              label="Title *"
              value={formData.title}
              onChange={(e, value) => handleInputChange('title', value || '')}
              errorMessage={errors.title}
              placeholder="Brief description of the issue"
              disabled={loading}
              required
            />

            {/* Description */}
            <TextField
              label="Description *"
              value={formData.description}
              onChange={(e, value) => handleInputChange('description', value || '')}
              errorMessage={errors.description}
              placeholder="Detailed description of the issue or question"
              multiline
              rows={4}
              disabled={loading}
              required
            />

            <Stack horizontal tokens={{ childrenGap: 16 }}>
              {/* Priority */}
              <Stack.Item grow={1}>
                <Dropdown
                  label="Priority"
                  options={priorityOptions}
                  selectedKey={formData.priority}
                  onChange={(e, option) => handleInputChange('priority', option?.key as string)}
                  disabled={loading}
                />
              </Stack.Item>

              {/* Category */}
              <Stack.Item grow={1}>
                <Dropdown
                  label="Category"
                  options={categoryOptions}
                  selectedKey={formData.category}
                  onChange={(e, option) => handleInputChange('category', option?.key as string)}
                  disabled={loading}
                />
              </Stack.Item>
            </Stack>

            {/* Due Date */}
            <TextField
              label="Due Date (Optional)"
              type="date"
              value={formData.dueDate}
              onChange={(e, value) => handleInputChange('dueDate', value || '')}
              disabled={loading}
              min={new Date().toISOString().split('T')[0]}
            />

            {/* Attachments */}
            <div>
              <Label>Attachments</Label>
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt,.xls,.xlsx"
                onChange={handleFileChange}
                disabled={loading}
                style={{
                  marginBottom: '12px',
                  display: 'block',
                }}
              />

              {/* Attachment List */}
              {attachments.length > 0 && (
                <Stack tokens={{ childrenGap: 8 }}>
                  {attachments.map((file, index) => (
                    <Stack
                      key={index}
                      horizontal
                      verticalAlign="center"
                      tokens={{ childrenGap: 8 }}
                      styles={{
                        root: {
                          padding: '8px 12px',
                          border: '1px solid #e1dfdd',
                          borderRadius: '4px',
                          backgroundColor: '#faf9f8',
                        },
                      }}
                    >
                      <Text variant="small">{file.name}</Text>
                      <Text variant="small" styles={{ root: { color: '#605e5c' } }}>
                        ({(file.size / 1024).toFixed(1)} KB)
                      </Text>
                      <IconButton
                        iconProps={{ iconName: 'Cancel', styles: { root: { fontSize: '12px' } } }}
                        onClick={() => removeAttachment(index)}
                        disabled={loading}
                        styles={{
                          root: {
                            height: '20px',
                            width: '20px',
                          },
                        }}
                      />
                    </Stack>
                  ))}
                </Stack>
              )}
            </div>

            {/* Form Actions */}
            <Stack horizontal tokens={{ childrenGap: 12 }} horizontalAlign="end" styles={{
              root: {
                marginTop: '24px',
              },
            }}>
              <DefaultButton
                text="Cancel"
                onClick={handleClose}
                disabled={loading}
              />
              <PrimaryButton
                type="submit"
                text={loading ? 'Creating...' : 'Create Ticket'}
                disabled={loading}
              />
            </Stack>
          </Stack>
        </form>
      </div>

      <style>{`
        .create-ticket-modal .ms-Modal-scrollableContent {
          max-height: 80vh;
        }
      `}</style>
    </Modal>
  );
};

export default CreateTicketModal;