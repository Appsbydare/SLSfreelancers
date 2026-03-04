-- ==============================================================================
-- SQL Script: Complete User Deletion (Seller & Customer)
-- Description: Recursively deletes a user and ALL their dependencies (gigs, tasks,
--              orders, offers, messages, reviews, etc.) to securely wipe an account.
-- Usage: Replace 'TARGET_EMAIL_HERE' with the email of the user to delete.
-- ==============================================================================

DO $$
DECLARE
    v_target_email TEXT := 'TARGET_EMAIL_HERE'; -- Change this to the user's email
    v_auth_id UUID;
    v_user_id UUID;
    v_tasker_id UUID;
    v_customer_id UUID;
BEGIN
    -- 1. Find the Auth ID and User ID
    SELECT id INTO v_auth_id FROM auth.users WHERE email = v_target_email;
    SELECT id INTO v_user_id FROM public.users WHERE auth_user_id = v_auth_id;
    
    IF v_user_id IS NOT NULL THEN
        -- Get specific role IDs
        SELECT id INTO v_tasker_id FROM public.taskers WHERE user_id = v_user_id;
        SELECT id INTO v_customer_id FROM public.customers WHERE user_id = v_user_id;

        -- 2. Safely delete from explicitly listed dependent tables
        DELETE FROM public.admin_actions WHERE target_user_id = v_user_id OR admin_id = v_user_id;
        DELETE FROM public.order_revisions WHERE requested_by = v_user_id;
        DELETE FROM public.verifications WHERE reviewed_by = v_user_id OR user_id = v_user_id;
        DELETE FROM public.transactions WHERE payer_id = v_user_id OR payee_id = v_user_id;
        DELETE FROM public.task_images WHERE uploaded_by = v_user_id;
        
        -- Reviews
        DELETE FROM public.reviews WHERE reviewer_id = v_user_id OR reviewee_id = v_user_id;
        
        -- Messages
        DELETE FROM public.messages WHERE sender_id = v_user_id OR recipient_id = v_user_id;
        
        -- Notifications
        DELETE FROM public.notifications WHERE user_id = v_user_id;
        
        -- 3. Delete Seller/Tasker dependencies
        IF v_tasker_id IS NOT NULL THEN
            -- Nullify selected offers in tasks so we can delete the offers
            UPDATE public.tasks SET selected_offer_id = NULL WHERE selected_offer_id IN (SELECT id FROM public.offers WHERE tasker_id = v_tasker_id);
            
            -- Delete offers made by this tasker
            DELETE FROM public.offers WHERE tasker_id = v_tasker_id;
            
            -- Delete orders related to this seller
            DELETE FROM public.orders WHERE seller_id = v_tasker_id;
            
            -- Delete gig related data
            DELETE FROM public.gig_packages WHERE gig_id IN (SELECT id FROM public.gigs WHERE seller_id = v_tasker_id);
            DELETE FROM public.gigs WHERE seller_id = v_tasker_id;
        END IF;
        
        -- 4. Delete Customer dependencies
        IF v_customer_id IS NOT NULL THEN
            -- Delete offers on tasks owned by this customer
            DELETE FROM public.offers WHERE task_id IN (SELECT id FROM public.tasks WHERE customer_id = v_customer_id);
            
            -- Delete tasks owned by this customer
            DELETE FROM public.tasks WHERE customer_id = v_customer_id;
            
            -- Orders related to this buyer
            DELETE FROM public.orders WHERE customer_id = v_customer_id;
        END IF;
        
        -- 5. Delete Gig Favorites
        DELETE FROM public.gig_favorites WHERE user_id = v_user_id;
        
        -- 6. Delete Role Profiles
        DELETE FROM public.taskers WHERE user_id = v_user_id;
        DELETE FROM public.customers WHERE user_id = v_user_id;
        
        -- 7. Finally delete from public.users
        DELETE FROM public.users WHERE id = v_user_id;
    END IF;
    
    -- 8. Delete from auth.users (which will cascade to remaining auth relations)
    IF v_auth_id IS NOT NULL THEN
        DELETE FROM auth.users WHERE id = v_auth_id;
    END IF;
END $$;
