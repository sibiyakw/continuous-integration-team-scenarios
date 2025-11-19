"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authService_1 = __importDefault(require("../services/authService"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const authService = new authService_1.default();
// Generate JWT token for authenticated user
const generateToken = (user, role = 'Customer') => {
    const payload = {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        role: role
    };
    const secret = process.env.JWT_SECRET || 'fallback-secret';
    return jsonwebtoken_1.default.sign(payload, secret, { expiresIn: '24h' });
};
// Get Microsoft OAuth URL
router.get('/microsoft/url', async (req, res) => {
    try {
        const authUrl = await authService.getAuthUrl();
        res.json({
            success: true,
            data: {
                authUrl,
                redirectUri: process.env.AZURE_REDIRECT_URI || 'http://localhost:5001/auth/callback'
            }
        });
    }
    catch (error) {
        console.error('Error generating auth URL:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate authentication URL'
        });
    }
});
// Handle OAuth callback
router.post('/microsoft/callback', async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) {
            return res.status(400).json({
                success: false,
                error: 'Authorization code is required'
            });
        }
        const authResult = await authService.handleAuthCallback(code);
        // Determine user role based on email domain or other logic
        let userRole = 'Customer';
        const emailDomain = authResult.user.email.split('@')[1];
        if (emailDomain === process.env.COMPANY_DOMAIN) {
            userRole = 'Agent';
            if (authResult.user.jobTitle?.includes('Manager') || authResult.user.jobTitle?.includes('Admin')) {
                userRole = 'Admin';
            }
        }
        const token = generateToken(authResult.user, userRole);
        res.json({
            success: true,
            data: {
                token,
                user: {
                    ...authResult.user,
                    role: userRole
                }
            }
        });
    }
    catch (error) {
        console.error('Error handling OAuth callback:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process authentication'
        });
    }
});
// Get current user profile
router.get('/profile', auth_1.authenticateToken, async (req, res) => {
    try {
        const userProfile = await authService.getUserProfile(req.user.id);
        res.json({
            success: true,
            data: userProfile
        });
    }
    catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user profile'
        });
    }
});
// Search users (for agent assignment)
router.get('/search', auth_1.authenticateToken, async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || typeof q !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Search query is required'
            });
        }
        const users = await authService.searchUsers(q);
        res.json({
            success: true,
            data: users
        });
    }
    catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to search users'
        });
    }
});
// Refresh token
router.post('/refresh', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'Refresh token is required'
            });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        const userProfile = await authService.getUserProfile(decoded.id);
        // Re-determine role in case it changed
        let userRole = 'Customer';
        const emailDomain = userProfile.email.split('@')[1];
        if (emailDomain === process.env.COMPANY_DOMAIN) {
            userRole = 'Agent';
            if (userProfile.jobTitle?.includes('Manager') || userProfile.jobTitle?.includes('Admin')) {
                userRole = 'Admin';
            }
        }
        const newToken = generateToken({
            id: userProfile.id,
            displayName: userProfile.displayName,
            email: userProfile.email
        }, userRole);
        res.json({
            success: true,
            data: {
                token: newToken,
                user: {
                    id: userProfile.id,
                    displayName: userProfile.displayName,
                    email: userProfile.email,
                    role: userRole
                }
            }
        });
    }
    catch (error) {
        console.error('Error refreshing token:', error);
        res.status(401).json({
            success: false,
            error: 'Invalid refresh token'
        });
    }
});
// Logout
router.post('/logout', auth_1.authenticateToken, (req, res) => {
    // In a production environment, you might want to blacklist the token
    // For now, we just return success since JWT is stateless
    res.json({
        success: true,
        message: 'Successfully logged out'
    });
});
exports.default = router;
