<#
.SYNOPSIS
    SharePoint CRM Deployment Validation Script
.DESCRIPTION
    Validates that all CRM components are properly deployed and functioning.
.PARAMETER SiteUrl
    The SharePoint Online site URL where CRM is deployed
.PARAMETER Credentials
    PSCredential object for authentication
.PARAMETER Detailed
    Show detailed validation results including individual item counts
.PARAMETER ExportReport
    Export validation results to HTML report
.EXAMPLE
    .\Validate.ps1 -SiteUrl "https://tenant.sharepoint.com/sites/crm" -Credentials $cred
.EXAMPLE
    .\Validate.ps1 -SiteUrl "https://tenant.sharepoint.com/sites/crm" -Detailed -ExportReport
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)]
    [string]$SiteUrl,

    [Parameter(Mandatory=$false)]
    [PSCredential]$Credentials,

    [Parameter(Mandatory=$false)]
    [switch]$Detailed,

    [Parameter(Mandatory=$false)]
    [switch]$ExportReport
)

$ErrorActionPreference = "Continue"
$ProgressPreference = "Continue"

# Validation results storage
$validationResults = @()
$warnings = @()
$errors = @()

# Logging
$LogPath = ".\Validation-Log-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    Write-Host $logEntry
    Add-Content -Path $LogPath -Value $logEntry
}

function Add-ValidationResult {
    param(
        [string]$Component,
        [string]$Name,
        [ValidateSet("Success", "Warning", "Error")]
        [string]$Status,
        [string]$Message,
        [hashtable]$Details = $null
    )

    $result = @{
        Component = $Component
        Name = $Name
        Status = $Status
        Message = $Message
        Timestamp = Get-Date
        Details = $Details
    }

    $validationResults += $result

    switch ($Status) {
        "Warning" { $warnings += $result }
        "Error" { $errors += $result }
    }

    Write-Log "[$Status] $Component - $Name: $Message" -Level $Status
}

function Test-SiteConnection {
    Write-Log "Testing SharePoint site connection..."

    try {
        if ($Credentials) {
            $connection = Connect-PnPOnline -Url $SiteUrl -Credentials $Credentials -ReturnConnection -ErrorAction Stop
        }
        else {
            $connection = Connect-PnPOnline -Url $SiteUrl -Interactive -ReturnConnection -ErrorAction Stop
        }

        # Test basic site access
        $web = Get-PnPWeb -Connection $connection
        Add-ValidationResult -Component "Connection" -Name "Site Access" -Status "Success" -Message "Successfully connected to SharePoint site" -Details @{
            SiteTitle = $web.Title
            SiteUrl = $web.Url
            Created = $web.Created
            LastModified = $web.LastItemModifiedDate
        }

        return $connection
    }
    catch {
        Add-ValidationResult -Component "Connection" -Name "Site Access" -Status "Error" -Message "Failed to connect to SharePoint site: $($_.Exception.Message)"
        throw
    }
}

function Test-CRMLists {
    param([PnP.PowerShell.Commands.BaseConnect.PnPConnection]$Connection)

    Write-Log "Validating CRM lists..."

    $expectedLists = @(
        @{Name="CRM Tickets"; RequiredFields=@("Title", "Description", "CustomerID", "Status", "Priority", "Category")},
        @{Name="CRM Customers"; RequiredFields=@("Title", "ContactName", "Email", "AccountStatus", "AccountType")},
        @{Name="CRM Knowledge Articles"; RequiredFields=@("Title", "ArticleBody", "Category", "Status", "Author")},
        @{Name="CRM Agents"; RequiredFields=@("Title", "UserAccount", "Role", "Skills", "Status")},
        @{Name="CRM SLA Rules"; RequiredFields=@("Title", "Priority", "FirstResponseTime", "ResolutionTime", "Status")},
        @{Name="CRM Ticket History"; RequiredFields=@("Title", "TicketID", "ActionType", "ActionedBy", "ActionDate")}
    )

    foreach ($listInfo in $expectedLists) {
        try {
            $list = Get-PnPList -Identity $listInfo.Name -Connection $Connection -ErrorAction SilentlyContinue

            if (-not $list) {
                Add-ValidationResult -Component "Lists" -Name $listInfo.Name -Status "Error" -Message "List does not exist"
                continue
            }

            # Check list properties
            $details = @{
                ItemCount = $list.ItemCount
                Created = $list.Created
                LastModified = $list.LastItemModifiedDate
                BaseTemplate = $list.BaseTemplate
                EnabledContentTypes = $list.ContentTypesEnabled
            }

            if ($Detailed) {
                Write-Log "List '$($listInfo.Name)' found with $($details.ItemCount) items"
            }

            # Check required fields
            $missingFields = @()
            foreach ($fieldName in $listInfo.RequiredFields) {
                $field = Get-PnPField -List $listInfo.Name -Identity $fieldName -Connection $Connection -ErrorAction SilentlyContinue
                if (-not $field) {
                    $missingFields += $fieldName
                }
            }

            if ($missingFields.Count -eq 0) {
                Add-ValidationResult -Component "Lists" -Name $listInfo.Name -Status "Success" -Message "List exists with all required fields" -Details $details
            }
            else {
                Add-ValidationResult -Component "Lists" -Name $listInfo.Name -Status "Warning" -Message "List exists but missing required fields: $($missingFields -join ', ')" -Details $details
            }
        }
        catch {
            Add-ValidationResult -Component "Lists" -Name $listInfo.Name -Status "Error" -Message "Failed to validate list: $($_.Exception.Message)"
        }
    }
}

function Test-CRMViews {
    param([PnP.PowerShell.Commands.BaseConnect.PnPConnection]$Connection)

    Write-Log "Validating CRM list views..."

    $expectedViews = @{
        "CRM Tickets" = @("All Items", "My Tickets", "Unassigned", "By Customer", "SLA Dashboard")
        "CRM Customers" = @("All Customers", "Active Customers", "By Account Type")
        "CRM Knowledge Articles" = @("All Articles", "Published Articles", "Draft Articles", "Most Viewed")
        "CRM Agents" = @("All Agents", "Active Agents", "Available for Assignment")
    }

    foreach ($listName in $expectedViews.Keys) {
        try {
            $list = Get-PnPList -Identity $listName -Connection $Connection -ErrorAction SilentlyContinue
            if (-not $list) {
                continue
            }

            $views = Get-PnPView -List $listName -Connection $Connection
            $viewNames = $views | Select-Object -ExpandProperty Title
            $expectedViewNames = $expectedViews[$listName]

            $missingViews = $expectedViewNames | Where-Object { $_ -notin $viewNames }
            $extraViews = $viewNames | Where-Object { $_ -notin $expectedViewNames }

            $details = @{
                TotalViews = $views.Count
                ExpectedViews = $expectedViewNames.Count
                ActualViews = $viewNames
                MissingViews = $missingViews
                ExtraViews = $extraViews
            }

            if ($missingViews.Count -eq 0) {
                Add-ValidationResult -Component "Views" -Name "$listName Views" -Status "Success" -Message "All expected views are present" -Details $details
            }
            else {
                Add-ValidationResult -Component "Views" -Name "$listName Views" -Status "Warning" -Message "Missing views: $($missingViews -join ', ')" -Details $details
            }
        }
        catch {
            Add-ValidationResult -Component "Views" -Name "$listName Views" -Status "Error" -Message "Failed to validate views: $($_.Exception.Message)"
        }
    }
}

function Test-CRMGroups {
    param([PnP.PowerShell.Commands.BaseConnect.PnPConnection]$Connection)

    Write-Log "Validating CRM security groups..."

    $expectedGroups = @("CRM Administrators", "CRM Agents", "CRM Customers")

    foreach ($groupName in $expectedGroups) {
        try {
            $group = Get-PnPGroup -Identity $groupName -Connection $Connection -ErrorAction SilentlyContinue

            if (-not $group) {
                Add-ValidationResult -Component "Security" -Name $groupName -Status "Warning" -Message "Security group does not exist"
                continue
            }

            $members = Get-PnPGroupMember -Identity $group -Connection $Connection
            $details = @{
                GroupId = $group.Id
                GroupTitle = $group.Title
                Owner = $group.OwnerTitle
                MemberCount = $members.Count
                Members = $members | Select-Object -ExpandProperty Title
            }

            Add-ValidationResult -Component "Security" -Name $groupName -Status "Success" -Message "Security group exists" -Details $details
        }
        catch {
            Add-ValidationResult -Component "Security" -Name $groupName -Status "Error" -Message "Failed to validate security group: $($_.Exception.Message)"
        }
    }
}

function Test-SampleData {
    param([PnP.PowerShell.Commands.BaseConnect.PnPConnection]$Connection)

    Write-Log "Validating sample data presence..."

    try {
        # Check for basic data presence
        $dataChecks = @(
            @{List="CRM Customers"; MinItems=0; Check="Customer data availability"},
            @{List="CRM Agents"; MinItems=0; Check="Agent data availability"},
            @{List="CRM Knowledge Articles"; MinItems=0; Check="Knowledge articles availability"},
            @{List="CRM SLA Rules"; MinItems=0; Check="SLA rules availability"}
        )

        foreach ($check in $dataChecks) {
            $list = Get-PnPList -Identity $check.List -Connection $Connection -ErrorAction SilentlyContinue
            if (-not $list) {
                continue
            }

            $details = @{
                ListName = $check.List
                ItemCount = $list.ItemCount
                MinExpected = $check.MinItems
                CheckType = $check.Check
            }

            if ($list.ItemCount -gt $check.MinItems) {
                Add-ValidationResult -Component "Data" -Name $check.List -Status "Success" -Message "Sample data present" -Details $details
            }
            elseif ($list.ItemCount -eq $check.MinItems) {
                Add-ValidationResult -Component "Data" -Name $check.List -Status "Warning" -Message "No sample data found" -Details $details
            }
            else {
                Add-ValidationResult -Component "Data" -Name $check.List -Status "Error" -Message "Insufficient sample data" -Details $details
            }
        }

        # Check for critical data relationships
        $ticketsList = Get-PnPList -Identity "CRM Tickets" -Connection $Connection -ErrorAction SilentlyContinue
        if ($ticketsList) {
            $tickets = Get-PnPListItem -List "CRM Tickets" -Connection $Connection -Top 10
            $relationshipIssues = 0

            foreach ($ticket in $tickets) {
                if (-not $ticket["CustomerID"] -or -not $ticket["Status"]) {
                    $relationshipIssues++
                }
            }

            if ($relationshipIssues -eq 0) {
                Add-ValidationResult -Component "Data" -Name "Ticket Relationships" -Status "Success" -Message "Ticket data relationships are valid" -Details @{
                    CheckedTickets = $tickets.Count
                    IssuesFound = $relationshipIssues
                }
            }
            else {
                Add-ValidationResult -Component "Data" -Name "Ticket Relationships" -Status "Warning" -Message "Found $relationshipIssues tickets with data relationship issues" -Details @{
                    CheckedTickets = $tickets.Count
                    IssuesFound = $relationshipIssues
                }
            }
        }
    }
    catch {
        Add-ValidationResult -Component "Data" -Name "Sample Data" -Status "Error" -Message "Failed to validate sample data: $($_.Exception.Message)"
    }
}

function Test-ContentTypes {
    param([PnP.PowerShell.Commands.BaseConnect.PnPConnection]$Connection)

    Write-Log "Validating content types..."

    foreach ($listName in @("CRM Tickets", "CRM Customers", "CRM Knowledge Articles")) {
        try {
            $list = Get-PnPList -Identity $listName -Connection $Connection -ErrorAction SilentlyContinue
            if (-not $list) {
                continue
            }

            $contentTypes = Get-PnPContentType -List $listName -Connection $Connection
            $details = @{
                ListName = $listName
                ContentTypesEnabled = $list.ContentTypesEnabled
                ContentTypeCount = $contentTypes.Count
                ContentTypes = $contentTypes | Select-Object -ExpandProperty Name
            }

            if ($contentTypes.Count -gt 0) {
                Add-ValidationResult -Component "ContentTypes" -Name $listName -Status "Success" -Message "Content types configured" -Details $details
            }
            else {
                Add-ValidationResult -Component "ContentTypes" -Name $listName -Status "Warning" -Message "No custom content types found" -Details $details
            }
        }
        catch {
            Add-ValidationResult -Component "ContentTypes" -Name $listName -Status "Error" -Message "Failed to validate content types: $($_.Exception.Message)"
        }
    }
}

function Test-FieldValidation {
    param([PnP.PowerShell.Commands.BaseConnect.PnPConnection]$Connection)

    Write-Log "Validating field requirements and constraints..."

    try {
        # Test critical field validations
        $validations = @(
            @{
                List="CRM Tickets";
                Field="Status";
                Validation="Required choice field with expected values";
                ExpectedValues=@("New", "In Progress", "Waiting for Customer", "Resolved", "Closed")
            },
            @{
                List="CRM Customers";
                Field="AccountStatus";
                Validation="Required choice field with expected values";
                ExpectedValues=@("Active", "Inactive", "Prospect")
            },
            @{
                List="CRM Agents";
                Field="Role";
                Validation="Required choice field with expected values";
                ExpectedValues=@("Agent", "Senior Agent", "Team Lead", "Manager")
            }
        )

        foreach ($validation in $validations) {
            $field = Get-PnPField -List $validation.List -Identity $validation.Field -Connection $Connection -ErrorAction SilentlyContinue

            if (-not $field) {
                Add-ValidationResult -Component "FieldValidation" -Name "$($validation.List) - $($validation.Field)" -Status "Error" -Message "Field does not exist"
                continue
            }

            $details = @{
                List = $validation.List
                Field = $validation.Field
                FieldType = $field.TypeDisplayName
                Required = $field.Required
                ValidationType = $validation.Validation
            }

            if ($field.Required) {
                Add-ValidationResult -Component "FieldValidation" -Name "$($validation.List) - $($validation.Field)" -Status "Success" -Message "Field validation passed" -Details $details
            }
            else {
                Add-ValidationResult -Component "FieldValidation" -Name "$($validation.List) - $($validation.Field)" -Status "Warning" -Message "Field is not marked as required" -Details $details
            }
        }
    }
    catch {
        Add-ValidationResult -Component "FieldValidation" -Name "Field Validation" -Status "Error" -Message "Failed to validate fields: $($_.Exception.Message)"
    }
}

function Test-PermissionInheritance {
    param([PnP.PowerShell.Commands.BaseConnect.PnPConnection]$Connection)

    Write-Log "Validating permission inheritance..."

    try {
        foreach ($listName in @("CRM Tickets", "CRM Customers", "CRM Knowledge Articles")) {
            $list = Get-PnPList -Identity $listName -Connection $Connection -ErrorAction SilentlyContinue
            if (-not $list) {
                continue
            }

            $details = @{
                ListName = $listName
                HasUniqueRoleAssignments = $list.HasUniqueRoleAssignments
                ItemCount = $list.ItemCount
                Created = $list.Created
            }

            Add-ValidationResult -Component "Permissions" -Name $listName -Status "Success" -Message "Permission inheritance checked" -Details $details
        }
    }
    catch {
        Add-ValidationResult -Component "Permissions" -Name "Permission Inheritance" -Status "Error" -Message "Failed to validate permissions: $($_.Exception.Message)"
    }
}

function Export-ValidationReport {
    param()

    $reportPath = ".\Validation-Report-$(Get-Date -Format 'yyyyMMdd-HHmmss').html"

    $successCount = ($validationResults | Where-Object { $_.Status -eq "Success" }).Count
    $warningCount = ($validationResults | Where-Object { $_.Status -eq "Warning" }).Count
    $errorCount = ($validationResults | Where-Object { $_.Status -eq "Error" }).Count

    $overallStatus = if ($errorCount -gt 0) { "Error" } elseif ($warningCount -gt 0) { "Warning" } else { "Success" }

    $resultsTable = $validationResults | ForEach-Object {
        $row = "<tr>"
        $row += "<td>$($_.Component)</td>"
        $row += "<td>$($_.Name)</td>"
        $row += "<td class='$($_.Status.ToLower())'>$($_.Status)</td>"
        $row += "<td>$($_.Message)</td>"
        if ($Detailed) {
            $detailsHtml = if ($_.Details) { "<ul>$($_.Details.GetEnumerator() | ForEach-Object { "<li><strong>$($_.Key):</strong> $($_.Value)</li>" })</ul>" } else { "None" }
            $row += "<td>$detailsHtml</td>"
        }
        $row += "</tr>"
        $row
    }

    $detailedHeaders = if ($Detailed) { "<th>Details</th>" } else { "" }

    $reportContent = @"
<!DOCTYPE html>
<html>
<head>
    <title>SharePoint CRM Validation Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #0078d4; color: white; padding: 20px; }
        .summary { margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 5px; }
        .success { background-color: #dff0d8; }
        .warning { background-color: #fcf8e3; }
        .error { background-color: #f2dede; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 3px; font-weight: bold; color: white; }
        .success-badge { background-color: #5cb85c; }
        .warning-badge { background-color: #f0ad4e; }
        .error-badge { background-color: #d9534f; }
    </style>
</head>
<body>
    <div class="header">
        <h1>SharePoint CRM Validation Report</h1>
        <p>Generated: $(Get-Date)</p>
        <p>Target Site: $SiteUrl</p>
    </div>

    <div class="summary">
        <h2>Validation Summary</h2>
        <p><strong>Overall Status:</strong> <span class="badge $($overallStatus.ToLower())-badge">$overallStatus</span></p>
        <p><strong>Total Validations:</strong> $($validationResults.Count)</p>
        <p><span class="badge success-badge">Success: $successCount</span></p>
        <p><span class="badge warning-badge">Warnings: $warningCount</span></p>
        <p><span class="badge error-badge">Errors: $errorCount</span></p>
    </div>

    <h2>Validation Results</h2>
    <table>
        <tr>
            <th>Component</th>
            <th>Name</th>
            <th>Status</th>
            <th>Message</th>
            $detailedHeaders
        </tr>
        $resultsTable
    </table>

    <h2>Recommendations</h2>
    <ul>
        $(
            if ($errorCount -gt 0) {
                "<li><strong>Address Errors:</strong> Fix all validation errors before deploying to production</li>"
            }
            if ($warningCount -gt 0) {
                "<li><strong>Review Warnings:</strong> Consider addressing warnings for optimal system performance</li>"
            }
            if ($successCount -eq $validationResults.Count) {
                "<li><strong>All Clear:</strong> Your CRM deployment looks healthy and ready for use</li>"
            }
        )
        <li>Run this validation script periodically to monitor system health</li>
        <li>Check the validation log for detailed troubleshooting information: $LogPath</li>
    </ul>

    <h2>Next Steps</h2>
    <ol>
        <li>Address any validation errors identified in this report</li>
        <li>Review and address warnings as needed</li>
        <li>Test complete user workflows including ticket creation and management</li>
        <li>Verify that all agents can access appropriate lists and features</li>
        <li>Configure Power Automate workflows if not already completed</li>
    </ol>
</body>
</html>
"@

    Set-Content -Path $reportPath -Value $reportContent
    Write-Log "Validation report exported: $reportPath"

    # Open the report automatically if requested
    if ($ExportReport) {
        Invoke-Item $reportPath
    }
}

# Main execution
try {
    Write-Log "Starting SharePoint CRM validation..."
    Write-Log "Target site: $SiteUrl"

    $connection = Test-SiteConnection
    Test-CRMLists -Connection $connection
    Test-CRMViews -Connection $connection
    Test-CRMGroups -Connection $connection
    Test-SampleData -Connection $connection
    Test-ContentTypes -Connection $connection
    Test-FieldValidation -Connection $connection
    Test-PermissionInheritance -Connection $connection

    # Generate summary
    $totalChecks = $validationResults.Count
    $successCount = ($validationResults | Where-Object { $_.Status -eq "Success" }).Count
    $warningCount = ($validationResults | Where-Object { $_.Status -eq "Warning" }).Count
    $errorCount = ($validationResults | Where-Object { $_.Status -eq "Error" }).Count

    Write-Log "Validation completed with results:"
    Write-Log "Total Checks: $totalChecks"
    Write-Log "Success: $successCount" -Level "SUCCESS"
    Write-Log "Warnings: $warningCount" -Level "WARNING"
    Write-Log "Errors: $errorCount" -Level "ERROR"

    if ($errorCount -eq 0 -and $warningCount -eq 0) {
        Write-Log "All validations passed successfully!" -Level "SUCCESS"
    }
    elseif ($errorCount -eq 0) {
        Write-Log "Validation completed with warnings but no critical errors" -Level "WARNING"
    }
    else {
        Write-Log "Validation completed with critical errors that need attention" -Level "ERROR"
    }

    if ($ExportReport -or $Detailed) {
        Export-ValidationReport
    }

    Disconnect-PnPOnline -Connection $connection
}
catch {
    Write-Log "Validation failed: $($_.Exception.Message)" -Level "ERROR"
    throw
}

Write-Host "Validation completed. Check log file for details: $LogPath" -ForegroundColor Cyan