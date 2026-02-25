'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Validates if the current authenticated user is a super admin.
 * @returns boolean indication of admin status.
 */
export async function isAdmin(): Promise<boolean> {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (cookiesToSet) => {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options);
                        });
                    } catch (error) {
                        // The `set` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing user sessions.
                    }
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return false;

    // Use service role to bypass RLS for admin check
    const adminSupabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: () => { }
            }
        }
    );

    const { data: profile } = await adminSupabase
        .from('users')
        .select('is_super_admin')
        .eq('auth_user_id', user.id)
        .single();

    return profile?.is_super_admin === true;
}

/**
 * Logs an administrative action to the database.
 */
export async function logAdminAction(action: string, entity_type: string, entity_id?: string, details?: any) {
    const cookieStore = await cookies();
    // We use service role key for admin actions to bypass any possible RLS restrictions on inserting an audit log,
    // but ONLY after validating the user is an admin
    const isUserAdmin = await isAdmin();

    if (!isUserAdmin) {
        console.error('Unauthorized attempt to log admin action');
        return false;
    }

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Use anon key for getting the user, then admin client for logging
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (cookiesToSet) => {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options);
                        });
                    } catch (error) { }
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: publicUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

    if (!publicUser) return false;

    // Use admin client to insert the log securely
    const adminClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                getAll: () => [],
                setAll: () => { },
            },
        }
    );

    const { error } = await adminClient.from('admin_actions').insert({
        admin_id: publicUser.id,
        action_type: action,
        target_user_id: entity_type === 'users' ? entity_id : null,
        target_task_id: entity_type === 'tasks' ? entity_id : null,
        details: { entity_type, entity_id, ...details },
    });

    if (error) {
        console.error('Failed to log admin action:', error);
        return false;
    }

    return true;
}

/**
 * Approve a tasker's verification request.
 */
export async function approveVerification(verificationId: string, userId: string) {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) return { success: false, message: 'Unauthorized' };

    const cookieStore = await cookies();
    const adminClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: () => { },
            },
        }
    );

    // 1. Update the verification status and get the type
    const { data: verif, error: verifyError } = await adminClient
        .from('verifications')
        .update({ status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('id', verificationId)
        .select('verification_type')
        .single();

    if (verifyError) return { success: false, message: 'Failed to update verification record' };

    // 2. Log the action
    await logAdminAction('APPROVED_VERIFICATION', 'verifications', verificationId, { user_id: userId });

    return { success: true, message: 'Document approved successfully' };
}

/**
 * Explicitly approve a seller account (grants is_verified = true)
 */
export async function approveSellerVerification(userId: string) {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) return { success: false, message: 'Unauthorized' };

    const cookieStore = await cookies();
    const adminClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: () => { },
            },
        }
    );

    // Lock the account open (is_verified = true)
    const { error: userError } = await adminClient
        .from('users')
        .update({ is_verified: true })
        .eq('id', userId);

    if (userError) {
        console.error("Failed to unlock user account:", userError);
        return { success: false, message: 'Failed to fully verify user account' };
    }

    // Log the action
    await logAdminAction('APPROVED_SELLER_ACCOUNT', 'users', userId, {});

    // Notify the user of FULL verification
    await adminClient.from('notifications').insert({
        user_id: userId,
        notification_type: 'system',
        title: 'Account Fully Verified!',
        message: 'All your documents have been reviewed and your account is now fully verified. You can now place bids and create gigs!',
        data: {}
    });

    return { success: true, message: 'Seller account fully verified!' };
}

/**
 * Reject a tasker's verification request.
 */
export async function rejectVerification(verificationId: string, userId: string, reason: string) {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) return { success: false, message: 'Unauthorized' };

    const cookieStore = await cookies();
    const adminClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: () => { },
            },
        }
    );

    // 1. Update the verification status and get type
    const { data: verif, error: verifyError } = await adminClient
        .from('verifications')
        .update({
            status: 'rejected',
            reviewed_at: new Date().toISOString(),
            admin_notes: reason
        })
        .eq('id', verificationId)
        .select('verification_type')
        .single();

    if (verifyError) return { success: false, message: 'Failed to update verification record' };

    // 2. Log the action
    await logAdminAction('REJECTED_VERIFICATION', 'verifications', verificationId, { user_id: userId, reason });

    // 3. Format document name
    const docNameMap: Record<string, string> = {
        'nic_front': 'NIC (Front)',
        'nic_back': 'NIC (Back)',
        'address_proof': 'Proof of Address',
        'police_report': 'Police Clearance Report'
    };
    const docName = verif?.verification_type ? (docNameMap[verif.verification_type] || 'Document') : 'Document';

    // 4. Notify the user
    await adminClient.from('notifications').insert({
        user_id: userId,
        notification_type: 'verification',
        title: `${docName} Rejected`,
        message: `Your submitted ${docName} was rejected. Reason: ${reason}. Please correct this and re-submit.`,
        data: { verification_id: verificationId, type: 'document_rejected' }
    });

    return { success: true, message: 'Document rejected successfully' };
}

/**
 * Suspend a user account
 */
export async function suspendUser(userId: string, reason: string) {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) return { success: false, message: 'Unauthorized' };

    const cookieStore = await cookies();
    const adminClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: { getAll: () => cookieStore.getAll(), setAll: () => { } }
        }
    );

    const { error } = await adminClient
        .from('users')
        .update({ status: 'suspended' })
        .eq('id', userId);

    if (error) return { success: false, message: 'Failed to suspend user' };

    await logAdminAction('SUSPENDED_USER', 'users', userId, { reason });

    return { success: true, message: 'User suspended successfully' };
}

/**
 * Reactivate a user account
 */
export async function activateUser(userId: string) {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) return { success: false, message: 'Unauthorized' };

    const cookieStore = await cookies();
    const adminClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: { getAll: () => cookieStore.getAll(), setAll: () => { } }
        }
    );

    const { error } = await adminClient
        .from('users')
        .update({ status: 'active' })
        .eq('id', userId);

    if (error) return { success: false, message: 'Failed to activate user' };

    await logAdminAction('ACTIVATED_USER', 'users', userId, {});

    return { success: true, message: 'User activated successfully' };
}

/**
 * Permanently forcefully delete a task (Admin bypass)
 */
export async function deleteTaskAdmin(taskId: string, reason: string) {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) return { success: false, message: 'Unauthorized' };

    const cookieStore = await cookies();
    const adminClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: { getAll: () => cookieStore.getAll(), setAll: () => { } }
        }
    );

    // Get task owner to notify them
    const { data: task } = await adminClient.from('tasks').select('customer_id, title').eq('id', taskId).single();

    const { error } = await adminClient
        .from('tasks')
        .delete()
        .eq('id', taskId);

    if (error) return { success: false, message: 'Failed to delete task' };

    await logAdminAction('DELETED_TASK', 'tasks', taskId, { reason, title: task?.title });

    if (task?.customer_id) {
        await adminClient.from('notifications').insert({
            user_id: task.customer_id,
            notification_type: 'system',
            title: 'Task Removed by Admin',
            message: `Your task "${task.title}" was removed by a platform administrator. Reason: ${reason}.`,
            data: { task_id: taskId }
        });
    }

    return { success: true, message: 'Task deleted successfully' };
}

/**
 * Permanently delete a gig package (Admin bypass)
 */
export async function deleteGigAdmin(gigId: string, reason: string) {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) return { success: false, message: 'Unauthorized' };

    const cookieStore = await cookies();
    const adminClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: { getAll: () => cookieStore.getAll(), setAll: () => { } }
        }
    );

    const { data: gig } = await adminClient.from('gigs').select('seller_id, title').eq('id', gigId).single();

    const { error } = await adminClient
        .from('gigs')
        .delete()
        .eq('id', gigId);

    if (error) return { success: false, message: 'Failed to delete gig' };

    await logAdminAction('DELETED_GIG', 'gigs', gigId, { reason, title: gig?.title });

    if (gig?.seller_id) {
        await adminClient.from('notifications').insert({
            user_id: gig.seller_id,
            notification_type: 'system',
            title: 'Gig Removed by Admin',
            message: `Your gig "${gig.title}" was removed by a platform administrator. Reason: ${reason}.`,
            data: { gig_id: gigId }
        });
    }

    return { success: true, message: 'Gig deleted successfully' };
}

/**
 * Force cancel an active order (Admin bypass)
 */
export async function cancelOrderAdmin(orderId: string, reason: string) {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) return { success: false, message: 'Unauthorized' };

    const cookieStore = await cookies();
    const adminClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: { getAll: () => cookieStore.getAll(), setAll: () => { } }
        }
    );

    const { data: order } = await adminClient.from('orders')
        .select('customer_id, seller_id, order_number')
        .eq('id', orderId)
        .single();

    if (!order) return { success: false, message: 'Order not found' };

    const { error } = await adminClient
        .from('orders')
        .update({
            status: 'cancelled',
            cancellation_reason: `Admin Cancelled: ${reason}`,
            cancelled_at: new Date().toISOString()
        })
        .eq('id', orderId);

    if (error) return { success: false, message: 'Failed to cancel order' };

    await logAdminAction('CANCELLED_ORDER', 'orders', orderId, { reason, order_number: order.order_number });

    // Notify both parties
    if (order.customer_id) {
        await adminClient.from('notifications').insert({
            user_id: order.customer_id,
            notification_type: 'system',
            title: 'Order Cancelled by Admin',
            message: `Order #${order.order_number} was cancelled by a platform administrator. Reason: ${reason}.`,
            data: { order_id: orderId }
        });
    }
    if (order.seller_id) {
        await adminClient.from('notifications').insert({
            user_id: order.seller_id,
            notification_type: 'system',
            title: 'Order Cancelled by Admin',
            message: `Order #${order.order_number} to your client was cancelled by a platform administrator. Reason: ${reason}.`,
            data: { order_id: orderId }
        });
    }

    return { success: true, message: 'Order cancelled successfully' };
}

/**
 * Refund an escrow transaction to the buyer
 */
export async function refundEscrowAdmin(transactionId: string, reason: string) {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) return { success: false, message: 'Unauthorized' };

    const cookieStore = await cookies();
    const adminClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: { getAll: () => cookieStore.getAll(), setAll: () => { } }
        }
    );

    const { data: tx } = await adminClient.from('transactions')
        .select('payer_id, payee_id, amount, status')
        .eq('id', transactionId)
        .single();

    if (!tx) return { success: false, message: 'Transaction not found' };
    if (tx.status !== 'held_in_escrow') return { success: false, message: 'Only escrowed funds can be refunded' };

    const { error } = await adminClient
        .from('transactions')
        .update({
            status: 'refunded',
            refunded_at: new Date().toISOString()
        })
        .eq('id', transactionId);

    if (error) return { success: false, message: 'Failed to refund escrow' };

    await logAdminAction('REFUNDED_ESCROW', 'transactions', transactionId, { reason, amount: tx.amount });

    // Notify payer
    if (tx.payer_id) {
        await adminClient.from('notifications').insert({
            user_id: tx.payer_id,
            notification_type: 'payout',
            title: 'Escrow Refunded',
            message: `An amount of LKR ${tx.amount} has been refunded to you by an administrator. Reason: ${reason}.`,
            data: { transaction_id: transactionId }
        });
    }

    return { success: true, message: 'Escrow refunded successfully' };
}

/**
 * Permanently delete an abusive or falsified review
 */
export async function deleteReviewAdmin(reviewId: string, reason: string) {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) return { success: false, message: 'Unauthorized' };

    const cookieStore = await cookies();
    const adminClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: { getAll: () => cookieStore.getAll(), setAll: () => { } }
        }
    );

    const { error } = await adminClient
        .from('reviews')
        .delete()
        .eq('id', reviewId);

    if (error) return { success: false, message: 'Failed to delete review' };

    await logAdminAction('DELETED_REVIEW', 'reviews', reviewId, { reason });

    return { success: true, message: 'Review deleted successfully' };
}

/**
 * Toggle popular status of a category
 */
export async function toggleCategoryPopularAdmin(categoryId: string, isPopular: boolean) {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) return { success: false, message: 'Unauthorized' };

    const cookieStore = await cookies();
    const adminClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: { getAll: () => cookieStore.getAll(), setAll: () => { } }
        }
    );

    const { error } = await adminClient
        .from('categories')
        .update({ popular: isPopular })
        .eq('id', categoryId);

    if (error) return { success: false, message: 'Failed to update category status' };

    await logAdminAction('UPDATED_CATEGORY', 'categories', categoryId, { popular: isPopular });

    return { success: true, message: 'Category status updated' };
}
