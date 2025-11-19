# SharePoint Customer Service CRM

A comprehensive customer relationship management system built on SharePoint Online, designed for small to medium-sized teams (1-10 users) to manage customer support tickets, maintain customer databases, and provide self-service knowledge base functionality.

## Overview

The SharePoint CRM solution provides a complete customer service management platform with:

- **Automated ticket management** with SLA monitoring
- **Customer database** with interaction history
- **Knowledge base** for common solutions and self-service
- **Power Apps interfaces** for both agents and customers
- **Power Automate workflows** for automation and notifications
- **One-click deployment** from Visual Studio

## System Requirements

### Microsoft 365 Requirements
- SharePoint Online with appropriate site collection
- Power Apps license for all users
- Power Automate premium license for automated workflows
- Microsoft 365 group for CRM access

### Technical Requirements
- SharePoint Site Collection Admin rights
- Power Apps Environment Admin access
- Power Automate Flow Admin permissions
- Modern SharePoint site experience

### Client Requirements
- Visual Studio 2022 Professional/Enterprise (for deployment)
- Microsoft Edge, Chrome, Firefox, or Safari (for users)
- Internet connection for cloud-based functionality

## Quick Start Guide

### 1. Prerequisites Setup

#### Install PowerShell Modules
```powershell
# Install required PowerShell modules
Install-Module -Name PnP.PowerShell -Scope CurrentUser
Install-Module -Name Microsoft.PowerApps.PowerShell -Scope CurrentUser
```

#### Prepare SharePoint Site
1. Create a new SharePoint Online site or use an existing one
2. Ensure you have Site Collection Admin permissions
3. Create Microsoft 365 group for CRM users

### 2. Deployment Process

#### Step 1: Deploy CRM Infrastructure
```powershell
# Navigate to deployment scripts directory
cd .\Scripts

# Run the main deployment script
.\Deploy.ps1 -SiteUrl "https://yourtenant.sharepoint.com/sites/crm"

# For testing without making changes:
.\Deploy.ps1 -SiteUrl "https://yourtenant.sharepoint.com/sites/crm" -WhatIf
```

#### Step 2: Configure System Settings
```powershell
# Configure CRM with your company details
.\Configure.ps1 -SiteUrl "https://yourtenant.sharepoint.com/sites/crm" `
    -AdminEmail "admin@yourcompany.com" `
    -CompanyName "Your Company Name" `
    -ConfigureSampleData `
    -ConfigureEmailSettings
```

#### Step 3: Validate Deployment
```powershell
# Run validation to ensure everything is working
.\Validate.ps1 -SiteUrl "https://yourtenant.sharepoint.com/sites/crm" -Detailed -ExportReport
```

### 3. Power Apps Deployment

#### Agent Dashboard
1. Open Power Apps Studio
2. Import `AgentDashboard.msapp` from the `PowerApps` folder
3. Configure data sources to point to your SharePoint site
4. Publish the app and share with CRM agents

#### Customer Portal
1. Open Power Apps Studio
2. Import `CustomerPortal.msapp` from the `PowerApps` folder
3. Configure data sources with customer-specific filters
4. Publish and share with external customers

### 4. Power Automate Workflows

Import the following workflows from the `Flows` folder:
- `AutoAssignment.json` - Automatic ticket assignment
- `SLAMonitoring.json` - SLA compliance monitoring
- `CustomerCommunications.json` - Customer notifications

## System Architecture

### Core Components

#### SharePoint Lists (Data Foundation)
- **CRM Tickets** - Main ticket tracking with status, priority, assignments
- **CRM Customers** - Customer information and contact details
- **CRM Knowledge Articles** - Solutions and documentation
- **CRM Agents** - Service team member profiles
- **CRM SLA Rules** - Service level agreement configurations
- **CRM Ticket History** - Audit trail of all ticket activities

#### Power Apps (User Interfaces)
- **Agent Dashboard** - Ticket management and assignment interface
- **Customer Portal** - Self-service and ticket submission interface

#### Power Automate (Automation)
- **Auto-Assignment** - Round-robin or skill-based ticket routing
- **SLA Monitoring** - Deadline tracking and escalations
- **Customer Communications** - Automated updates and surveys

### Security Model

#### Permission Structure
- **CRM Administrators** - Full control over all CRM components
- **CRM Agents** - Contribute access to tickets, read access to customers
- **CRM Customers** - Limited access to own tickets only

#### Data Protection
- Row-level security for customer data isolation
- Audit logging for all ticket modifications
- GDPR compliance features
- Data retention policies

## Configuration

### SLA Rules Configuration

SLA rules are automatically created during deployment but can be customized:

#### Default SLA Settings
| Priority | First Response | Resolution Time | Warning Threshold |
|----------|----------------|------------------|-------------------|
| Critical | 1 hour | 4 hours | 75% |
| High | 2 hours | 8 hours | 75% |
| Medium | 4 hours | 24 hours | 75% |
| Low | 8 hours | 72 hours | 75% |

#### Customizing SLA Rules
1. Navigate to "CRM SLA Rules" list
2. Modify existing rules or create new ones
3. Rules are automatically applied to new tickets
4. Changes take effect immediately

### Email Configuration

#### SMTP Settings
Email notifications are sent through Microsoft 365 by default. To customize:
1. Edit email templates in Power Automate workflows
2. Modify sender addresses and signatures
3. Configure notification schedules

#### Notification Types
- **New ticket confirmations** - Immediate acknowledgment
- **Status updates** - Changes to ticket status
- **SLA warnings** - Approaching deadline alerts
- **Escalation notices** - Critical escalation alerts
- **Satisfaction surveys** - Post-resolution feedback

### Business Hours Configuration

#### Default Business Hours
- Monday - Friday: 9:00 AM - 6:00 PM
- Saturday - Sunday: Closed
- Holidays: Follows company calendar

#### Customizing Business Hours
1. Update business hours in `Config/sla-rules.xml`
2. Re-deploy configuration changes
3. SLA calculations respect business hours settings

## User Management

### Adding Agents

1. Navigate to "CRM Agents" list
2. Add new agent with required information:
   - Name and user account
   - Role (Agent, Senior Agent, Team Lead, Manager)
   - Skills and specializations
   - Maximum concurrent tickets
3. Agent will automatically receive ticket assignments

### Adding Customers

1. Navigate to "CRM Customers" list
2. Add customer with contact information
3. Set account type and status
4. Customer can immediately submit tickets

### Permission Management

#### Agent Permissions
Agents automatically get access to:
- Their assigned tickets
- All customer information
- Knowledge base articles
- Ticket history

#### Customer Permissions
Customers get access to:
- Their own tickets only
- Their own company information
- Published knowledge base articles
- Customer-visible ticket history

## Troubleshooting

### Common Issues

#### Deployment Failures
**Issue**: PowerShell script fails with permission errors
**Solution**:
- Verify Site Collection Admin rights
- Check PnP.PowerShell module installation
- Ensure multi-factor authentication is handled properly

#### Power Apps Connection Issues
**Issue**: "Data source not found" errors
**Solution**:
- Reconfigure SharePoint connections
- Verify user has proper SharePoint access
- Check Power Apps environment configuration

#### Workflow Execution Problems
**Issue**: Power Automate workflows not running
**Solution**:
- Check workflow triggers and permissions
- Verify SharePoint list permissions
- Review workflow connection settings

#### SLA Monitoring Not Working
**Issue**: SLA warnings or escalations not triggering
**Solution**:
- Verify SLA rules are configured correctly
- Check that tickets have proper SLA deadlines
- Review Power Automate flow execution history

### Support Resources

#### Documentation
- [SharePoint Development Documentation](https://docs.microsoft.com/sharepoint/dev/)
- [Power Apps Documentation](https://docs.microsoft.com/powerapps/)
- [Power Automate Documentation](https://docs.microsoft.com/flow/)

#### Community Support
- [Power Apps Community Forums](https://powerusers.microsoft.com/t5/Power-Apps/ct-p/PowerApps)
- [Power Automate Community Forums](https://powerusers.microsoft.com/t5/Microsoft-Power-Automate/ct-p/MPA)

#### Logs and Monitoring
- Check deployment logs: `Deployment-Log-*.log`
- Review Power Automate flow run history
- Monitor SharePoint site usage reports

## Maintenance

### Regular Maintenance Tasks

#### Monthly
- Review and purge resolved tickets (based on retention policy)
- Update knowledge articles for accuracy
- Analyze SLA performance and adjust rules
- Backup custom configurations

#### Quarterly
- Review agent permissions and access
- Update Power Automate flow optimizations
- Performance tuning for large datasets
- User feedback collection and improvements

### Updates and Upgrades

#### System Updates
1. Test updates in development environment
2. Create backup of current configuration
3. Deploy updates during maintenance window
4. Validate update success
5. Monitor system performance post-update

#### Configuration Updates
- SLA rules: Updated directly in SharePoint
- Power Apps: Updated via Power Apps Studio
- Workflows: Updated via Power Automate interface

## Best Practices

### Data Management
- Regular backup of SharePoint lists
- Implement data retention policies
- Monitor list size and performance
- Archive old tickets periodically

### User Training
- Provide comprehensive agent training
- Create customer guides and tutorials
- Regular refresher training sessions
- Gather user feedback for improvements

### Performance Optimization
- Optimize SharePoint list views
- Monitor Power Apps performance
- Review Power Automate flow efficiency
- Regular system health checks

## License and Support

This CRM solution is provided as-is for use within your organization. For support:

- **Technical Support**: Contact your SharePoint administrator
- **Feature Requests**: Submit through your internal development team
- **Documentation Updates**: Maintained by your technical team

## Version History

### Version 1.0.0 (Initial Release)
- Complete CRM functionality
- Automated ticket management
- Customer and agent portals
- SLA monitoring and reporting
- One-click deployment package

---

**Last Updated**: November 2024
**Version**: 1.0.0
**Platform**: SharePoint Online, Power Apps, Power Automate