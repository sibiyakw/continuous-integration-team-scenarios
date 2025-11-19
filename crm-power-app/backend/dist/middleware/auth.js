"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAnyRole = exports.requireAgent = exports.requireAdmin = exports.authorizeRoles = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Access token required'
        });
    }
    jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'fallback-secret', (err, decoded) => {
        if (err) {
            return res.status(403).json({
                success: false,
                error: 'Invalid or expired token'
            });
        }
        req.user = decoded;
        next();
    });
};
exports.authenticateToken = authenticateToken;
const authorizeRoles = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: 'Insufficient permissions'
            });
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
exports.requireAdmin = (0, exports.authorizeRoles)(['Admin']);
exports.requireAgent = (0, exports.authorizeRoles)(['Admin', 'Agent']);
exports.requireAnyRole = (0, exports.authorizeRoles)(['Admin', 'Agent', 'Customer']);
exports.default = { authenticateToken: exports.authenticateToken, authorizeRoles: exports.authorizeRoles, requireAdmin: exports.requireAdmin, requireAgent: exports.requireAgent, requireAnyRole: exports.requireAnyRole };
