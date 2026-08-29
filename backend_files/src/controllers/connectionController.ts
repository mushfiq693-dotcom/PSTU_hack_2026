import { Request, Response, NextFunction } from 'express';
import { ConnectionService } from '../services/connectionService';
import { RelationType } from '../types';

export class ConnectionController {
  public static async sendRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { connected_user_id, relation_type } = req.body;

      if (!connected_user_id) {
        res.status(400).json({ success: false, message: 'Target user ID is required.' });
        return;
      }

      const connection = await ConnectionService.sendRequest(
        userId,
        connected_user_id,
        (relation_type as RelationType) || 'FRIEND'
      );

      res.status(201).json({
        success: true,
        message: 'Connection added successfully.',
        data: connection
      });
    } catch (err) {
      next(err);
    }
  }

  public static async accept(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const connection = await ConnectionService.acceptRequest(id, userId);

      res.status(200).json({
        success: true,
        message: 'Connection request accepted.',
        data: connection
      });
    } catch (err) {
      next(err);
    }
  }

  public static async decline(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const connection = await ConnectionService.declineRequest(id, userId);

      res.status(200).json({
        success: true,
        message: 'Connection declined.',
        data: connection
      });
    } catch (err) {
      next(err);
    }
  }

  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const relationType = req.query.relation_type as RelationType | undefined;

      const connections = await ConnectionService.listConnections(userId, relationType);

      res.status(200).json({
        success: true,
        data: connections
      });
    } catch (err) {
      next(err);
    }
  }
}
