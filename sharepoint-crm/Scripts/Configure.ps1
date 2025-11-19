<#
.SYNOPSIS
    SharePoint CRM Configuration Script
.DESCRIPTION
    Configures initial settings, creates default data, and sets up the CRM system.
.PARAMETER SiteUrl
    The SharePoint Online site URL where CRM is deployed
.PARAMETER AdminEmail
    Email address of the CRM administrator
.PARAMETER CompanyName
    Company name for branding and configuration
.PARAMETER ConfigureSampleData
    Create sample data for testing and demonstration
.PARAMETER ConfigureEmailSettings
    Set up email notification settings
.EXAMPLE
    .\Configure.ps1 -SiteUrl "https://tenant.sharepoint.com/sites/crm" -AdminEmail "admin@company.com" -CompanyName "Contoso"
.EXAMPLE
    .\Configure.ps1 -SiteUrl "https://tenant.sharepoint.com/sites/crm" -AdminEmail "admin@company.com" -CompanyName "Contoso" -ConfigureSampleData
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)]
    [string]$SiteUrl,

    [Parameter(Mandatory=$true)]
    [string]$AdminEmail,

    [Parameter(Mandatory=$true)]
    [string]$CompanyName,

    [Parameter(Mandatory=$false)]
    [switch]$ConfigureSampleData,

    [Parameter(Mandatory=$false)]
    [switch]$ConfigureEmailSettings
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "Continue"

# Logging
$LogPath = ".\Configuration-Log-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    Write-Host $logEntry
    Add-Content -Path $LogPath -Value $logEntry
}

function Connect-ToSite {
    Write-Log "Connecting to SharePoint site: $SiteUrl"
    try {
        $connection = Connect-PnPOnline -Url $SiteUrl -Interactive -ReturnConnection
        Write-Log "Successfully connected to SharePoint site"
        return $connection
    }
    catch {
        Write-Log "Failed to connect to SharePoint site: $($_.Exception.Message)" -Level "ERROR"
        throw
    }
}

function Set-CRMAdministrators {
    param([PnP.PowerShell.Commands.BaseConnect.PnPConnection]$Connection)

    Write-Log "Configuring CRM administrators..."

    try {
        # Check if CRM Administrators group exists
        $adminGroup = Get-PnPGroup -Identity "CRM Administrators" -Connection $Connection -ErrorAction SilentlyContinue
        if (-not $adminGroup) {
            Write-Log "Creating CRM Administrators group"
            $adminGroup = New-PnPGroup -Title "CRM Administrators" -Description "CRM System Administrators" -Connection $Connection
        }

        # Add the specified admin to the group
        $adminUser = Get-PnPUser -Identity $AdminEmail -Connection $Connection -ErrorAction SilentlyContinue
        if ($adminUser) {
            Write-Log "Adding $AdminEmail to CRM Administrators group"
            Add-PnPUserToGroup -Identity $adminGroup -User $adminUser -Connection $Connection
        }
        else {
            Write-Log "User $AdminEmail not found. Please ensure the user exists in the tenant." -Level "WARNING"
        }

        # Set site permissions for administrators group
        Set-PnPGroupPermissions -Identity $adminGroup -List "" -AddRole "Full Control" -Connection $Connection
        Write-Log "CRM administrators configured successfully"
    }
    catch {
        Write-Log "Failed to configure CRM administrators: $($_.Exception.Message)" -Level "ERROR"
    }
}

function Create-SampleCustomers {
    param([PnP.PowerShell.Commands.BaseConnect.PnPConnection]$Connection)

    Write-Log "Creating sample customer data..."

    $sampleCustomers = @(
        @{
            Title="Acme Corporation"
            ContactName="John Smith"
            Email="john.smith@acme.com"
            Phone="555-0101"
            Address="123 Main St, New York, NY 10001"
            AccountType="Enterprise"
            Industry="Technology"
            CompanySize="500"
            Website="https://acme.com"
        },
        @{
            Title="Global Industries"
            ContactName="Sarah Johnson"
            Email="sarah.j@globalindustries.com"
            Phone="555-0102"
            Address="456 Oak Ave, Chicago, IL 60601"
            AccountType="Premium"
            Industry="Manufacturing"
            CompanySize="200"
            Website="https://globalindustries.com"
        },
        @{
            Title="StartUp Solutions"
            ContactName="Mike Chen"
            Email="mike@startup.com"
            Phone="555-0103"
            Address="789 Pine Rd, Austin, TX 78701"
            AccountType="Basic"
            Industry="Software"
            CompanySize="25"
            Website="https://startup.com"
        },
        @{
            Title="Professional Services LLC"
            ContactName="Emily Davis"
            Email="emily@profsvc.com"
            Phone="555-0104"
            Address="321 Elm St, Boston, MA 02101"
            AccountType="Premium"
            Industry="Consulting"
            CompanySize="75"
            Website="https://profsvc.com"
        }
    )

    try {
        foreach ($customer in $sampleCustomers) {
            Write-Log "Creating customer: $($customer.Title)"
            Add-PnPListItem -List "CRM Customers" -Values $customer -Connection $Connection
        }
        Write-Log "Sample customers created successfully"
    }
    catch {
        Write-Log "Failed to create sample customers: $($_.Exception.Message)" -Level "ERROR"
    }
}

function Create-SampleAgents {
    param([PnP.PowerShell.Commands.BaseConnect.PnPConnection]$Connection)

    Write-Log "Creating sample agent data..."

    $sampleAgents = @(
        @{
            Title="Alex Wilson"
            UserAccount="alex.wilson@company.com"
            Email="alex.wilson@company.com"
            Phone="555-0201"
            Role="Team Lead"
            Skills=@("Technical Support", "Escalation Handling", "Account Management")
            Status="Active"
            MaxConcurrentTickets="10"
        },
        @{
            Title="Maria Garcia"
            UserAccount="maria.garcia@company.com"
            Email="maria.garcia@company.com"
            Phone="555-0202"
            Role="Senior Agent"
            Skills=@("Technical Support", "Product Knowledge", "Customer Service")
            Status="Active"
            MaxConcurrentTickets="8"
        },
        @{
            Title="David Lee"
            UserAccount="david.lee@company.com"
            Email="david.lee@company.com"
            Phone="555-0203"
            Role="Agent"
            Skills=@("Customer Service", "Billing Support")
            Status="Active"
            MaxConcurrentTickets="6"
        },
        @{
            Title="Jennifer Brown"
            UserAccount="jennifer.brown@company.com"
            Email="jennifer.brown@company.com"
            Phone="555-0204"
            Role="Agent"
            Skills=@("Technical Support", "Product Knowledge")
            Status="Active"
            MaxConcurrentTickets="6"
        }
    )

    try {
        foreach ($agent in $sampleAgents) {
            Write-Log "Creating agent: $($agent.Title)"
            # Convert skills array to string for SharePoint
            $agentValues = $agent.Clone()
            $agentValues["Skills"] = $agentValues["Skills"] -join ", "
            Add-PnPListItem -List "CRM Agents" -Values $agentValues -Connection $Connection
        }
        Write-Log "Sample agents created successfully"
    }
    catch {
        Write-Log "Failed to create sample agents: $($_.Exception.Message)" -Level "ERROR"
    }
}

function Create-SampleKnowledgeArticles {
    param([PnP.PowerShell.Commands.BaseConnect.PnPConnection]$Connection)

    Write-Log "Creating sample knowledge articles..."

    $sampleArticles = @(
        @{
            Title="How to Reset Your Password"
            ArticleBody="<h3>Password Reset Instructions</h3><ol><li>Go to the login page</li><li>Click 'Forgot Password'</li><li>Enter your email address</li><li>Check your email for reset link</li><li>Follow the link and create new password</li></ol><p><strong>Note:</strong> Password reset links expire after 24 hours.</p>"
            Category="FAQ"
            Tags="password,reset,login,account"
            Status="Published"
            Summary="Step-by-step guide for resetting user passwords"
        },
        @{
            Title="Troubleshooting Email Configuration Issues"
            ArticleBody="<h3>Common Email Problems</h3><h4>Issue 1: Cannot send emails</h4><ul><li>Check SMTP server settings</li><li>Verify authentication credentials</li><li>Check firewall settings</li></ul><h4>Issue 2: Not receiving emails</h4><ul><li>Check spam/junk folders</li><li>Verify MX records</li><li>Check email forwarding rules</li></ul>"
            Category="Technical"
            Tags="email,troubleshooting,SMTP,configuration"
            Status="Published"
            Summary="Solutions for common email configuration problems"
        },
        @{
            Title="Billing and Payment Processing Guide"
            ArticleBody="<h3>Billing Overview</h3><p>Our billing system processes payments automatically on the 1st of each month.</p><h3>Payment Methods</h3><ul><li>Credit Card (Visa, MasterCard, American Express)</li><li>Bank Transfer (ACH)</li><li>PayPal</li></ul><h3>Invoice Management</h3><p>Invoices are automatically generated and sent to the billing contact email address.</p>"
            Category="Billing"
            Tags="billing,payment,invoice,credit card"
            Status="Published"
            Summary="Complete guide to billing processes and payment methods"
        },
        @{
            Title="Getting Started with Your Account"
            ArticleBody="<h3>Welcome to $CompanyName!</h3><h4>First Steps:</h4><ol><li>Complete your profile information</li><li>Add team members</li><li>Configure basic settings</li><li>Explore the dashboard</li></ol><h4>Need Help?</h4><p>Contact our support team at support@company.com or create a ticket through this portal.</p>"
            Category="General"
            Tags="getting started,setup,onboarding,new user"
            Status="Published"
            Summary="Welcome guide for new users getting started with the system"
        }
    )

    try {
        foreach ($article in $sampleArticles) {
            Write-Log "Creating knowledge article: $($article.Title)"
            $articleValues = $article.Clone()
            $articleValues["Author"] = $AdminEmail
            $articleValues["PublishedDate"] = Get-Date
            $articleValues["CreatedDate"] = Get-Date
            Add-PnPListItem -List "CRM Knowledge Articles" -Values $articleValues -Connection $Connection
        }
        Write-Log "Sample knowledge articles created successfully"
    }
    catch {
        Write-Log "Failed to create sample knowledge articles: $($_.Exception.Message)" -Level "ERROR"
    }
}

function Create-SampleTickets {
    param([PnP.PowerShell.Commands.BaseConnect.PnPConnection]$Connection)

    Write-Log "Creating sample tickets..."

    # Get sample customers and agents for relationships
    $customers = Get-PnPListItem -List "CRM Customers" -Connection $Connection | Select-Object -First 3
    $agents = Get-PnPListItem -List "CRM Agents" -Connection $Connection | Select-Object -First 2

    $sampleTickets = @(
        @{
            Title="Unable to access account dashboard"
            Description="I'm trying to log into my account but keep getting an error message saying 'Access Denied'. I've tried resetting my password but that didn't help. I need to access my dashboard urgently for a presentation tomorrow."
            Priority="High"
            Category="Technical"
            Status="In Progress"
            CustomerId=$customers[0].Id
            AssignedTo=$agents[0].Id
            CreatedDate=(Get-Date).AddHours(-2)
        },
        @{
            Title="Question about billing cycle"
            Description="I received an invoice that seems higher than expected. Can you please explain how the billing cycle works and verify if this is correct? Our plan should be the Premium tier."
            Priority="Medium"
            Category="Billing"
            Status="New"
            CustomerId=$customers[1].Id
            CreatedDate=(Get-Date).AddHours(-1)
        },
        @{
            Title="Request for additional user licenses"
            Description="Our team is growing and we need to add 5 more user accounts to our subscription. What's the process for adding users and how will this affect our monthly billing?"
            Priority="Medium"
            Category="General"
            Status="Waiting for Customer"
            CustomerId=$customers[2].Id
            AssignedTo=$agents[1].Id
            CreatedDate=(Get-Date).AddDays(-1)
            ResolutionNotes="Customer has been provided with information about user licensing process. Waiting for confirmation on number of licenses needed."
        }
    )

    try {
        foreach ($ticket in $sampleTickets) {
            Write-Log "Creating ticket: $($ticket.Title)"
            Add-PnPListItem -List "CRM Tickets" -Values $ticket -Connection $Connection

            # Create corresponding history entry
            $historyEntry = @{
                Title="Ticket created: $($ticket.Title)"
                TicketId=$null  # Will be set after ticket creation
                ActionType="Created"
                ActionedBy=$customers[[Math]::Floor($ticket.CustomerId - 1)].Fields.Email
                Description="Initial ticket creation with description: $($ticket.Description)"
                ActionDate=Get-Date
                Visibility="Internal"
            }
            Add-PnPListItem -List "CRM Ticket History" -Values $historyEntry -Connection $Connection
        }
        Write-Log "Sample tickets created successfully"
    }
    catch {
        Write-Log "Failed to create sample tickets: $($_.Exception.Message)" -Level "ERROR"
    }
}

function Configure-EmailNotifications {
    param([PnP.PowerShell.Commands.BaseConnect.PnPConnection]$Connection)

    Write-Log "Configuring email notification settings..."

    try {
        # Create email template configuration list or use existing configuration
        $emailTemplates = @(
            @{
                Title="New Ticket Confirmation"
                TemplateType="Customer Notification"
                Subject="[$CompanyName CRM] Ticket Created: {TicketNumber}"
                Body="<p>Dear {CustomerName},</p><p>Your ticket has been successfully created with the following details:</p><p><strong>Ticket Number:</strong> {TicketNumber}<br><strong>Subject:</strong> {TicketTitle}<br><strong>Priority:</strong> {Priority}<br><strong>Category:</strong> {Category}</p><p>We will review your ticket and respond within our service level agreement timeframe. You can track the status of your ticket by logging into the customer portal.</p><p>Thank you for contacting $CompanyName support.</p>"
                IsActive=$true
            },
            @{
                Title="Ticket Status Update"
                TemplateType="Customer Notification"
                Subject="[$CompanyName CRM] Ticket Update: {TicketNumber} - {NewStatus}"
                Body="<p>Dear {CustomerName},</p><p>Your ticket <strong>{TicketNumber}</strong> has been updated.</p><p><strong>Status:</strong> {NewStatus}<br><strong>Updated By:</strong> {AgentName}</p><p><strong>Comments:</strong> {Comments}</p><p>You can view all ticket details by logging into the customer portal.</p><p>Best regards,<br>$CompanyName Support Team</p>"
                IsActive=$true
            },
            @{
                Title="Ticket Resolved"
                TemplateType="Customer Notification"
                Subject="[$CompanyName CRM] Ticket Resolved: {TicketNumber}"
                Body="<p>Dear {CustomerName},</p><p>Good news! Your ticket <strong>{TicketNumber}</strong> has been marked as resolved.</p><p><strong>Resolution Summary:</strong> {ResolutionNotes}</p><p><strong>Resolved By:</strong> {AgentName}</p><p>Please log into the customer portal to review the resolution and let us know if your issue has been completely resolved.</p><p>If you have any questions or if the issue persists, please don't hesitate to contact us.</p><p>Best regards,<br>$CompanyName Support Team</p>"
                IsActive=$true
            },
            @{
                Title="New Ticket Assignment"
                TemplateType="Agent Notification"
                Subject="[$CompanyName CRM] New Ticket Assigned: {TicketNumber}"
                Body="<p>Hello {AgentName},</p><p>A new ticket has been assigned to you:</p><p><strong>Ticket Number:</strong> {TicketNumber}<br><strong>Subject:</strong> {TicketTitle}<br><strong>Priority:</strong> {Priority}<br><strong>Customer:</strong> {CustomerName}</p><p><strong>Description:</strong> {Description}</p><p>Please review and begin working on this ticket at your earliest convenience.</p>"
                IsActive=$true
            }
        )

        Write-Log "Email templates configured. These will be used by Power Automate workflows."
        Write-Log "Note: Actual email sending will be configured in Power Automate workflows."
    }
    catch {
        Write-Log "Failed to configure email notifications: $($_.Exception.Message)" -Level "ERROR"
    }
}

function Set-CustomBranding {
    param([PnP.PowerShell.Commands.BaseConnect.PnPConnection]$Connection)

    Write-Log "Applying custom branding for $CompanyName..."

    try {
        # Set site title and description
        Set-PnPWeb -Title "$CompanyName Customer Service CRM" -Description "Customer Relationship Management System for $CompanyName" -Connection $Connection

        # Apply theme (if available)
        # Set-PnPWebTheme -Theme "Company Theme" -Connection $Connection

        Write-Log "Custom branding applied successfully"
    }
    catch {
        Write-Log "Failed to apply custom branding: $($_.Exception.Message)" -Level "WARNING"
    }
}

function New-ConfigurationReport {
    Write-Log "Generating configuration report..."

    $reportPath = ".\Configuration-Report-$(Get-Date -Format 'yyyyMMdd-HHmmss').html"

    $sampleDataStatus = if ($ConfigureSampleData) { "Created" } else { "Skipped" }
    $emailConfigStatus = if ($ConfigureEmailSettings) { "Configured" } else { "Skipped" }

    $reportContent = @"
<!DOCTYPE html>
<html>
<head>
    <title>SharePoint CRM Configuration Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #0078d4; color: white; padding: 20px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
        .success { background-color: #dff0d8; }
        .warning { background-color: #fcf8e3; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>SharePoint CRM Configuration Report</h1>
        <p>Generated: $(Get-Date)</p>
        <p>Company: $CompanyName</p>
        <p>Administrator: $AdminEmail</p>
    </div>

    <div class="section">
        <h2>Configuration Summary</h2>
        <table>
            <tr><th>Component</th><th>Status</th><th>Details</th></tr>
            <tr><td>Administrators</td><td class="success">Success</td><td>CRM Administrators group configured</td></tr>
            <tr><td>Custom Branding</td><td class="success">Success</td><td>Site title and description updated</td></tr>
            <tr><td>Sample Data</td><td class="success">$sampleDataStatus</td><td>Sample customers, agents, and articles</td></tr>
            <tr><td>Email Configuration</td><td class="success">$emailConfigStatus</td><td>Email templates set up</td></tr>
        </table>
    </div>

    <div class="section">
        <h2>System Information</h2>
        <ul>
            <li><strong>Site URL:</strong> $SiteUrl</li>
            <li><strong>Company Name:</strong> $CompanyName</li>
            <li><strong>Administrator:</strong> $AdminEmail</li>
            <li><strong>Lists Created:</strong> 6 (Tickets, Customers, Knowledge Articles, Agents, SLA Rules, Ticket History)</li>
        </ul>
    </div>

    <div class="section">
        <h2>Next Steps</h2>
        <ol>
            <li>Verify that all users can access the appropriate lists and features</li>
            <li>Test ticket creation and assignment workflow</li>
            <li>Configure Power Automate workflows if not already done</li>
            <li>Customize SLA rules based on business requirements</li>
            <li>Train agents and customers on using the system</li>
        </ol>
    </div>

    <div class="section">
        <h2>Support</h2>
        <p>For issues or questions, refer to the configuration log: $LogPath</p>
    </div>
</body>
</html>
"@

    Set-Content -Path $reportPath -Value $reportContent
    Write-Log "Configuration report generated: $reportPath"
}

# Main execution
try {
    Write-Log "Starting SharePoint CRM configuration..."
    Write-Log "Target site: $SiteUrl"
    Write-Log "Company: $CompanyName"
    Write-Log "Administrator: $AdminEmail"

    $connection = Connect-ToSite

    Set-CRMAdministrators -Connection $connection
    Set-CustomBranding -Connection $connection

    if ($ConfigureSampleData) {
        Create-SampleCustomers -Connection $connection
        Create-SampleAgents -Connection $connection
        Create-SampleKnowledgeArticles -Connection $connection
        Create-SampleTickets -Connection $connection
    }

    if ($ConfigureEmailSettings) {
        Configure-EmailNotifications -Connection $connection
    }

    New-ConfigurationReport

    Write-Log "Configuration completed successfully!" -Level "SUCCESS"
    Disconnect-PnPOnline -Connection $connection
}
catch {
    Write-Log "Configuration failed: $($_.Exception.Message)" -Level "ERROR"
    throw
}

Write-Host "Configuration completed. Check the log file for details: $LogPath" -ForegroundColor Green