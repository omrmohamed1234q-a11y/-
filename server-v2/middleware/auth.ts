import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'غير مصرح - missing token' });
        }

        const token = authHeader.substring(7);

        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'غير مصرح - invalid token' });
        }

        req.user = {
            id: user.id,
            email: user.email!,
            role: user.user_metadata?.role || 'customer',
        };

        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(500).json({ error: 'خطأ في المصادقة' });
    }
}

export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
    await requireAuth(req, res, () => {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'محظور - admins only' });
        }
        next();
    });
}

export async function requireDriver(req: AuthRequest, res: Response, next: NextFunction) {
    await requireAuth(req, res, () => {
        if (req.user?.role !== 'driver') {
            return res.status(403).json({ error: 'محظور - drivers only' });
        }
        next();
    });
}
