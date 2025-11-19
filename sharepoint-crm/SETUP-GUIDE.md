# SharePoint CRM Setup Guide

This comprehensive guide walks you through the complete setup and configuration of the SharePoint Customer Service CRM system.

## Table of Contents

1. [Pre-Setup Checklist](#pre-setup-checklist)
2. [Environment Preparation](#environment-preparation)
3. [System Installation](#system-installation)
4. [Configuration](#configuration)
5. [User Setup](#user-setup)
6. [Testing and Validation](#testing-and-validation)
7. [Go-Live Checklist](#go-live-checklist)
8. [Post-Setup Maintenance](#post-setup-maintenance)

## Pre-Setup Checklist

### Required Permissions
- [ ] SharePoint Online Site Collection Administrator
- [ ] Power Apps Environment Admin
- [ ] Power Automate Flow Admin
- [ ] Microsoft 365 Global Admin (recommended)
- [ ] Azure AD rights for app registrations (if using custom connectors)

### Microsoft 365 Licenses
- [ ] SharePoint Online Plan 2 or higher
- [ ] Power Apps Plan 2 for all users
- [ ] Power Automate Premium Plan
- [ ] Office 365 Enterprise E3 or higher (recommended)

### Technical Requirements
- [ ] Windows 10/11 with Visual Studio 2022 Professional/Enterprise
- [ ] PowerShell 5.1 or later
- [ ] Microsoft Edge, Chrome, or Firefox browser
- [ ] Stable internet connection

### Planning Information
- [ ] Determine SharePoint site URL for CRM
- [ ] Identify initial CRM administrators
- [ ] Define company name and branding details
- [ ] Plan user groups (Administrators, Agents, Customers)
- [ ] Determine business hours and SLA requirements

## Environment Preparation

### Step 1: Create SharePoint Site

#### Option A: New Site Creation
1. Go to Microsoft 365 Admin Center
2. Navigate to **SharePoint** > **Active sites**
3. Click **Create** > **Team site**
4. Configure site settings:
   - **Site name**: Customer Service CRM
   - **Site address**: crm (or your preferred name)
   - **Description**: Customer Relationship Management System
   - **Privacy settings**: Private
   - **Template**: Team site
5. Click **Finish**

#### Option B: Use Existing Site
1. Ensure existing site has modern experience enabled
2. Verify you have Site Collection Admin permissions
3. Note the site URL for deployment

### Step 2: Install PowerShell Modules

Open PowerShell as Administrator and run:

```powershell
# Set execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Install required modules
Install-Module -Name PnP.PowerShell -Scope CurrentUser -Force
Install-Module -Name Microsoft.PowerApps.PowerShell -Scope CurrentUser -Force

# Verify installation
Get-Module -ListAvailable PnP.PowerShell
Get-Module -ListAvailable Microsoft.PowerApps.PowerShell
```

### Step 3: Prepare Visual Studio

1. **Install Visual Studio 2022 Professional/Enterprise**
   - Download from [Visual Studio website](https://visualstudio.microsoft.com/)
   - Include ".NET desktop development" workload
   - Add "SharePoint development tools"

2. **Install Additional Extensions**
   - Microsoft 365 development tools
   - PnP PowerShell extension (optional)

### Step 4: Create Microsoft 365 Group

1. Go to **Microsoft 365 Admin Center**
2. Navigate to **Groups** > **Active groups**
3. Click **Add a group**
4. Configure group:
   - **Group type**: Microsoft 365
   - **Name**: CRM Users
   - **Group email address**: crm-users@yourcompany.com
   - **Privacy**: Private
5. Add initial CRM administrators as members

## System Installation

### Step 1: Download and Extract CRM Package

1. Download the SharePoint CRM package
2. Extract to a local directory (e.g., `C:\SharePointCRM`)
3. Verify the following structure:
   ```
   SharePointCRM/
   ├── Templates/
   │   └── Lists/
   ├── PowerApps/
   ├── Flows/
   ├── Scripts/
   ├── Config/
   ├── SharePointCRM.sln
   └── README.md
   ```

### Step 2: Open in Visual Studio

1. Launch Visual Studio 2022
2. Open `SharePointCRM.sln`
3. Review the solution structure
4. Build the solution to verify no compilation errors

### Step 3: Deploy CRM Infrastructure

#### Open PowerShell as Administrator
```powershell
# Navigate to Scripts directory
cd C:\SharePointCRM\Scripts

# Test connection (optional)
Test-PnPOnline -Url "https://yourtenant.sharepoint.com/sites/crm"

# Run deployment
.\Deploy.ps1 -SiteUrl "https://yourtenant.sharepoint.com/sites/crm"
```

#### Deployment Process
The deployment script will:
1. Validate prerequisites
2. Connect to SharePoint site
3. Create all CRM lists with proper schemas
4. Set up views and formatting
5. Apply permissions structure
6. Create initial SLA rules
7. Generate deployment report

#### Monitor Deployment Progress
- Watch PowerShell output for progress
- Check for any error messages
- Review generated deployment report

### Step 4: Configure System Settings

#### Run Configuration Script
```powershell
# Navigate to Scripts directory
cd C:\SharePointCRM\Scripts

# Run configuration
.\Configure.ps1 -SiteUrl "https://yourtenant.sharepoint.com/sites/crm" `
    -AdminEmail "admin@yourcompany.com" `
    -CompanyName "Your Company Name" `
    -ConfigureSampleData `
    -ConfigureEmailSettings
```

#### Configuration Options
- **ConfigureSampleData**: Creates sample customers, agents, and tickets for testing
- **ConfigureEmailSettings**: Sets up email notification templates
- **CompanyName**: Used for branding and email templates
- **AdminEmail**: Initial CRM administrator

## Configuration

### Step 1: Power Apps Configuration

#### Agent Dashboard Setup
1. Open **Power Apps Studio**
2. Click **Apps** > **Import canvas app**
3. Select `AgentDashboard.msapp` from PowerApps folder
4. **Configure Data Sources**:
   - SharePoint site URL
   - List permissions
   - Connection settings
5. **Test Connections** for all data sources
6. **Save and Publish** the app
7. **Share with CRM Agents group**

#### Customer Portal Setup
1. Import `CustomerPortal.msapp` from PowerApps folder
2. Configure data sources with customer-specific filters
3. Set up external sharing permissions
4. Customize branding and colors
5. Publish and share with external users

### Step 2: Power Automate Workflows

#### Import Workflows
1. Go to **Power Automate** > **My flows**
2. Click **Import** > **Upload package**
3. Select files from Flows folder:
   - `AutoAssignment.json`
   - `SLAMonitoring.json`
   - `CustomerCommunications.json`

#### Configure Workflow Connections
1. Verify SharePoint connection
2. Configure Office 365 email settings
3. Test workflow triggers
4. Monitor initial flow executions

### Step 3: SharePoint Configuration

#### Site Navigation
1. Go to SharePoint site
2. Navigate to **Site Settings** > **Navigation**
3. Configure top navigation:
   - Dashboard
   - Tickets
   - Customers
   - Knowledge Base
   - Reports

#### Home Page Setup
1. Edit the home page
2. Add CRM Dashboard web parts
3. Configure quick links and announcements
4. Publish the page

### Step 4: Security Configuration

#### SharePoint Groups
1. Create SharePoint groups:
   - CRM Administrators
   - CRM Agents
   - CRM Customers
2. Assign appropriate permissions
3. Add users to groups

#### List Permissions
1. Configure list-level permissions
2. Set up item-level security for tickets
3. Test access for different user types

## User Setup

### Step 1: Agent Accounts

#### Create Agent Profiles
1. Navigate to "CRM Agents" list
2. Add each agent with:
   - **Name**: Full name
   - **User Account**: SharePoint user account
   - **Role**: Agent, Senior Agent, Team Lead, Manager
   - **Skills**: Technical Support, Billing Support, etc.
   - **Max Concurrent Tickets**: 6-10 based on role
   - **Status**: Active

#### Configure Agent Permissions
1. Add agents to "CRM Agents" SharePoint group
2. Share Power Apps with individual agents
3. Test agent access to required resources

### Step 2: Customer Accounts

#### Create Customer Profiles
1. Navigate to "CRM Customers" list
2. Add customers with:
   - **Company Name**: Legal company name
   - **Contact Name**: Primary contact person
   - **Email**: Contact email address
   - **Phone**: Contact phone number
   - **Account Type**: Free, Basic, Premium, Enterprise
   - **Account Status**: Active, Inactive, Prospect

#### Customer Portal Access
1. Add customers to "CRM Customers" SharePoint group
2. Configure external sharing permissions
3. Send customer portal invitations

### Step 3: Administrator Accounts

#### Initial Admin Setup
1. Add administrators to "CRM Administrators" group
2. Configure full permissions to all CRM components
3. Provide administrative access to Power Apps and flows

## Testing and Validation

### Step 1: System Validation

#### Run Validation Script
```powershell
# Navigate to Scripts directory
cd C:\SharePointCRM\Scripts

# Run comprehensive validation
.\Validate.ps1 -SiteUrl "https://yourtenant.sharepoint.com/sites/crm" -Detailed -ExportReport
```

#### Manual Testing Checklist
- [ ] All SharePoint lists created correctly
- [ ] Views and filters working properly
- [ ] Power Apps load without errors
- [ ] Data connections functioning
- [ ] Power Automate workflows triggering
- [ ] Email notifications sending
- [ ] Permissions working correctly

### Step 2: Workflow Testing

#### Ticket Creation Test
1. Create a test ticket as customer
2. Verify auto-assignment workflow
3. Check SLA deadline calculation
4. Confirm email notifications sent

#### SLA Monitoring Test
1. Create high-priority test ticket
2. Verify SLA warning notifications
3. Test escalation process
4. Check monitoring dashboard

#### Customer Communication Test
1. Change ticket status multiple times
2. Verify customer email updates
3. Test satisfaction survey flow
4. Confirm communication history

### Step 3: User Acceptance Testing

#### Agent Testing
- Login as test agent
- View assigned tickets
- Update ticket status
- Access customer information
- Use knowledge base search

#### Customer Testing
- Login as test customer
- Create new ticket
- View ticket status
- Access knowledge base
- Update account information

## Go-Live Checklist

### Pre-Launch Preparation

#### Final Validation
- [ ] All validation tests passed
- [ ] No critical errors in logs
- [ ] All user accounts created
- [ ] Training materials prepared
- [ ] Support procedures documented

#### Communication Plan
- [ ] User notification emails sent
- [ ] Training sessions scheduled
- [ ] Support contacts established
- [ ] Go-live announcement prepared

### Launch Day Activities

#### System Go-Live
1. **Final system backup**
2. **Remove test data** (if sample data was used)
3. **Enable all features**
4. **Monitor system performance**
5. **Provide user support**

#### User Support
- Monitor help desk tickets
- Provide immediate user assistance
- Document and resolve issues quickly
- Collect initial user feedback

### Post-Launch Review

#### 24-Hour Review
- System performance metrics
- User adoption rates
- Support ticket volume
- Critical issues and resolutions

#### 1-Week Review
- User satisfaction survey
- Workflow optimization opportunities
- Additional training needs
- Performance improvements

## Post-Setup Maintenance

### Daily Monitoring
- Check Power Automate flow execution
- Monitor SharePoint list performance
- Review system health indicators
- Address user support tickets

### Weekly Maintenance
- Review SLA compliance reports
- Update knowledge base articles
- Monitor user activity metrics
- Backup critical configurations

### Monthly Maintenance
- Purge resolved tickets (retention policy)
- Review and optimize workflows
- Update user permissions as needed
- System performance tuning

### Quarterly Review
- Comprehensive system audit
- User feedback collection
- Feature enhancement planning
- Security compliance review

## Troubleshooting Guide

### Common Deployment Issues

#### PowerShell Module Errors
```powershell
# Clear module cache
Get-Module PnP.PowerShell | Remove-Module
# Reinstall module
Install-Module -Name PnP.PowerShell -Scope CurrentUser -Force
```

#### Permission Errors
- Verify Site Collection Admin rights
- Check multi-factor authentication setup
- Confirm SharePoint site access

#### Connection Issues
- Test network connectivity
- Verify SharePoint site URL
- Check firewall and proxy settings

### Performance Issues

#### Slow List Performance
- Optimize list views and queries
- Check indexed columns
- Monitor list item count

#### Power Apps Performance
- Review data source configuration
- Optimize Power FX formulas
- Check browser compatibility

### User Access Issues

#### Permission Problems
- Verify SharePoint group membership
- Check list-level permissions
- Review Power Apps sharing settings

#### Login Issues
- Confirm user account status
- Check multi-factor authentication
- Verify browser compatibility

---

**Need Help?**
- Internal IT Support: [Your IT Contact]
- Documentation: Review README.md and other guides
- Community Forums: Microsoft Power Platform Community

**Last Updated**: November 2024
**Version**: 1.0.0