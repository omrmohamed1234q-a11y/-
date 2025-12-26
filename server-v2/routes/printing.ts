import { Router } from 'express';
import { supabase } from '../config/supabase';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { calculateSharedPrice } from '../../shared/pricing';

const router = Router();

router.post('/calculate-price', async (req, res) => {
    try {
        const { pages, copies, colorMode, paperSize, doubleSided } = req.body;

        const totalPrice = calculateSharedPrice({
            pages,
            copies: copies || 1,
            colorMode,
            paperSize: paperSize || 'A4',
            doubleSided: doubleSided || false,
        });

        res.json({ totalPrice, currency: 'جنيه' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/jobs', requireAuth, async (req: AuthRequest, res) => {
    try {
        const {
            filename,
            fileUrl,
            pages,
            copies,
            colorMode,
            paperSize,
            doubleSided,
        } = req.body;

        const cost = calculateSharedPrice({
            pages,
            copies: copies || 1,
            colorMode,
            paperSize: paperSize || 'A4',
            doubleSided: doubleSided || false,
        });

        const { data, error } = await supabase
            .from('print_jobs')
            .insert({
                user_id: req.user!.id,
                filename,
                file_url: fileUrl,
                pages,
                copies: copies || 1,
                color_mode: colorMode,
                paper_size: paperSize || 'A4',
                double_sided: doubleSided || false,
                status: 'pending',
                cost: cost.toString(),
            })
            .select()
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/jobs', requireAuth, async (req: AuthRequest, res) => {
    try {
        const { data, error } = await supabase
            .from('print_jobs')
            .select('*')
            .eq('user_id', req.user!.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
