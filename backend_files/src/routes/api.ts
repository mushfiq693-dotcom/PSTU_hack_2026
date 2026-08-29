import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { idempotencyMiddleware } from '../middlewares/idempotency';
import { AuthController } from '../controllers/authController';
import { TransferController } from '../controllers/transferController';
import { RequestController } from '../controllers/requestController';
import { LedgerController } from '../controllers/ledgerController';
import { UserController } from '../controllers/userController';
import { StressController } from '../controllers/stressController';
import { ConnectionController } from '../controllers/connectionController';
import { NotificationController } from '../controllers/notificationController';
import { SplitController } from '../controllers/splitController';

export const apiRouter = Router();

// ==========================================
// Authentication & Phone Verification Endpoints
// ==========================================
apiRouter.post('/auth/register', AuthController.register);
apiRouter.post('/auth/verify-otp', AuthController.verifyOtp);
apiRouter.post('/auth/resend-otp', AuthController.resendOtp);
apiRouter.post('/auth/login', AuthController.login);
apiRouter.post('/auth/logout', AuthController.logout);
apiRouter.get('/auth/me', authMiddleware, AuthController.me);

// ==========================================
// User & Wallet Endpoints
// ==========================================
apiRouter.get('/users', UserController.listUsers);
apiRouter.get('/wallets/me', authMiddleware, UserController.getMyWallet);
apiRouter.post('/dev/reset', UserController.resetDemo);

// ==========================================
// Transfer Endpoints (Idempotency Protected)
// ==========================================
apiRouter.post('/transfers', authMiddleware, idempotencyMiddleware, TransferController.transfer);
apiRouter.get('/transfers/history', authMiddleware, TransferController.getHistory);

// ==========================================
// Money Request Endpoints (With Due Dates)
// ==========================================
apiRouter.post('/requests', authMiddleware, idempotencyMiddleware, RequestController.create);
apiRouter.get('/requests', authMiddleware, RequestController.list);
apiRouter.post('/requests/:id/accept', authMiddleware, idempotencyMiddleware, RequestController.accept);
apiRouter.post('/requests/:id/reject', authMiddleware, RequestController.reject);
apiRouter.post('/requests/:id/cancel', authMiddleware, RequestController.cancel);

// ==========================================
// Connections Endpoints (Friends & Family)
// ==========================================
apiRouter.post('/connections', authMiddleware, ConnectionController.sendRequest);
apiRouter.get('/connections', authMiddleware, ConnectionController.list);
apiRouter.post('/connections/:id/accept', authMiddleware, ConnectionController.accept);
apiRouter.post('/connections/:id/decline', authMiddleware, ConnectionController.decline);

// ==========================================
// In-App Notifications Endpoints
// ==========================================
apiRouter.get('/notifications', authMiddleware, NotificationController.list);
apiRouter.post('/notifications/:id/read', authMiddleware, NotificationController.markRead);
apiRouter.post('/notifications/read-all', authMiddleware, NotificationController.markAllRead);

// ==========================================
// Bill Split Endpoints (Single Engine + Category)
// ==========================================
apiRouter.post('/splits', authMiddleware, idempotencyMiddleware, SplitController.create);
apiRouter.get('/splits', authMiddleware, SplitController.list);
apiRouter.post('/splits/:id/pay', authMiddleware, idempotencyMiddleware, SplitController.payShare);

// ==========================================
// Ledger & Audit Endpoints
// ==========================================
apiRouter.get('/ledger/entries', LedgerController.getEntries);
apiRouter.get('/ledger/audit', LedgerController.audit);

// ==========================================
// Concurrency & Stress Testing Engine
// ==========================================
apiRouter.post('/stress/run', StressController.runStressTest);

export default apiRouter;
