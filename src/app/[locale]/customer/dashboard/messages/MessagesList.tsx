'use client';

import { useState } from 'react';
import { MessageCircle, Send, Clock } from 'lucide-react';
import { toast } from '@/lib/toast';

interface Message {
    id: string;
    content: string;
    sender_id: string;
    recipient_id: string;
    created_at: string;
    read_at: string | null;
    sender: { first_name: string; last_name: string };
    recipient: { first_name: string; last_name: string };
}

interface Conversation {
    task_id: string;
    task_title: string;
    messages: Message[];
    last_message: Message;
    unread_count: number;
}

interface MessagesListProps {
    conversations: Conversation[];
    currentUserId: string;
}

export default function MessagesList({ conversations, currentUserId }: MessagesListProps) {
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(
        conversations[0] || null
    );
    const [messageText, setMessageText] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageText.trim() || !selectedConversation) return;

        setIsSending(true);
        try {
            // Determine recipient (the other person in the conversation)
            const lastMessage = selectedConversation.last_message;
            const recipientId = lastMessage.sender_id === currentUserId
                ? lastMessage.recipient_id
                : lastMessage.sender_id;

            const response = await fetch('/api/customer/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    task_id: selectedConversation.task_id,
                    recipient_id: recipientId,
                    content: messageText,
                }),
            });

            if (!response.ok) throw new Error('Failed to send message');

            setMessageText('');
            toast.success('Message sent');

            // Refresh page to show new message
            window.location.reload();
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
        } finally {
            setIsSending(false);
        }
    };

    if (!selectedConversation) {
        return null;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
            {/* Conversations List */}
            <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Conversations</h3>
                </div>
                <div className="overflow-y-auto h-[calc(600px-60px)]">
                    {conversations.map((conv) => (
                        <button
                            key={conv.task_id}
                            onClick={() => setSelectedConversation(conv)}
                            className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${selectedConversation?.task_id === conv.task_id ? 'bg-brand-green/5' : ''
                                }`}
                        >
                            <div className="flex items-start justify-between mb-1">
                                <h4 className="font-medium text-gray-900 text-sm line-clamp-1">
                                    {conv.task_title}
                                </h4>
                                {conv.unread_count > 0 && (
                                    <span className="bg-brand-green text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                                        {conv.unread_count}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2">
                                {conv.last_message.content}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                {new Date(conv.last_message.created_at).toLocaleDateString()}
                            </p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat Window */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col">
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">{selectedConversation.task_title}</h3>
                    <p className="text-sm text-gray-500">
                        {selectedConversation.messages.length} message(s)
                    </p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {selectedConversation.messages
                        .slice()
                        .reverse()
                        .map((message) => {
                            const isOwnMessage = message.sender_id === currentUserId;
                            return (
                                <div
                                    key={message.id}
                                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[70%] rounded-lg p-3 ${isOwnMessage
                                                ? 'bg-brand-green text-white'
                                                : 'bg-gray-100 text-gray-900'
                                            }`}
                                    >
                                        <p className="text-sm">{message.content}</p>
                                        <div className="flex items-center gap-1 mt-1">
                                            <Clock className="h-3 w-3 opacity-70" />
                                            <p className="text-xs opacity-70">
                                                {new Date(message.created_at).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
                        />
                        <button
                            type="submit"
                            disabled={isSending || !messageText.trim()}
                            className="px-4 py-2 bg-brand-green text-white rounded-lg font-semibold hover:bg-brand-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Send className="h-4 w-4" />
                            Send
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
