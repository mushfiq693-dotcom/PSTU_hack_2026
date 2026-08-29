"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const idempotency_1 = require("../middlewares/idempotency");
const transferController_1 = require("../controllers/transferController");
const requestController_1 = require("../controllers/requestController");
const ledgerController_1 = require("../controllers/ledgerController");
const userController_1 = require("../controllers/userController");
const stressController_1 = require("../controllers/stressController");
const connectionController_1 = require("../controllers/connectionController");
const notificationController_1 = require("../controllers/notificationController");
const splitController_1 = require("../controllers/splitController");
exports.apiRouter = (0, express_1.Router)();
// ==========================================
// User & Wallet Endpoints
// ==========================================
exports.apiRouter.get('/users', userController_1.UserController.listUsers);
exports.apiRouter.get('/wallets/me', auth_1.authMiddleware, userController_1.UserController.getMyWallet);
exports.apiRouter.post('/dev/reset', userController_1.UserController.resetDemo);
// ==========================================
// Transfer Endpoints (Idempotency Protected)
// ==========================================
exports.apiRouter.post('/transfers', auth_1.authMiddleware, idempotency_1.idempotencyMiddleware, transferController_1.TransferController.transfer);
exports.apiRouter.get('/transfers/history', auth_1.authMiddleware, transferController_1.TransferController.getHistory);
// ==========================================
// Money Request Endpoints (With Due Dates)
// ==========================================
exports.apiRouter.post('/requests', auth_1.authMiddleware, idempotency_1.idempotencyMiddleware, requestController_1.RequestController.create);
exports.apiRouter.get('/requests', auth_1.authMiddleware, requestController_1.RequestController.list);
exports.apiRouter.post('/requests/:id/accept', auth_1.authMiddleware, idempotency_1.idempotencyMiddleware, requestController_1.RequestController.accept);
exports.apiRouter.post('/requests/:id/reject', auth_1.authMiddleware, requestController_1.RequestController.reject);
exports.apiRouter.post('/requests/:id/cancel', auth_1.authMiddleware, requestController_1.RequestController.cancel);
// ==========================================
// Connections Endpoints (Friends & Family)
// ==========================================
exports.apiRouter.post('/connections', auth_1.authMiddleware, connectionController_1.ConnectionController.sendRequest);
exports.apiRouter.get('/connections', auth_1.authMiddleware, connectionController_1.ConnectionController.list);
exports.apiRouter.post('/connections/:id/accept', auth_1.authMiddleware, connectionController_1.ConnectionController.accept);
exports.apiRouter.post('/connections/:id/decline', auth_1.authMiddleware, connectionController_1.ConnectionController.decline);
// ==========================================
// In-App Notifications Endpoints
// ==========================================
exports.apiRouter.get('/notifications', auth_1.authMiddleware, notificationController_1.NotificationController.list);
exports.apiRouter.post('/notifications/:id/read', auth_1.authMiddleware, notificationController_1.NotificationController.markRead);
exports.apiRouter.post('/notifications/read-all', auth_1.authMiddleware, notificationController_1.NotificationController.markAllRead);
// ==========================================
// Bill Split Endpoints (Single Engine + Category)
// ==========================================
exports.apiRouter.post('/splits', auth_1.authMiddleware, idempotency_1.idempotencyMiddleware, splitController_1.SplitController.create);
exports.apiRouter.get('/splits', auth_1.authMiddleware, splitController_1.SplitController.list);
exports.apiRouter.post('/splits/:id/pay', auth_1.authMiddleware, idempotency_1.idempotencyMiddleware, splitController_1.SplitController.payShare);
// ==========================================
// Ledger & Audit Endpoints
// ==========================================
exports.apiRouter.get('/ledger/entries', ledgerController_1.LedgerController.getEntries);
exports.apiRouter.get('/ledger/audit', ledgerController_1.LedgerController.audit);
// ==========================================
// Concurrency & Stress Testing Engine
// ==========================================
exports.apiRouter.post('/stress/run', stressController_1.StressController.runStressTest);
exports.default = exports.apiRouter;
