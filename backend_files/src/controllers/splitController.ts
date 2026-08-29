import { Request, Response, NextFunction } from 'express';
import { SplitService } from '../services/splitService';
import { BillCategory } from '../types';

export class SplitController {
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { title, total_amount_bdt, category, participants } = req.body;

      if (!title) {
        res.status(400).json({ success: false, message: 'Bill title is required.' });
        return;
      }

      if (!total_amount_bdt || total_amount_bdt <= 0) {
        res.status(400).json({ success: false, message: 'Valid total amount is required.' });
        return;
      }

      const totalAmountPoisha = Math.round(Number(total_amount_bdt) * 100);

      const split = await SplitService.createSplit({
        creatorId: userId,
        title,
        totalAmountPoisha,
        category: (category as BillCategory) || 'RESTAURANT',
        participants: (participants || []).map((p: any) => ({
          userId: p.user_id,
          phone: p.phone,
          shareAmountPoisha: Math.round(Number(p.share_amount_bdt || p.share_amount_poisha / 100) * 100)
        }))
      });

      res.status(201).json({
        success: true,
        message: 'Bill split created successfully.',
        data: split
      });
    } catch (err) {
      next(err);
    }
  }

  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const category = req.query.category as BillCategory | undefined;

      const splits = await SplitService.listSplits(userId, category);

      res.status(200).json({
        success: true,
        data: splits
      });
    } catch (err) {
      next(err);
    }
  }

  public static async payShare(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const idempotencyKey = (req as any).idempotencyKey;

      const result = await SplitService.paySplitShare(id, userId, idempotencyKey);

      res.status(200).json({
        success: true,
        message: 'Split share paid successfully.',
        data: result.split,
        transaction: result.transfer.transaction
      });
    } catch (err) {
      next(err);
    }
  }
}
