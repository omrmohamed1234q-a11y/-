import { Router } from 'express';
import { supabase } from '../config/supabase';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res) => {
    try {
        const { data, error } = await supabase
            .from('cart_items')
            .select('*, products(*)')
            .eq('user_id', req.user!.id);

        if (error) throw error;

        const subtotal = data.reduce((sum, item) => {
            return sum + (parseFloat(item.price) * item.quantity);
        }, 0);

        res.json({
            items: data,
            subtotal,
            totalQuantity: data.reduce((sum, item) => sum + item.quantity, 0),
            currency: 'جنيه',
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/add', requireAuth, async (req: AuthRequest, res) => {
    try {
        const { productId, quantity, variant, price } = req.body;

        const { data, error } = await supabase
            .from('cart_items')
            .insert({
                user_id: req.user!.id,
                product_id: productId,
                quantity: quantity || 1,
                price: price || '10.00',
                variant,
            })
            .select()
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;

        const { data, error } = await supabase
            .from('cart_items')
            .update({ quantity })
            .eq('id', id)
            .eq('user_id', req.user!.id)
            .select()
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('cart_items')
            .delete()
            .eq('id', id)
            .eq('user_id', req.user!.id);

        if (error) throw error;

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/', requireAuth, async (req: AuthRequest, res) => {
    try {
        const { error } = await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', req.user!.id);

        if (error) throw error;

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
