'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getConversations, sendMessage } from '@/app/actions/messages';
import { MessageCircle, X, ChevronLeft, Send, Search, Minimize2, Maximize2, Paperclip, FileText, Image as ImageIcon, Download, GripHorizontal, Store, ShoppingBag } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { OrderEventCard } from '@/components/chat/OrderEventCard';
import SuperVerifiedAvatar from '@/components/SuperVerifiedAvatar';
import Image from 'next/image';
import { toast } from '@/lib/toast';

export const FloatingChatWidget = () => {
    const { user, session } = useAuth();
    const pathname = usePathname();

    // If we're on the full messages page, hide the widget entirely
    if (pathname?.includes('/messages') || !user) {
        return null;
    }

    return <FloatingChatWidgetInner user={user} session={session} />;
};

const FloatingChatWidgetInner = ({ user, session }: { user: any, session: any }) => {
    const pathname = usePathname();
    const router = useRouter();

    const [isOpen, setIsOpen] = useState(() => {
        if (typeof window === 'undefined') return false;
        try {
            return localStorage.getItem('floating_chat_open') === 'true';
        } catch { return false; }
    });
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<any | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'buying' | 'selling'>(user?.userType === 'tasker' ? 'selling' : 'buying');
    const [isDocked, setIsDocked] = useState(() => {
        if (typeof window === 'undefined') return false;
        try {
            return localStorage.getItem('floating_chat_docked') === 'true';
        } catch { return false; }
    });
    const prevTabRef = useRef<'buying' | 'selling'>(user?.userType === 'tasker' ? 'selling' : 'buying');

    // Resizing state
    const [dimensions, setDimensions] = useState({ width: 380, height: 500 });
    const [isResizing, setIsResizing] = useState(false);
    const resizeRef = useRef<{ startX: number; startY: number; startW: number; startH: number; currentW: number; currentH: number } | null>(null);

    // Chat input state
    const [newMessage, setNewMessage] = useState('');
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
    const [isSending, setIsSending] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom helper
    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            const { scrollHeight, clientHeight } = chatContainerRef.current;
            chatContainerRef.current.scrollTo({
                top: scrollHeight - clientHeight,
                behavior: 'smooth'
            });
        }
    };

    // Load saved dimensions and docked state
    useEffect(() => {
        const savedDims = localStorage.getItem('floating_chat_dimensions');
        if (savedDims) {
            try {
                const parsed = JSON.parse(savedDims);
                if (parsed?.width && parsed?.height) setDimensions(parsed);
            } catch { }
        }
    }, []);

    // Persist docked state when it changes
    useEffect(() => {
        try {
            localStorage.setItem('floating_chat_docked', String(isDocked));
        } catch { }
    }, [isDocked]);

    // Persist open/expanded state when it changes
    useEffect(() => {
        try {
            localStorage.setItem('floating_chat_open', String(isOpen));
        } catch { }
    }, [isOpen]);

    // Resize handlers
    const handlePointerDown = (e: React.PointerEvent) => {
        setIsResizing(true);
        resizeRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            startW: dimensions.width,
            startH: dimensions.height,
            currentW: dimensions.width,
            currentH: dimensions.height
        };
        e.preventDefault();
        e.stopPropagation();
    };

    useEffect(() => {
        if (!isResizing) return;

        const handlePointerMove = (e: PointerEvent) => {
            if (!resizeRef.current) return;
            const dx = resizeRef.current.startX - e.clientX;
            const dy = resizeRef.current.startY - e.clientY;

            const newW = Math.max(300, Math.min(800, resizeRef.current.startW + dx));
            const newH = Math.max(400, Math.min(800, resizeRef.current.startH + dy));
            resizeRef.current.currentW = newW;
            resizeRef.current.currentH = newH;
            setDimensions({ width: newW, height: newH });
        };

        const handlePointerUp = () => {
            const latest = resizeRef.current ? { width: resizeRef.current.currentW, height: resizeRef.current.currentH } : dimensions;
            setIsResizing(false);
            localStorage.setItem('floating_chat_dimensions', JSON.stringify(latest));
        };

        document.addEventListener('pointermove', handlePointerMove);
        document.addEventListener('pointerup', handlePointerUp);
        return () => {
            document.removeEventListener('pointermove', handlePointerMove);
            document.removeEventListener('pointerup', handlePointerUp);
        };
    }, [isResizing, dimensions]);

    const skipNextLoadRef = useRef(false);

    // Load initial conversations based on user role. When applyState=false, fetches and returns data without updating state (for pre-fetch before tab transition).
    const loadConversations = async (userId: string, authUserid: string | undefined, tab: 'buying' | 'selling', applyState = true): Promise<any[] | void> => {
        if (!userId || !tab) return [];
        try {
            let finalAuthUserId = authUserid;
            if (!finalAuthUserId) {
                const { data: { session: currentSession } } = await supabase.auth.getSession();
                finalAuthUserId = currentSession?.user?.id;
            }
            if (!finalAuthUserId) return [];

            const role = tab === 'selling' ? 'tasker' : 'customer';
            const convs = await getConversations(finalAuthUserId, role);

            if (applyState) {
                setConversations(convs);
                const totalUnread = convs.reduce((sum: number, c: any) => sum + (c.unread_count || 0), 0);
                setUnreadCount(totalUnread);
                if (selectedConversation) {
                    const updated = convs.find(c =>
                        (c.task_id === selectedConversation.task_id && c.other_user_id === selectedConversation.other_user_id) ||
                        (c.gig_id === selectedConversation.gig_id && c.other_user_id === selectedConversation.other_user_id)
                    );
                    if (updated) setSelectedConversation(updated);
                }
            }
            return convs;
        } catch (err) {
            console.error('Failed to load conversations for widget', err);
            return [];
        }
    };

    // Initial load and realtime subscription (skips load when we just pre-fetched for tab switch)
    useEffect(() => {
        if (!user) return;
        if (skipNextLoadRef.current) {
            skipNextLoadRef.current = false;
        } else {
            loadConversations(user.id, session?.user?.id, activeTab);
        }

        const channel = supabase.channel('realtime:widget_messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `recipient_id=eq.${user.id}`
                },
                (payload) => {
                    // Refresh completely so conversations re-sort and unread badges update
                    loadConversations(user.id, session?.user?.id, activeTab);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, session?.user?.id, activeTab]); // Reload when tab switches

    // Scroll down when messages change
    useEffect(() => {
        if (selectedConversation && isOpen) {
            scrollToBottom();
        }
    }, [selectedConversation?.messages, isOpen]);

    // Sync chat tab when user switches mode (seller ↔ customer) — fetch first, then transition after overlay
    useEffect(() => {
        const handler = (evt: Event) => {
            const e = evt as CustomEvent<{ mode: 'seller' | 'customer' }>;
            const newTab = e.detail?.mode === 'seller' ? 'selling' : 'buying';
            if (newTab === activeTab) return;
            prevTabRef.current = activeTab;
            void (async () => {
                try {
                    const convs = await loadConversations(user.id, session?.user?.id, newTab, false);
                    if (!Array.isArray(convs)) return;
                    const totalUnread = convs.reduce((sum: number, c: any) => sum + (c.unread_count || 0), 0);
                    skipNextLoadRef.current = true;
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            setConversations(convs);
                            setUnreadCount(totalUnread);
                            setSelectedConversation(null);
                            setActiveTab(newTab);
                        });
                    });
                } catch {
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            setSelectedConversation(null);
                            setActiveTab(newTab);
                        });
                    });
                }
            })();
        };
        window.addEventListener('mode:switched', handler);
        return () => window.removeEventListener('mode:switched', handler);
    }, [activeTab, user?.id, session?.user?.id]);

    // Mark as read when opening a conversation
    useEffect(() => {
        if (isOpen && selectedConversation && user?.id) {
            const unreadIds = selectedConversation.messages
                .filter((m: any) => !m.read_at && m.recipient_id === user.id)
                .map((m: any) => m.id);

            if (unreadIds.length > 0) {
                const markRead = async () => {
                    const now = new Date().toISOString();
                    const { error } = await supabase
                        .from('messages')
                        .update({ read_at: now })
                        .in('id', unreadIds);

                    if (!error && user?.id && activeTab) {
                        loadConversations(user.id, session?.user?.id, activeTab);
                    }
                };
                markRead();
            }
            scrollToBottom();
        }
    }, [isOpen, selectedConversation, user?.id, activeTab]);

    // Send Message Logic
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() && attachedFiles.length === 0) return;
        if (!selectedConversation || !user) return;

        setIsSending(true);
        const tempId = 'temp-' + Date.now();
        const content = newMessage;
        const recipientId = selectedConversation.other_user_id;
        const filesToSend = [...attachedFiles];

        // Optimistic UI update
        const optimisticMessage = {
            id: tempId,
            content: content,
            attachments: filesToSend.length > 0 ? filesToSend.map(f => URL.createObjectURL(f)) : null,
            sender_id: user.id,
            recipient_id: recipientId,
            created_at: new Date().toISOString(),
            read_at: null,
            sender: { first_name: 'Me', last_name: '' },
            recipient: selectedConversation.other_user
        };

        setSelectedConversation((prev: any) => ({
            ...prev,
            messages: [...prev.messages, optimisticMessage]
        }));
        setNewMessage('');
        setAttachedFiles([]);

        try {
            const formData = new FormData();
            if (selectedConversation.task_id) formData.append('taskId', selectedConversation.task_id);
            if (selectedConversation.gig_id) formData.append('gigId', selectedConversation.gig_id);
            formData.append('recipientId', recipientId);
            formData.append('content', content);
            filesToSend.forEach(f => formData.append('attachments', f));

            const result = await sendMessage(formData);
            if (!result.success) throw new Error(result.message);

            // Reload conversations to get real ID and tick status
            if (user?.id && activeTab) {
                await loadConversations(user.id, session?.user?.id, activeTab);
            }
        } catch (error) {
            toast.error('Failed to send message');
            setNewMessage(content);
            setAttachedFiles(filesToSend);
        } finally {
            setIsSending(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setAttachedFiles(prev => [...prev, ...files].slice(0, 5));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeAttachedFile = (index: number) => {
        setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Fetch conversations for new tab first, then switch — ensures content is ready before transition
    const handleTabChange = async (newTab: 'buying' | 'selling') => {
        if (newTab === activeTab) return;
        prevTabRef.current = activeTab;
        try {
            const convs = await loadConversations(user.id, session?.user?.id, newTab, false);
            if (!Array.isArray(convs)) return;
            const totalUnread = convs.reduce((sum: number, c: any) => sum + (c.unread_count || 0), 0);
            skipNextLoadRef.current = true;
            setConversations(convs);
            setUnreadCount(totalUnread);
            setSelectedConversation(null);
            setActiveTab(newTab);
        } catch {
            // Fallback: switch without pre-fetch
            setSelectedConversation(null);
            setActiveTab(newTab);
        }
    };

    const filteredConversations = conversations.filter(c => {
        const title = (c.task_title || c.gig_details?.title || '').toLowerCase();
        const name = `${c.other_user?.first_name || ''} ${c.other_user?.last_name || ''}`.toLowerCase();
        const term = searchTerm.toLowerCase();
        return title.includes(term) || name.includes(term);
    });

    return (
        <div className={`fixed z-[9999] flex flex-col items-end pointer-events-none transition-all duration-300 ${isDocked ? 'bottom-0 right-0 top-0' : 'bottom-6 right-6'}`}>
            <AnimatePresence mode="wait">
                {isOpen ? (
                    <motion.div
                        key="widget-window"
                        initial={{ opacity: 0, scale: 0.8, y: 30, x: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: 0, transition: { type: "spring", stiffness: 350, damping: 25 } }}
                        exit={{ opacity: 0, scale: 0.8, y: 30, x: 20, transition: { duration: 0.15, ease: "easeIn" } }}
                        className={`bg-white shadow-2xl border border-gray-200 overflow-hidden flex flex-col pointer-events-auto relative origin-bottom-right ${isDocked ? 'h-full w-[380px] sm:w-[450px] border-y-0 border-r-0 rounded-none' : 'mb-4 rounded-2xl'}`}
                        style={isDocked ? {} : { width: dimensions.width, height: dimensions.height }}
                    >
                        {/* Resize handle (top-left) */}
                        {!isDocked && (
                            <div
                                className="absolute top-0 left-0 w-8 h-8 z-50 cursor-nwse-resize flex items-start justify-start p-1.5 text-white/50 hover:text-white transition-colors"
                                onPointerDown={handlePointerDown}
                            >
                                <GripHorizontal className="h-4 w-4 -rotate-45" />
                            </div>
                        )}

                        {/* Header */}
                        <div className={`px-3 py-2 flex items-center justify-between text-white flex-shrink-0 relative z-40 ${activeTab === 'selling' ? 'bg-brand-green' : 'bg-gray-900'} ${isDocked ? '' : 'rounded-t-2xl'}`}>
                            {selectedConversation ? (
                                // Active chat header - rich layout
                                <>
                                    <div className="flex items-center gap-2 pl-4 flex-1 min-w-0">
                                        <button onClick={() => setSelectedConversation(null)} className="hover:bg-white/20 p-1 rounded-full transition-colors flex-shrink-0">
                                            <ChevronLeft className="h-5 w-5" />
                                        </button>
                                        <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-white/20 text-white/90 flex-shrink-0" title={activeTab === 'selling' ? 'Seller mode' : 'Customer mode'}>
                                            {activeTab === 'selling' ? <Store className="h-2.5 w-2.5" /> : <ShoppingBag className="h-2.5 w-2.5" />}
                                            {activeTab === 'selling' ? 'Seller' : 'Customer'}
                                        </span>
                                        {/* Avatar with online dot */}
                                        <div className="relative flex-shrink-0">
                                            <SuperVerifiedAvatar
                                                src={selectedConversation.other_user?.profile_image_url}
                                                name={selectedConversation.other_user?.first_name}
                                                size={34}
                                            />
                                            {selectedConversation.other_user?.status === 'online' && (
                                                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-300 border-2 border-brand-green" />
                                            )}
                                        </div>
                                        {/* Name & status */}
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-semibold text-sm leading-tight truncate">
                                                {selectedConversation.other_user?.first_name} {selectedConversation.other_user?.last_name}
                                            </span>
                                            <span className="text-[10px] text-white/70 leading-tight">
                                                {selectedConversation.other_user?.status === 'online'
                                                    ? 'Online now'
                                                    : selectedConversation.last_message?.created_at
                                                        ? `Last seen ${new Date(selectedConversation.last_message.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                                                        : 'Offline'
                                                }
                                            </span>
                                        </div>
                                    </div>
                                    {/* Action buttons */}
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        {/* View profile */}
                                        <button
                                            onClick={() => {
                                                const id = selectedConversation.other_user_id;
                                                router.push(`/tasker/${id}`);
                                            }}
                                            className="hover:bg-white/20 p-1.5 rounded transition-colors"
                                            title="View profile"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                        </button>
                                        <button onClick={() => setIsDocked(!isDocked)} className="hover:bg-white/20 p-1.5 rounded transition-colors" title={isDocked ? 'Undock' : 'Dock to side'}>
                                            {isDocked ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                                        </button>
                                        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1.5 rounded transition-colors">
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                // List header
                                <>
                                    <div className="flex items-center gap-2 pl-4 flex-1 min-w-0">
                                        <h3 className="font-bold">Messages</h3>
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${activeTab === 'selling' ? 'bg-white/25 text-white' : 'bg-white/20 text-white/95'}`}>
                                            {activeTab === 'selling' ? <Store className="h-3 w-3" /> : <ShoppingBag className="h-3 w-3" />}
                                            {activeTab === 'selling' ? 'Seller' : 'Customer'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-white/80">
                                        <button
                                            onClick={() => {
                                                setIsOpen(false);
                                                router.push(activeTab === 'selling' ? '/seller/dashboard/messages' : '/customer/dashboard/messages');
                                            }}
                                            className="text-[10px] font-semibold hover:text-white bg-black/10 px-2 py-1 rounded flex items-center gap-1 transition-colors whitespace-nowrap hidden sm:flex"
                                        >
                                            Full Screen
                                        </button>
                                        <button onClick={() => setIsDocked(!isDocked)} className="hover:bg-white/20 p-1.5 rounded transition-colors" title={isDocked ? 'Undock' : 'Dock to side'}>
                                            {isDocked ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                                        </button>
                                        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1.5 rounded transition-colors ml-1">
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Content View */}
                        {!selectedConversation ? (
                            /* Conversation Index */
                            <div className="flex-1 flex flex-col bg-gray-50/50 overflow-hidden">
                                {/* Mode Switcher Tabs */}
                                {user?.status === 'approved' && (
                                    <TabSwitcher
                                        activeTab={activeTab}
                                        onTabChange={handleTabChange}
                                    />
                                )}
                                <div className="p-3 bg-white border-b border-gray-100 flex-shrink-0">
                                    <div className="relative">
                                        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search messages..."
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            className="w-full pl-9 pr-3 py-1.5 bg-gray-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-brand-green/20"
                                        />
                                    </div>
                                </div>
                                <div className="flex-1 overflow-hidden relative">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={activeTab}
                                            initial={{ opacity: 0, x: activeTab === 'selling' ? 40 : -40 }}
                                            animate={{ opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } }}
                                            exit={{ opacity: 0, x: prevTabRef.current === 'selling' ? 40 : -40, transition: { duration: 0.3, ease: [0.55, 0.09, 0.68, 0.53] } }}
                                            className="absolute inset-0 overflow-y-auto"
                                        >
                                            {filteredConversations.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center p-8 h-full text-center">
                                                    <MessageCircle className="h-10 w-10 text-gray-300 mb-2" />
                                                    <p className="text-sm text-gray-500">No active conversations</p>
                                                    <p className="text-xs text-gray-400 mt-1">{activeTab === 'buying' ? 'Inquire about a task or gig to start chatting' : 'Conversations from clients appear here'}</p>
                                                </div>
                                            ) : (
                                                filteredConversations.map(conv => (
                                                    <button
                                                        key={conv.task_id || conv.gig_id + conv.other_user_id}
                                                        onClick={() => setSelectedConversation(conv)}
                                                        className="w-full text-left p-3 border-b border-gray-100 bg-white hover:bg-gray-50 flex gap-3 items-center group"
                                                    >
                                                        <div className="relative">
                                                            <SuperVerifiedAvatar
                                                                src={conv.other_user?.profile_image_url}
                                                                name={conv.other_user?.first_name}
                                                                size={40}
                                                            />
                                                            {conv.unread_count > 0 && (
                                                                <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-red-500 border-2 border-white text-white text-[9px] font-bold flex items-center justify-center">
                                                                    {conv.unread_count}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between items-baseline mb-0.5">
                                                                <p className="font-semibold text-sm text-gray-900 truncate">
                                                                    {conv.other_user?.first_name} {conv.other_user?.last_name}
                                                                </p>
                                                                <span className="text-[10px] text-gray-400 flex-shrink-0">
                                                                    {new Date(conv.last_message.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 mb-1 max-w-full">
                                                                <span className={"flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide " + (conv.gig_details ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700')}>
                                                                    {conv.gig_details ? 'GIG' : 'TASK'}
                                                                </span>
                                                                <p className="text-xs text-brand-green font-medium truncate">
                                                                    {conv.task_title || conv.gig_details?.title}
                                                                </p>
                                                            </div>
                                                            <p className="text-xs text-gray-500 truncate">
                                                                {conv.last_message.sender_id === user.id && 'You: '}
                                                                {conv.last_message.content || 'Attachment sent'}
                                                            </p>
                                                        </div>
                                                    </button>
                                                ))
                                            )}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
                                {/* Topic Banner */}
                                <div className="bg-white border-b border-gray-100 px-3 py-1.5 flex items-center gap-2 flex-shrink-0">
                                    <span className={`flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${selectedConversation.gig_id ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {selectedConversation.gig_id ? 'GIG' : 'TASK'}
                                    </span>
                                    <span className="text-xs text-gray-600 font-medium truncate">
                                        {selectedConversation.task_title || selectedConversation.gig_details?.title}
                                    </span>
                                </div>

                                {/* Messages Area */}
                                <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                                    {selectedConversation.messages.map((message: any, index: number) => {
                                        const isOwnMessage = message.sender_id === user.id;
                                        const showAvatar = !isOwnMessage && (index === 0 || selectedConversation.messages[index - 1]?.sender_id !== message.sender_id);

                                        if (message.event && message.payload) {
                                            return <OrderEventCard key={message.id} message={message} isSeller={user.userType === 'tasker'} />;
                                        }

                                        return (
                                            <MessageBubble
                                                key={message.id}
                                                message={message}
                                                isOwnMessage={isOwnMessage}
                                                showAvatar={showAvatar}
                                                isLastInGroup={index === selectedConversation.messages.length - 1 || selectedConversation.messages[index + 1]?.sender_id !== message.sender_id}
                                            />
                                        );
                                    })}
                                </div>

                                {/* Input Area */}
                                <div className="p-3 bg-white border-t border-gray-100 flex-shrink-0">
                                    {attachedFiles.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {attachedFiles.map((file, i) => (
                                                <div key={i} className="flex items-center gap-1 bg-gray-100 rounded px-2 py-1 text-xs max-w-[120px]">
                                                    <span className="truncate">{file.name}</span>
                                                    <button type="button" onClick={() => removeAttachedFile(i)} className="p-0.5 hover:bg-gray-200 rounded text-red-500">
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                                        <input
                                            type="file"
                                            multiple
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="p-2 text-gray-400 hover:text-brand-green hover:bg-green-50 rounded-full transition-colors flex-shrink-0"
                                        >
                                            <Paperclip className="h-5 w-5" />
                                        </button>
                                        <textarea
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Type a message..."
                                            className="w-full bg-gray-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-brand-green/20 resize-none h-[40px] max-h-[80px]"
                                            rows={1}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendMessage(e);
                                                }
                                            }}
                                        />
                                        <button
                                            type="submit"
                                            disabled={isSending || (!newMessage.trim() && attachedFiles.length === 0)}
                                            className="p-2.5 bg-brand-green text-white rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 cursor-pointer"
                                        >
                                            <Send className="h-4 w-4" />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.button
                        key="widget-button"
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1, transition: { duration: 0.3, ease: "easeOut" } }}
                        exit={{ y: 100, opacity: 0, transition: { duration: 0.35, ease: "easeIn" } }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsOpen(true)}
                        className="bg-brand-green text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:bg-green-600 transition-all pointer-events-auto flex items-center justify-center relative z-50 group origin-center"
                    >
                        <MessageCircle className="h-7 w-7" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 h-6 min-w-6 px-1.5 rounded-full bg-red-500 border-2 border-white text-white text-xs font-bold flex items-center justify-center shadow-sm">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}

                        {/* Tooltip */}
                        <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                            Messages
                            <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                        </div>
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
};

function TabSwitcher({ activeTab, onTabChange }: { activeTab: 'buying' | 'selling'; onTabChange: (tab: 'buying' | 'selling') => void }) {
    const base = "flex-1 py-1.5 text-xs font-semibold border-b-2 transition-colors";
    const activeCls = base + " text-brand-green border-brand-green";
    const inactiveCls = base + " text-gray-500 border-transparent hover:text-gray-700";
    return (
        <div className="bg-white flex-shrink-0">
            <div className="flex">
                <button onClick={() => onTabChange('buying')} className={activeTab === 'buying' ? activeCls : inactiveCls}>
                    Buying
                </button>
                <button onClick={() => onTabChange('selling')} className={activeTab === 'selling' ? activeCls : inactiveCls}>
                    Selling
                </button>
            </div>
        </div>
    );
}

