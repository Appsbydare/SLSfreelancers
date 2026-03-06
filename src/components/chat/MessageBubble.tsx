'use client';

import React from 'react';
import Image from 'next/image';
import { Clock, Check, CheckCheck, FileText, Download } from 'lucide-react';

export interface Message {
    id: string;
    content: string;
    attachments?: string[] | null;
    created_at: string;
    read_at: string | null;
    sender_id: string;
    recipient_id: string;
    sender: { first_name: string; last_name: string; profile_image_url?: string };
    recipient: { first_name: string; last_name: string; profile_image_url?: string };
    event?: string;
    payload?: Record<string, any>;
}

interface MessageBubbleProps {
    message: Message;
    isOwnMessage: boolean;
    showAvatar: boolean;
    isLastInGroup: boolean;
}

export const MessageBubble = ({ message, isOwnMessage, showAvatar, isLastInGroup }: MessageBubbleProps) => {
    const isImageUrl = (url: string) =>
        /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url) || url.startsWith('blob:');

    const getFileName = (url: string) => {
        try { return decodeURIComponent(url.split('/').pop()?.split('?')[0] || 'File'); }
        catch { return 'File'; }
    };

    return (
        <div className={`flex gap-3 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
            {!isOwnMessage && (
                <div className="w-8 h-8 flex-shrink-0 relative mt-1">
                    {showAvatar ? (
                        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden relative">
                            {message.sender.profile_image_url ? (
                                <Image src={message.sender.profile_image_url} alt="User" fill className="object-cover" />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center bg-gray-300 text-gray-600 font-bold text-xs uppercase">
                                    {message.sender.first_name?.[0] || 'U'}
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
                        <p className="px-4 py-3 leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    )}
                </div>
                {/* Timestamp / Status (only on last message in a group) */}
                {isLastInGroup && (
                    <div className="flex items-center gap-1 px-1">
                        <p className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {isOwnMessage && (
                            message.id.startsWith('temp-') ? (
                                // Still uploading / sending
                                <Clock className="h-3 w-3 text-gray-300 flex-shrink-0" />
                            ) : message.read_at ? (
                                // Recipient has read it — double tick in brand green
                                <CheckCheck className="h-3.5 w-3.5 text-brand-green flex-shrink-0" />
                            ) : (
                                // Delivered to DB, not yet read — single grey tick
                                <Check className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                            )
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
