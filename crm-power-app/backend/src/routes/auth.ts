import express from 'express';
import jwt from 'jsonwebtoken';
import AuthService from '../services/authService';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();
const authService = new AuthService();

// Generate JWT token for authenticated user
const generateToken = (user: any, role: string = 'Customer') => {
  const payload = {
    id: user.id,
    displayName: user.displayName,
    email: user.email,
    role: role
  };

  const secret = process.env.JWT_SECRET || 'fallback-secret';
  return jwt.sign(payload, secret, { expiresIn: '24h' });
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
  } catch (error) {
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
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process authentication'
    });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userProfile = await authService.getUserProfile(req.user!.id);
    res.json({
      success: true,
      data: userProfile
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile'
    });
  }
});

// Search users (for agent assignment)
router.get('/search', authenticateToken, async (req: AuthenticatedRequest, res) => {
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
  } catch (error) {
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
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
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid refresh token'
    });
  }
});

// Logout
router.post('/logout', authenticateToken, (req: AuthenticatedRequest, res) => {
  // In a production environment, you might want to blacklist the token
  // For now, we just return success since JWT is stateless
  res.json({
    success: true,
    message: 'Successfully logged out'
  });
});

export default router;