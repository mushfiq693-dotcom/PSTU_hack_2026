"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const userService_1 = require("../services/userService");
class UserController {
    /**
     * GET /api/users
     * List all seeded demo accounts for user switcher from PostgreSQL
     */
    static async listUsers(req, res, next) {
        try {
            const users = await userService_1.UserService.getAllUsers();
            res.status(200).json({
                success: true,
                data: users
            });
        }
        catch (err) {
            res.status(500).json({
                success: false,
                error_code: 'USER_FETCH_ERROR',
                message: err.message
            });
        }
    }
    /**
     * GET /api/wallets/me
     * Get active user's wallet profile and balance from PostgreSQL
     */
    static async getMyWallet(req, res, next) {
        try {
            const userId = req.user.id;
            const profile = await userService_1.UserService.getUserById(userId);
            if (!profile) {
                res.status(404).json({
                    success: false,
                    error_code: 'USER_NOT_FOUND',
                    message: 'User profile not found.'
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: profile
            });
        }
        catch (err) {
            res.status(500).json({
                success: false,
                error_code: 'WALLET_FETCH_ERROR',
                message: err.message
            });
        }
    }
    /**
     * POST /api/dev/reset
     * Reset database back to initial seed data
     */
    static async resetDemo(req, res, next) {
        try {
            await userService_1.UserService.resetDemo();
            res.status(200).json({
                success: true,
                message: 'Demo dataset reset to initial state with ৳100,000 per user in PostgreSQL.'
            });
        }
        catch (err) {
            res.status(500).json({
                success: false,
                error_code: 'RESET_FAILED',
                message: err.message
            });
        }
    }
}
exports.UserController = UserController;
