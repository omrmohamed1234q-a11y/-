import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
    console.error('❌ Error:', err);

    if (err.code === 'PGRST116') {
        return res.status(404).json({ error: 'البيانات غير موجودة' });
    }

    if (err.code === '23505') {
        return res.status(409).json({ error: 'البيانات موجودة بالفعل' });
    }

    const statusCode = err.statusCode || 500;
    const message = err.message || 'حدث خطأ في الخادم';

    res.status(statusCode).json({
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
}

export function notFound(req: Request, res: Response) {
    res.status(404).json({ error: 'المسار غير موجود' });
}
