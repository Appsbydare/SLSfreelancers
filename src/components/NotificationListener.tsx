'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { toast as reactHotToast } from 'react-hot-toast';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function NotificationListener() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const [publicUserId, setPublicUserId] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Initialize audio ref
    useEffect(() => {
        audioRef.current = new Audio('/notification.mp3');
        audioRef.current.volume = 0.5;
    }, []);

    // Unlock audio context on first user interaction
    useEffect(() => {
        const unlockAudio = () => {
            if (audioRef.current) {
                // Mute briefly to prevent the user from hearing a "blip" on their first click
                audioRef.current.muted = true;
                const promise = audioRef.current.play();
                if (promise !== undefined) {
                    promise.then(() => {
                        console.log('[NotificationListener] Audio context unlocked');
                        if (audioRef.current) {
                            audioRef.current.pause();
                            audioRef.current.currentTime = 0;
                            audioRef.current.muted = false;
                        }
                    }).catch(error => {
                        // Auto-play was prevented
                        console.log('[NotificationListener] Audio unlock prevented:', error);
                        if (audioRef.current) {
                            audioRef.current.muted = false;
                        }
                    });
                }
            }
            // Remove listeners after first attempt
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);
        };

        window.addEventListener('click', unlockAudio);
        window.addEventListener('touchstart', unlockAudio);
        window.addEventListener('keydown', unlockAudio);

        return () => {
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);
        };
    }, []);

    // Fetch public user ID
    useEffect(() => {
        if (!user) {
            console.log('[NotificationListener] No auth user');
            setPublicUserId(null);
            return;
        }

        // The user.id from AuthContext is already the public user ID
        // No need to query the database again
        console.log('[NotificationListener] Using public user ID from AuthContext:', user.id);
        setPublicUserId(user.id);
    }, [user]);

    // Request notification permission
    useEffect(() => {
        if (publicUserId && 'Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, [publicUserId]);

    // Subscribe to messages
    useEffect(() => {
        if (!publicUserId) {
            console.log('[NotificationListener] No publicUserId, skipping subscription');
            return;
        }

        console.log('[NotificationListener] Subscribing for user:', publicUserId);

        const messageChannel = supabase.channel('global:messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `recipient_id=eq.${publicUserId}`
                },
                async (payload) => {
                    const newMessage = payload.new;
                    console.log('[NotificationListener] New message received:', newMessage);

                    // Only suppress if we are viewing THIS SPECIFIC conversation
                    const isOnMessagesPage = pathname?.includes('/messages');
                    const currentTaskId = searchParams.get('taskId');
                    const currentRecipientId = searchParams.get('recipientId');

                    const isViewingThisConversation =
                        isOnMessagesPage &&
                        currentTaskId === newMessage.task_id &&
                        currentRecipientId === newMessage.sender_id;

                    console.log('[NotificationListener] Check:', {
                        pathname,
                        isOnMessagesPage,
                        currentTaskId,
                        currentRecipientId,
                        messageTaskId: newMessage.task_id,
                        messageSenderId: newMessage.sender_id,
                        isViewingThisConversation
                    });

                    if (isViewingThisConversation) {
                        console.log('[NotificationListener] Suppressing - viewing this conversation');
                        return; // Don't show notification for the active conversation
                    }

                    // Fetch sender details using admin client to bypass RLS
                    const { data: sender, error: senderError } = await supabase
                        .from('users')
                        .select('first_name')
                        .eq('id', newMessage.sender_id)
                        .maybeSingle();

                    if (senderError) {
                        console.error('[NotificationListener] Error fetching sender:', senderError);
                    }

                    const senderName = sender?.first_name || 'Someone';
                    const messagePreview = newMessage.content.substring(0, 60) + (newMessage.content.length > 60 ? '...' : '');

                    console.log('[NotificationListener] Showing toast:', senderName, messagePreview);

                    // Play notification sound
                    try {
                        console.log('[NotificationListener] Attempting to play sound...', audioRef.current);
                        if (audioRef.current) {
                            // Reset time in case it was already played
                            audioRef.current.currentTime = 0;
                            const playPromise = audioRef.current.play();

                            if (playPromise !== undefined) {
                                playPromise
                                    .then(() => {
                                        console.log('[NotificationListener] Sound played successfully');
                                    })
                                    .catch((error) => {
                                        console.error('[NotificationListener] Audio play failed:', error);
                                        // This is likely an Autoplay Policy error if the user hasn't interacted with the page yet.
                                    });
                            }
                        } else {
                            console.warn('[NotificationListener] Audio ref is null');
                        }
                    } catch (error) {
                        console.error('[NotificationListener] Error triggering audio:', error);
                    }

                    // Show Professional Toast Notification
                    reactHotToast.custom(
                        (t) => (
                            <div style={{
                                background: 'white',
                                color: '#1f2937',
                                padding: '16px 20px',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                borderLeft: '4px solid #22c55e',
                                minWidth: '320px',
                                maxWidth: '400px',
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                opacity: t.visible ? 1 : 0,
                                transition: 'opacity 0.3s ease',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        color: 'white',
                                        fontWeight: 600,
                                        fontSize: '16px',
                                    }}>
                                        {senderName.charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            color: '#22c55e',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            marginBottom: '4px',
                                        }}>
                                            New Message
                                        </div>
                                        <div style={{
                                            fontSize: '14px',
                                            fontWeight: 600,
                                            color: '#111827',
                                            marginBottom: '4px',
                                        }}>
                                            {senderName}
                                        </div>
                                        <div style={{
                                            fontSize: '13px',
                                            color: '#6b7280',
                                            lineHeight: 1.4,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                        }}>
                                            {messagePreview}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ),
                        {
                            duration: 4000,
                            position: 'top-right',
                        }
                    );

                    // Show Browser Notification
                    if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification(`New message from ${senderName}`, {
                            body: messagePreview,
                            icon: '/icon-192x192.png',
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            console.log('[NotificationListener] Unsubscribing');
            supabase.removeChannel(messageChannel);
        };
    }, [publicUserId, pathname, searchParams]);

    // Subscribe to general notifications
    useEffect(() => {
        if (!publicUserId) return;

        console.log('[NotificationListener] Subscribing to notifications for user:', publicUserId);

        const notifyChannel = supabase.channel('global:notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${publicUserId}`
                },
                (payload) => {
                    const newNotif = payload.new;
                    console.log('[NotificationListener] New notification received:', newNotif);

                    // Show Toast
                    reactHotToast.custom(
                        (t) => (
                            <div style={{
                                background: 'white',
                                color: '#1f2937',
                                padding: '16px 20px',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                borderLeft: '4px solid #22c55e',
                                minWidth: '320px',
                                maxWidth: '400px',
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                opacity: t.visible ? 1 : 0,
                                transition: 'opacity 0.3s ease',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        color: 'white',
                                        fontWeight: 600,
                                        fontSize: '16px',
                                    }}>
                                        🔔
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            color: '#22c55e',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            marginBottom: '4px',
                                        }}>
                                            {newNotif.title}
                                        </div>
                                        <div style={{
                                            fontSize: '13px',
                                            color: '#6b7280',
                                            lineHeight: 1.4,
                                        }}>
                                            {newNotif.message}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ),
                        {
                            duration: 5000,
                            position: 'top-right',
                        }
                    );

                    // Play sound
                    try {
                        if (audioRef.current) {
                            audioRef.current.currentTime = 0;
                            const playPromise = audioRef.current.play();
                            if (playPromise !== undefined) {
                                playPromise.catch(() => { });
                            }
                        }
                    } catch (e) { }

                    // Browser notification
                    if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification(newNotif.title, {
                            body: newNotif.message,
                            icon: '/icon-192x192.png',
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(notifyChannel);
        };
    }, [publicUserId]);


    // Track Presence
    // Track Presence using Singleton
    useEffect(() => {
        if (!publicUserId) return;

        console.log('[NotificationListener] Tracking presence for:', publicUserId);

        // Import dynamically if needed or just assume the file is imported
        const { globalPresence } = require('@/lib/globalPresence');

        globalPresence.trackUser(publicUserId);

        // We don't need to clean up tracking here because this component
        // persists for the session.
    }, [publicUserId]);

    return null;
}
