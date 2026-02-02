'use server';

import { supabaseServer } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const createProfileSchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
    location: z.string().min(1),
    userType: z.enum(['customer', 'tasker', 'admin']),
    password: z.string().optional(), // We don't save this, just validation if needed, but here we receive profile data
    bio: z.string().optional(), // Added
    skills: z.union([z.string(), z.array(z.string())]).optional(), // Added
});

export async function createProfile(authUserId: string, formData: any) {
    // 1. Validate data
    const validated = createProfileSchema.safeParse(formData);

    if (!validated.success) {
        return { success: false, error: 'Validation failed' };
    }

    const {
        firstName,
        lastName,
        email,
        phone,
        location,
        userType,
        bio,
        skills
    } = validated.data;

    // Normalize skills
    const skillList = Array.isArray(skills)
        ? skills
        : (typeof skills === 'string' ? skills.split(',').map(s => s.trim()).filter(Boolean) : []);

    // 2. Insert into public.users
    // We explicitly set auth_user_id to link with Supabase Auth.
    // We verify if this authUserId already exists to prevent duplicates.

    // Check for existing profile
    const { data: existing } = await supabaseServer
        .from('users')
        .select('id')
        .eq('auth_user_id', authUserId)
        .single();

    if (existing) {
        return { success: true, message: 'Profile already exists' };
    }

    const { data: newUser, error: insertError } = await supabaseServer
        .from('users')
        .insert({
            auth_user_id: authUserId,
            first_name: firstName,
            last_name: lastName,
            email: email,
            phone: phone,
            location: location,
            user_type: userType,
            password_hash: 'SUPABASE_AUTH_MANAGED', // Dummy value as column is NOT NULL
            status: 'active',
            is_verified: false
        })
        .select('id')
        .single();

    if (insertError || !newUser) {
        console.error('Error createProfile:', insertError);
        return { success: false, error: insertError?.message || 'Failed to create profile' };
    }

    const publicUserId = newUser.id;

    // 3. Create role-specific records using the PUBLIC USER ID
    // Always create customer record
    const { error: customerError } = await supabaseServer
        .from('customers')
        .insert({
            user_id: publicUserId,
            address_line1: location
        });

    if (customerError) {
        console.error('Error creating customer record:', customerError);
        // Clean up user? Or just return error?
        return { success: false, error: 'Failed to create customer record' };
    }

    if (userType === 'tasker') {
        const { error: taskerError } = await supabaseServer
            .from('taskers')
            .insert({
                user_id: publicUserId,
                bio: bio || '',
                skills: skillList,
                level_code: 'starter_pro'
            });

        if (taskerError) {
            console.error('Error creating tasker record:', taskerError);
            return { success: false, error: 'Failed to create tasker record' };
        }
    }

    return { success: true };
}
