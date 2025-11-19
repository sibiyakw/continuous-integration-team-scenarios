"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const msal_node_1 = require("@azure/msal-node");
const microsoft_graph_client_1 = require("@microsoft/microsoft-graph-client");
class MSALAuthProvider {
    constructor(msalClient) {
        this.msalClient = msalClient;
    }
    async getAccessToken() {
        const tokenRequest = {
            scopes: ['https://graph.microsoft.com/.default'],
        };
        try {
            const response = await this.msalClient.acquireTokenByClientCredential(tokenRequest);
            if (!response || !response.accessToken) {
                throw new Error('Failed to acquire access token');
            }
            return response.accessToken;
        }
        catch (error) {
            console.error('Error acquiring access token:', error);
            throw error;
        }
    }
}
class AuthService {
    constructor() {
        if (!process.env.AZURE_CLIENT_ID || !process.env.AZURE_CLIENT_SECRET || !process.env.AZURE_TENANT_ID) {
            throw new Error('Missing Azure AD configuration');
        }
        this.msalClient = new msal_node_1.ConfidentialClientApplication({
            auth: {
                clientId: process.env.AZURE_CLIENT_ID,
                clientSecret: process.env.AZURE_CLIENT_SECRET,
                authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
            },
        });
        const authProvider = new MSALAuthProvider(this.msalClient);
        this.graphClient = microsoft_graph_client_1.Client.initWithMiddleware({ authProvider });
    }
    async getAuthUrl() {
        const authCodeUrlParameters = {
            scopes: ['User.Read', 'Mail.Read', 'Files.ReadWrite'],
            redirectUri: process.env.AZURE_REDIRECT_URI || 'http://localhost:5001/auth/callback',
        };
        try {
            return await this.msalClient.getAuthCodeUrl(authCodeUrlParameters);
        }
        catch (error) {
            console.error('Error generating auth URL:', error);
            throw new Error('Failed to generate authentication URL');
        }
    }
    async handleAuthCallback(code) {
        const tokenRequest = {
            code: code,
            scopes: ['User.Read', 'Mail.Read', 'Files.ReadWrite'],
            redirectUri: process.env.AZURE_REDIRECT_URI || 'http://localhost:5001/auth/callback',
        };
        try {
            const response = await this.msalClient.acquireTokenByCode(tokenRequest);
            if (!response || !response.accessToken) {
                throw new Error('Failed to acquire access token from callback');
            }
            // Get user info from Graph API
            const user = await this.graphClient.api('/me').get();
            return {
                accessToken: response.accessToken,
                user: {
                    id: user.id,
                    displayName: user.displayName,
                    email: user.mail || user.userPrincipalName,
                    jobTitle: user.jobTitle,
                    department: user.department,
                },
            };
        }
        catch (error) {
            console.error('Error handling auth callback:', error);
            throw new Error('Failed to process authentication callback');
        }
    }
    async getUserProfile(userId) {
        try {
            const user = await this.graphClient.api(`/users/${userId}`).get();
            return {
                id: user.id,
                displayName: user.displayName,
                email: user.mail || user.userPrincipalName,
                jobTitle: user.jobTitle,
                department: user.department,
                manager: user.manager ? await this.graphClient.api(`/users/${userId}/manager`).get() : null,
            };
        }
        catch (error) {
            console.error('Error fetching user profile:', error);
            throw new Error('Failed to fetch user profile');
        }
    }
    async searchUsers(query) {
        try {
            const users = await this.graphClient
                .api(`/users?$filter=(displayName ilike '%${query}%' or mail ilike '%${query}%')&$top=10`)
                .get();
            return users.value.map((user) => ({
                id: user.id,
                displayName: user.displayName,
                email: user.mail || user.userPrincipalName,
                jobTitle: user.jobTitle,
            }));
        }
        catch (error) {
            console.error('Error searching users:', error);
            throw new Error('Failed to search users');
        }
    }
    async getDirectReports(userId) {
        try {
            const reports = await this.graphClient.api(`/users/${userId}/directReports`).get();
            return reports.value;
        }
        catch (error) {
            console.error('Error fetching direct reports:', error);
            throw new Error('Failed to fetch direct reports');
        }
    }
    getMsalClient() {
        return this.msalClient;
    }
    getGraphClient() {
        return this.graphClient;
    }
}
exports.AuthService = AuthService;
exports.default = AuthService;
