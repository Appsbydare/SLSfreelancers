'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Clock, User, MoreVertical, Paperclip, Search, Circle, ClipboardList, Tag, X, FileText, Image as ImageIcon, Download, Check, CheckCheck } from 'lucide-react';
import { toast } from '@/lib/toast';
import { sendMessage } from '@/app/actions/messages';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';

interface Message {
    id: string;
    content: string;
    attachments?: string[] | null;
    sender_id: string;
    recipient_id: string;
    created_at: string;
    read_at: string | null;
    sender: { first_name: string; last_name: string; profile_image_url?: string };
    recipient: { first_name: string; last_name: string; profile_image_url?: string };
}

interface Conversation {
    task_id?: string;
    gig_id?: string;
    task_title?: string;
    gig_details?: {
        id: string;
        title: string;
        slug: string;
        images: string[];
        starting_price: number;
    };
    messages: Message[];
    last_message: Message;
    unread_count: number;
    other_user_id: string;
    other_user: { first_name: string; last_name: string; profile_image_url?: string };
}

interface MessagesListProps {
    conversations: Conversation[];
    currentUserId: string;
    initialTaskId?: string;
    initialGigId?: string;
    initialRecipientId?: string;
    initialRecipient?: any;
    initialGigDetails?: any;
    initialTaskTitle?: string;
}

export default function MessagesList({
    conversations,
    currentUserId,
    initialTaskId,
    initialGigId,
    initialRecipientId,
    initialRecipient,
    initialGigDetails,
    initialTaskTitle
}: MessagesListProps) {
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messageText, setMessageText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
    const router = useRouter();
    const searchParams = useSearchParams();
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pathname = usePathname();

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

    useEffect(() => {
        scrollToBottom();
    }, [selectedConversation?.messages]);

    // Handle "Accept Bid" action
    useEffect(() => {
        const action = searchParams.get('action');
        if (action === 'accepted' && initialTaskId && initialRecipientId) {
            setMessageText("I've accepted your bid! When can you start?");

            // Remove the action param so it doesn't reappear on refresh
            const newParams = new URLSearchParams(searchParams.toString());
            newParams.delete('action');
            router.replace(`${pathname}?${newParams.toString()}`);
        }
    }, [searchParams, initialTaskId, initialRecipientId, pathname, router]);

    // Realtime Subscription
    useEffect(() => {
        if (!currentUserId) return;

        const channel = supabase.channel('realtime:messages')
            // New incoming messages
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `recipient_id=eq.${currentUserId}`
                },
                (payload) => {
                    const newMessageRaw = payload.new;

                    setSelectedConversation(prev => {
                        if (!prev) return null;

                        const isRelevant =
                            ((prev.task_id && newMessageRaw.task_id === prev.task_id) ||
                                (prev.gig_id && newMessageRaw.gig_id === prev.gig_id)) &&
                            (newMessageRaw.sender_id === prev.other_user_id);

                        if (!isRelevant) return prev;
                        if (prev.messages.some(m => m.id === newMessageRaw.id)) return prev;

                        const constructedMessage: Message = {
                            id: newMessageRaw.id,
                            content: newMessageRaw.content,
                            attachments: newMessageRaw.attachments,
                            sender_id: newMessageRaw.sender_id,
                            recipient_id: newMessageRaw.recipient_id,
                            created_at: newMessageRaw.created_at,
                            read_at: newMessageRaw.read_at,
                            sender: prev.other_user,
                            recipient: { first_name: 'Me', last_name: '' }
                        };

                        return {
                            ...prev,
                            messages: [...prev.messages, constructedMessage],
                            last_message: constructedMessage
                        };
                    });

                    router.refresh();
                }
            )
            // read_at updates on messages we sent — flips single tick → double tick
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                    filter: `sender_id=eq.${currentUserId}`
                },
                (payload) => {
                    const updated = payload.new;
                    if (!updated.read_at) return; // only care about read_at being set

                    setSelectedConversation(prev => {
                        if (!prev) return null;
                        return {
                            ...prev,
                            messages: prev.messages.map(m =>
                                m.id === updated.id ? { ...m, read_at: updated.read_at } : m
                            )
                        };
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUserId, router]);

    // Mark messages as read when viewed
    useEffect(() => {
        if (!selectedConversation || !currentUserId) return;

        const unreadIds = selectedConversation.messages
            .filter(m => m.recipient_id === currentUserId && !m.read_at)
            .map(m => m.id);

        if (unreadIds.length > 0) {
            const markRead = async () => {
                const now = new Date().toISOString();
                const { error } = await supabase
                    .from('messages')
                    .update({ read_at: now })
                    .in('id', unreadIds);

                if (!error) {
                    setSelectedConversation(prev => {
                        if (!prev) return null;
                        return {
                            ...prev,
                            messages: prev.messages.map(m =>
                                unreadIds.includes(m.id)
                                    ? { ...m, read_at: now }
                                    : m
                            )
                        };
                    });
                    router.refresh();
                }
            };
            markRead();
        }
    }, [selectedConversation?.messages, currentUserId, router]);

    // Sync conversations prop updates
    useEffect(() => {
        if (selectedConversation) {
            const updatedConv = conversations.find(
                c => {
                    // Match based on available context ID
                    if (selectedConversation.task_id) return c.task_id === selectedConversation.task_id && c.other_user_id === selectedConversation.other_user_id;
                    if (selectedConversation.gig_id) return c.gig_id === selectedConversation.gig_id && c.other_user_id === selectedConversation.other_user_id;
                    return false;
                }
            );
            if (updatedConv) {
                // Replace if server has more messages, or if we still have a temp message pending
                const hasTempMessage = selectedConversation.messages.some(m => m.id.startsWith('temp-'));
                if (updatedConv.messages.length > selectedConversation.messages.length || hasTempMessage) {
                    setSelectedConversation(updatedConv);
                }
            }
        }
    }, [conversations]);

    const createTempMessage = (senderId: string, recipientId: string): Message => ({
        id: 'temp',
        content: 'Start a conversation...',
        sender_id: senderId,
        recipient_id: recipientId,
        created_at: new Date().toISOString(),
        read_at: null,
        sender: { first_name: 'Me', last_name: '' },
        recipient: { first_name: 'User', last_name: '' }
    });

    // Initialize selection
    useEffect(() => {
        if (initialRecipientId) {
            // Priority 1: Direct link to Task conversation
            if (initialTaskId) {
                const existing = conversations.find(
                    c => c.task_id === initialTaskId && c.other_user_id === initialRecipientId
                );
                if (existing) {
                    setSelectedConversation(existing);
                } else {
                    // New Task Conversation Placeholder
                    setSelectedConversation({
                        task_id: initialTaskId,
                        task_title: initialTaskTitle || 'New Conversation',
                        messages: [],
                        last_message: createTempMessage(currentUserId, initialRecipientId),
                        unread_count: 0,
                        other_user_id: initialRecipientId,
                        other_user: initialRecipient || { first_name: 'Tasker', last_name: '' }
                    });
                }
            }
            // Priority 2: Direct link to Gig conversation
            else if (initialGigId) {
                const existing = conversations.find(
                    c => c.gig_id === initialGigId && c.other_user_id === initialRecipientId
                );
                if (existing) {
                    setSelectedConversation(existing);
                } else {
                    // New Gig Conversation Placeholder
                    setSelectedConversation({
                        gig_id: initialGigId,
                        gig_details: initialGigDetails,
                        task_title: initialGigDetails?.title || 'Gig Inquiry',
                        messages: [],
                        last_message: createTempMessage(currentUserId, initialRecipientId),
                        unread_count: 0,
                        other_user_id: initialRecipientId,
                        other_user: initialRecipient || { first_name: 'Seller', last_name: '' }
                    });
                }
            }
        } else if (conversations.length > 0 && !selectedConversation) {
            setSelectedConversation(conversations[0]);
        }
    }, [conversations, initialTaskId, initialGigId, initialRecipientId, initialRecipient, initialGigDetails, initialTaskTitle]);

    // Presence Subscription
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!currentUserId) return;

        const { globalPresence } = require('@/lib/globalPresence');

        // Subscribe to online users updates
        // The service handles channel lifecycle without killing the tracking session
        const unsubscribe = globalPresence.subscribe((users: Set<string>) => {
            setOnlineUsers(new Set(users));
        });

        return () => {
            unsubscribe();
        };
    }, [currentUserId]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageText.trim() && attachedFiles.length === 0) return;
        if (!selectedConversation) return;

        setIsSending(true);
        const tempId = 'temp-' + Date.now();
        const content = messageText;
        const recipientId = selectedConversation.other_user_id;
        const filesToSend = [...attachedFiles];

        // Optimistic message with local file previews
        const optimisticMessage: Message = {
            id: tempId,
            content: content,
            attachments: filesToSend.length > 0
                ? filesToSend.map(f => URL.createObjectURL(f))
                : null,
            sender_id: currentUserId,
            recipient_id: recipientId,
            created_at: new Date().toISOString(),
            read_at: null,
            sender: { first_name: 'Me', last_name: '' },
            recipient: selectedConversation.other_user
        };

        setSelectedConversation(prev => {
            if (!prev) return null;
            return { ...prev, messages: [...prev.messages, optimisticMessage] };
        });

        setMessageText('');
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

            // Replace the optimistic temp message with the real one from the server
            // so the tick immediately shows as sent (single tick) instead of clock
            if (result.data) {
                const realMessage: Message = {
                    id: result.data.id,
                    content: result.data.content,
                    attachments: result.data.attachments ?? null,
                    sender_id: result.data.sender_id,
                    recipient_id: result.data.recipient_id,
                    created_at: result.data.created_at,
                    read_at: result.data.read_at ?? null,
                    sender: { first_name: 'Me', last_name: '' },
                    recipient: selectedConversation?.other_user ?? { first_name: '', last_name: '' }
                };
                setSelectedConversation(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        messages: prev.messages.map(m => m.id === tempId ? realMessage : m)
                    };
                });
            }

            router.refresh();
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
            setSelectedConversation(prev => {
                if (!prev) return null;
                return { ...prev, messages: prev.messages.filter(m => m.id !== tempId) };
            });
            setMessageText(content);
            setAttachedFiles(filesToSend);
        } finally {
            setIsSending(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setAttachedFiles(prev => {
            const combined = [...prev, ...files];
            return combined.slice(0, 5); // max 5 files
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeAttachedFile = (index: number) => {
        setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const isImageUrl = (url: string) =>
        /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url) || url.startsWith('blob:');

    const getFileName = (url: string) => {
        try { return decodeURIComponent(url.split('/').pop()?.split('?')[0] || 'File'); }
        catch { return 'File'; }
    };

    const filteredConversations = conversations.filter(c => {
        const firstName = c.other_user?.first_name || '';
        const lastName = c.other_user?.last_name || '';
        const title = c.task_title || c.gig_details?.title || '';
        const term = searchTerm.toLowerCase();

        return (
            firstName.toLowerCase().includes(term) ||
            lastName.toLowerCase().includes(term) ||
            title.toLowerCase().includes(term)
        );
    });

    if (!selectedConversation && conversations.length === 0 && !initialTaskId && !initialGigId) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center h-[600px] flex flex-col items-center justify-center">
                <div className="mx-auto h-20 w-20 text-brand-green bg-brand-green/10 rounded-full flex items-center justify-center mb-6">
                    <MessageCircle className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No messages yet</h3>
                <p className="text-gray-500 max-w-sm">Connect with taskers to start a conversation. Your messages will appear here.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-0 bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200 h-[calc(100vh-140px)] min-h-[600px]">
            {/* Sidebar (Conversations List) */}
            <div className="lg:col-span-4 border-r border-gray-200 flex flex-col bg-gray-50/50">
                <div className="p-4 border-b border-gray-200 bg-white">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-800">Inbox</h3>
                        <div className="flex gap-2 text-gray-500">
                            <MoreVertical className="h-5 w-5 cursor-pointer hover:text-gray-700" />
                        </div>
                    </div>
                    <div className="relative">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search inbox..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-brand-green/20 focus:bg-white transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {filteredConversations.map((conv) => {
                        const uniqueKey = (conv.task_id ? `task-${conv.task_id}` : `gig-${conv.gig_id}`) + `-${conv.other_user_id}`;
                        const isSelected = selectedConversation &&
                            ((selectedConversation.task_id && selectedConversation.task_id === conv.task_id && selectedConversation.other_user_id === conv.other_user_id) ||
                                (selectedConversation.gig_id && selectedConversation.gig_id === conv.gig_id && selectedConversation.other_user_id === conv.other_user_id));

                        return (
                            <button
                                key={uniqueKey}
                                onClick={() => setSelectedConversation(conv)}
                                className={`w-full text-left p-4 border-b border-gray-100 hover:bg-white hover:shadow-sm transition-all relative group ${isSelected
                                    ? 'bg-white border-l-4 border-l-brand-green shadow-sm z-10'
                                    : 'border-l-4 border-l-transparent'
                                    }`}
                            >
                                <div className="flex gap-3">
                                    <div className="relative h-12 w-12 flex-shrink-0">
                                        <div className="h-full w-full rounded-full bg-gray-200 overflow-hidden relative">
                                            {conv.other_user?.profile_image_url ? (
                                                <Image src={conv.other_user.profile_image_url} alt="User" fill className="object-cover" />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center bg-brand-green/10 text-brand-green font-bold text-lg">
                                                    {(conv.other_user?.first_name || '?')[0]}
                                                </div>
                                            )}
                                        </div>
                                        {/* Status Dot */}
                                        {/* Status Dot */}
                                        <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${onlineUsers.has(conv.other_user_id) || (conv.other_user as any)?.status === 'online' ? 'bg-green-500' :
                                            (conv.other_user as any)?.status === 'idle' ? 'bg-yellow-500' :
                                                'bg-gray-300'
                                            }`}></span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className={`font-semibold text-sm truncate ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                                                {conv.other_user?.first_name || 'Unknown'} {conv.other_user?.last_name || ''}
                                            </h4>
                                            <span className="text-xs text-gray-400 whitespace-nowrap">
                                                {new Date(conv.last_message.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 mb-1 max-w-full">
                                            {conv.gig_details?.title ? (
                                                <span className="flex-shrink-0 bg-purple-100 text-purple-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
                                                    GIG
                                                </span>
                                            ) : (
                                                <span className="flex-shrink-0 bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
                                                    TASK
                                                </span>
                                            )}
                                            <p className="text-xs text-gray-500 truncate font-medium">
                                                {conv.task_title || conv.gig_details?.title || 'Inquiry'}
                                            </p>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className="text-xs text-gray-500 truncate max-w-[140px]">
                                                {conv.last_message.sender_id === currentUserId && 'You: '}
                                                {conv.last_message.content}
                                            </p>
                                            {conv.unread_count > 0 && (
                                                <span className="bg-brand-green text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                                    {conv.unread_count}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Chat Area */}
            {selectedConversation ? (
                <div className="lg:col-span-8 flex flex-col bg-white h-full relative overflow-hidden">
                    {/* Chat Header */}
                    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white z-20 shadow-sm flex-shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="relative h-10 w-10 flex-shrink-0">
                                <div className="h-full w-full rounded-full bg-gray-200 overflow-hidden relative">
                                    {selectedConversation.other_user?.profile_image_url ? (
                                        <Image src={selectedConversation.other_user.profile_image_url} alt="User" fill className="object-cover" />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center bg-brand-green/10 text-brand-green font-bold">
                                            {(selectedConversation.other_user?.first_name || '?')[0]}
                                        </div>
                                    )}
                                </div>
                                <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white ${onlineUsers.has(selectedConversation.other_user_id) || (selectedConversation.other_user as any)?.status === 'online' ? 'bg-green-500' :
                                    (selectedConversation.other_user as any)?.status === 'idle' ? 'bg-yellow-500' :
                                        'bg-gray-300'
                                    }`}></span>
                            </div>
                            <div>
                                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                                    {selectedConversation.other_user?.first_name || 'Unknown'} {selectedConversation.other_user?.last_name || ''}
                                    {(onlineUsers.has(selectedConversation.other_user_id) || (selectedConversation.other_user as any)?.status === 'online') && (
                                        <span className="text-xs font-normal text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100 flex items-center gap-1">
                                            <Circle className="h-2 w-2 fill-green-600" /> Online
                                        </span>
                                    )}
                                </h2>
                                <p className="text-xs text-gray-500">
                                    Local Time: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link href={`/seller/${selectedConversation.other_user_id}`} className="text-sm font-semibold text-gray-700 hover:text-brand-green transition-colors border border-gray-300 px-4 py-2 rounded-lg hover:border-brand-green">
                                View Profile
                            </Link>
                            <MoreVertical className="h-5 w-5 text-gray-400 cursor-pointer" />
                        </div>
                    </div>

                    {/* Context Banner */}
                    <div className="flex-shrink-0">
                        {/* Task Context */}
                        {selectedConversation.task_id && (
                            <div className="bg-gradient-to-r from-brand-green/5 via-white to-white border-b border-brand-green/15 px-6 py-3 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-brand-green/10 flex items-center justify-center">
                                        <ClipboardList className="h-4 w-4 text-brand-green" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-semibold text-brand-green uppercase tracking-widest leading-none mb-0.5">Regarding Task</p>
                                        <p className="text-sm font-semibold text-gray-900 truncate">{selectedConversation.task_title || 'Request'}</p>
                                    </div>
                                </div>
                                <Link
                                    href={`${pathname.includes('/seller') ? '/seller' : '/customer'}/dashboard/tasks/${selectedConversation.task_id}`}
                                    className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold text-brand-green border border-brand-green/30 bg-brand-green/5 hover:bg-brand-green hover:text-white px-3 py-1.5 rounded-lg transition-all duration-200"
                                >
                                    View Order
                                    <Send className="h-3 w-3 -rotate-45" />
                                </Link>
                            </div>
                        )}
                        {/* Gig Context Card */}
                        {selectedConversation.gig_details && (
                            <div className="bg-gradient-to-r from-purple-50/60 via-white to-white border-b border-purple-100 px-6 py-3 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 min-w-0">
                                    {/* Thumbnail */}
                                    <div className="relative flex-shrink-0 h-10 w-14 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                                        {selectedConversation.gig_details.images?.[0] ? (
                                            <Image
                                                src={selectedConversation.gig_details.images[0]}
                                                alt={selectedConversation.gig_details.title}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center">
                                                <Tag className="h-4 w-4 text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-semibold text-purple-600 uppercase tracking-widest leading-none mb-0.5">Gig Service</p>
                                        <p className="text-sm font-semibold text-gray-900 truncate">{selectedConversation.gig_details.title}</p>
                                        {selectedConversation.gig_details.starting_price ? (
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                Starting at <span className="font-semibold text-gray-700">LKR {selectedConversation.gig_details.starting_price.toLocaleString()}</span>
                                            </p>
                                        ) : null}
                                    </div>
                                </div>
                                <Link
                                    href={`/gigs/${selectedConversation.gig_details.slug}`}
                                    className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold text-purple-600 border border-purple-200 bg-purple-50 hover:bg-purple-600 hover:text-white px-3 py-1.5 rounded-lg transition-all duration-200"
                                >
                                    View Gig
                                    <Send className="h-3 w-3 -rotate-45" />
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Messages Area */}
                    <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30 min-h-0">
                        {/* Date Divider Example */}
                        <div className="flex justify-center">
                            <span className="text-xs font-medium text-gray-400 bg-gray-100 px-3 py-1 rounded-full">Today</span>
                        </div>

                        {selectedConversation.messages.map((message, index) => {
                            const isOwnMessage = message.sender_id === currentUserId;
                            const showAvatar = !isOwnMessage && (index === 0 || selectedConversation.messages[index - 1]?.sender_id !== message.sender_id);

                            return (
                                <div
                                    key={message.id}
                                    className={`flex gap-3 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                                >
                                    {!isOwnMessage && (
                                        <div className="w-8 h-8 flex-shrink-0 relative mt-1">
                                            {showAvatar ? (
                                                <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden relative">
                                                    {message.sender.profile_image_url ? (
                                                        <Image src={message.sender.profile_image_url} alt="User" fill className="object-cover" />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center bg-gray-300 text-gray-600 font-bold text-xs">
                                                            {message.sender.first_name[0]}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8" /> // Spacer
                                            )}
                                        </div>
                                    )}

                                    <div className={`max-w-[75%] space-y-1 ${isOwnMessage ? 'items-end flex flex-col' : 'items-start flex flex-col'}`}>
                                        <div className={`rounded-2xl shadow-sm text-sm overflow-hidden ${isOwnMessage
                                                ? 'bg-brand-green text-white rounded-br-none'
                                                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                            }`}>
                                            {/* Attachments */}
                                            {message.attachments && message.attachments.length > 0 && (
                                                <div className={`flex flex-col gap-1.5 ${message.content ? 'pt-2 px-2' : 'p-2'}`}>
                                                    {message.attachments.map((url, ai) => (
                                                        isImageUrl(url) ? (
                                                            <a key={ai} href={url} target="_blank" rel="noopener noreferrer" className="block">
                                                                <div className="relative w-48 h-36 rounded-lg overflow-hidden border border-black/10">
                                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                    <img src={url} alt="attachment" className="w-full h-full object-cover hover:scale-105 transition-transform duration-200" />
                                                                </div>
                                                            </a>
                                                        ) : (
                                                            <a key={ai} href={url} target="_blank" rel="noopener noreferrer"
                                                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${isOwnMessage
                                                                    ? 'bg-white/15 hover:bg-white/25 text-white'
                                                                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
                                                                }`}>
                                                                <FileText className="h-4 w-4 flex-shrink-0" />
                                                                <span className="truncate max-w-[160px]">{getFileName(url)}</span>
                                                                <Download className="h-3.5 w-3.5 flex-shrink-0 ml-auto" />
                                                            </a>
                                                        )
                                                    ))}
                                                </div>
                                            )}
                                            {/* Text content */}
                                            {message.content && (
                                                <p className="px-4 py-3 leading-relaxed">{message.content}</p>
                                            )}
                                        </div>
                                        {/* Timestamp / Status (only on last message in a group) */}
                                        {(index === selectedConversation.messages.length - 1 || selectedConversation.messages[index + 1]?.sender_id !== message.sender_id) && (
                                            <div className="flex items-center gap-1 px-1">
                                                <p className="text-[10px] text-gray-400 font-medium">
                                                    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                                {isOwnMessage && (
                                                    message.id.startsWith('temp-') ? (
                                                        // Still uploading / sending
                                                        <Clock className="h-3 w-3 text-gray-300" />
                                                    ) : message.read_at ? (
                                                        // Recipient has read it — double tick in brand green
                                                        <CheckCheck className="h-3.5 w-3.5 text-brand-green" />
                                                    ) : (
                                                        // Delivered to DB, not yet read — single grey tick
                                                        <Check className="h-3.5 w-3.5 text-gray-400" />
                                                    )
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-gray-200">
                        {/* Attached file previews */}
                        {attachedFiles.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3 px-1">
                                {attachedFiles.map((file, i) => {
                                    const isImg = file.type.startsWith('image/');
                                    const previewUrl = isImg ? URL.createObjectURL(file) : null;
                                    return (
                                        <div key={i} className="relative group flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 max-w-[180px]">
                                            {isImg && previewUrl ? (
                                                <div className="relative h-8 w-8 rounded overflow-hidden flex-shrink-0">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={previewUrl} alt={file.name} className="h-full w-full object-cover" />
                                                </div>
                                            ) : (
                                                <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                            )}
                                            <span className="text-xs text-gray-600 truncate max-w-[100px]">{file.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeAttachedFile(i)}
                                                className="flex-shrink-0 ml-auto p-0.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <form onSubmit={handleSendMessage} className="bg-white rounded-xl border border-gray-300 shadow-sm focus-within:ring-2 focus-within:ring-brand-green/20 focus-within:border-brand-green transition-all">
                            <div className="flex items-end p-2 gap-2">
                                {/* Hidden file input */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept="image/*,.pdf,.doc,.docx,.txt"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`p-2 transition-colors rounded-full hover:bg-gray-100 ${attachedFiles.length > 0 ? 'text-brand-green' : 'text-gray-400 hover:text-gray-600'}`}
                                    title="Attach files (max 5)"
                                >
                                    <Paperclip className="h-5 w-5" />
                                </button>
                                <textarea
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    placeholder="Type your message..."
                                    className="flex-1 max-h-32 min-h-[44px] py-2.5 px-2 bg-transparent border-none focus:ring-0 resize-none text-sm text-gray-800 placeholder:text-gray-400 scrollbar-hide"
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
                                    disabled={isSending || (!messageText.trim() && attachedFiles.length === 0)}
                                    className="p-2 bg-brand-green text-white rounded-lg hover:bg-brand-green/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                >
                                    <Send className="h-5 w-5" />
                                </button>
                            </div>
                        </form>
                        <p className="text-center text-xs text-gray-400 mt-2">
                            Press Enter to send, Shift + Enter for new line
                        </p>
                    </div>
                </div>
            ) : (
                /* Empty State (Large Screen) */
                <div className="hidden lg:flex lg:col-span-8 flex-col items-center justify-center bg-gray-50/30 text-center p-8">
                    <div className="h-24 w-24 bg-brand-green/5 rounded-full flex items-center justify-center mb-6 animate-pulse-slow">
                        <MessageCircle className="h-10 w-10 text-brand-green" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Select a Conversation</h2>
                    <p className="text-gray-500 max-w-md">Choose a conversation from the sidebar to start chatting or view your history.</p>
                </div>
            )
            }
        </div >
    );
}
