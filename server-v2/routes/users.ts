import { Router } from 'express';
import { supabase } from '../config/supabase';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/me', requireAuth, async (req: AuthRequest, res) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', req.user!.id)
            .single();

        if (error) throw error;

        res.json(user);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/me', requireAuth, async (req: AuthRequest, res) => {
    try {
        const { full_name, phone, grade_level } = req.body;

        const { data, error } = await supabase
            .from('users')
            .update({
                full_name,
                phone,
                grade_level,
                updated_at: new Date().toISOString(),
            })
            .eq('id', req.user!.id)
            .select()
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
