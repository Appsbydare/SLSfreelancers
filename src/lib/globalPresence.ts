import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

// Singleton instance to manage global presence
class GlobalPresenceService {
    private static instance: GlobalPresenceService;
    private channel: RealtimeChannel | null = null;
    private listeners: Set<(users: Set<string>) => void> = new Set();
    private currentUserId: string | null = null;
    private onlineUsers: Set<string> = new Set();
    private isTracking: boolean = false;

    private constructor() { }

    public static getInstance(): GlobalPresenceService {
        if (!GlobalPresenceService.instance) {
            GlobalPresenceService.instance = new GlobalPresenceService();
        }
        return GlobalPresenceService.instance;
    }

    public async trackUser(userId: string) {
        if (this.currentUserId === userId && this.isTracking) return;

        this.currentUserId = userId;
        this.initChannel();

        // If channel is already joined, track immediately
        if (this.channel?.state === 'joined') {
            await this.performTrack();
        }
    }

    public subscribe(callback: (users: Set<string>) => void): () => void {
        this.listeners.add(callback);
        // Immediately trigger with current state
        callback(this.onlineUsers);

        // Ensure channel is active if not already
        if (!this.channel) {
            this.initChannel();
        }

        return () => {
            this.listeners.delete(callback);
        };
    }

    private initChannel() {
        if (this.channel) return;

        console.log('[GlobalPresence] Initializing channel...');
        this.channel = supabase.channel('global_presence', {
            config: {
                presence: {
                    key: this.currentUserId || undefined,
                },
            },
        });

        this.channel
            .on('presence', { event: 'sync' }, () => {
                this.updateState();
            })
            .on('presence', { event: 'join' }, () => {
                this.updateState();
            })
            .on('presence', { event: 'leave' }, () => {
                this.updateState();
            })
            .subscribe(async (status) => {
                console.log('[GlobalPresence] Channel status:', status);
                if (status === 'SUBSCRIBED') {
                    if (this.currentUserId) {
                        await this.performTrack();
                    }
                    this.updateState();
                }
            });
    }

    private async performTrack() {
        if (!this.channel || !this.currentUserId) return;
        try {
            console.log('[GlobalPresence] Tracking user:', this.currentUserId);
            await this.channel.track({
                user_id: this.currentUserId,
                online_at: new Date().toISOString()
            });
            this.isTracking = true;
        } catch (err) {
            console.error('[GlobalPresence] Track error:', err);
        }
    }

    private updateState() {
        if (!this.channel) return;

        const newState = this.channel.presenceState();
        const users = new Set<string>();

        for (const key in newState) {
            const presences = newState[key];
            if (Array.isArray(presences)) {
                presences.forEach((p: any) => {
                    if (p.user_id) users.add(p.user_id);
                });
            }
        }

        this.onlineUsers = users;
        this.notifyListeners();
    }

    private notifyListeners() {
        this.listeners.forEach(listener => listener(this.onlineUsers));
    }
}

export const globalPresence = GlobalPresenceService.getInstance();
