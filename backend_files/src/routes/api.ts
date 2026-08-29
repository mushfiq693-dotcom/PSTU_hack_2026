import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { idempotencyMiddleware } from '../middlewares/idempotency';
import { TransferController } from '../controllers/transferController';
import { RequestController } from '../controllers/requestController';
import { LedgerController } from '../controllers/ledgerController';
import { UserController } from '../controllers/userController';
import { StressController } from '../controllers/stressController';

export const apiRouter = Router();

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
// Money Request Endpoints
// ==========================================
apiRouter.post('/requests', authMiddleware, idempotencyMiddleware, RequestController.create);
apiRouter.get('/requests', authMiddleware, RequestController.list);
apiRouter.post('/requests/:id/accept', authMiddleware, idempotencyMiddleware, RequestController.accept);
apiRouter.post('/requests/:id/reject', authMiddleware, RequestController.reject);
apiRouter.post('/requests/:id/cancel', authMiddleware, RequestController.cancel);

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
