"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const api_1 = require("./routes/api");
exports.app = (0, express_1.default)();
// Middlewares
exports.app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id', 'Idempotency-Key', 'X-Idempotency-Key']
}));
exports.app.use(express_1.default.json());
// Health Check
exports.app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'UP',
        service: 'NexusPay Engine',
        timestamp: new Date().toISOString()
    });
});
// Mount Central API Router
exports.app.use('/api', api_1.apiRouter);
// 404 Fallback Handler
exports.app.use((req, res) => {
    res.status(404).json({
        success: false,
        error_code: 'ENDPOINT_NOT_FOUND',
        message: `API endpoint '${req.method} ${req.originalUrl}' does not exist.`
    });
});
// Global Error Handler
exports.app.use((err, req, res, next) => {
    console.error('Unhandled Application Error:', err);
    res.status(err.statusCode || 500).json({
        success: false,
        error_code: err.errorCode || 'INTERNAL_SERVER_ERROR',
        message: err.message || 'An unexpected internal server error occurred.'
    });
});
exports.default = exports.app;
