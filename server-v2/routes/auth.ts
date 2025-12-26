import { Router } from 'express';
import { supabase } from '../config/supabase';
import { z } from 'zod';

const router = Router();

const signupSchema = z.object({
    email: z.string().email('بريد إلكتروني غير صحيح'),
    password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
    fullName: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
    phone: z.string().optional(),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

router.post('/signup', async (req, res) => {
    try {
        const { email, password, fullName, phone } = signupSchema.parse(req.body);

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    phone,
                    role: 'customer',
                },
            },
        });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        const { data: userData, error: insertError } = await supabase
            .from('users')
            .insert({
                id: data.user!.id,
                email,
                full_name: fullName,
                phone,
                username: email.split('@')[0],
                role: 'customer',
            })
            .select()
            .single();

        if (insertError) {
            console.error('Failed to create user record:', insertError);
        }

        res.json({
            user: data.user,
            session: data.session,
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = loginSchema.parse(req.body);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return res.status(401).json({ error: 'بريد إلكتروني أو كلمة مرور خاطئة' });
        }

        res.json({
            user: data.user,
            session: data.session,
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/logout', async (req, res) => {
    const { error } = await supabase.auth.signOut();

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'تم تسجيل الخروج بنجاح' });
});

export default router;
