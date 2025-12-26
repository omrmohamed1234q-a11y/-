import { Router } from 'express';
import { supabase } from '../config/supabase';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

function generateOrderNumber() {
    return `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
}

router.post('/', requireAuth, async (req: AuthRequest, res) => {
    try {
        const {
            items,
            subtotal,
            deliveryFee,
            totalAmount,
            deliveryAddress,
            deliveryMethod,
            paymentMethod,
        } = req.body;

        const { data: order, error } = await supabase
            .from('orders')
            .insert({
                user_id: req.user!.id,
                order_number: generateOrderNumber(),
                items,
                subtotal: subtotal.toString(),
                delivery_fee: (deliveryFee || 0).toString(),
                total_amount: totalAmount.toString(),
                delivery_address: deliveryAddress,
                delivery_method: deliveryMethod || 'delivery',
                payment_method: paymentMethod || 'cash',
                payment_status: 'pending',
                status: 'new',
                status_text: 'طلب جديد',
            })
            .select()
            .single();

        if (error) throw error;

        await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', req.user!.id);

        res.json(order);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/', requireAuth, async (req: AuthRequest, res) => {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', req.user!.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', id)
            .eq('user_id', req.user!.id)
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error: any) {
        res.status(404).json({ error: 'الطلب غير موجود' });
    }
});

export default router;
