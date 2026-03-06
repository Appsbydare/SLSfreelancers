'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Award, Star, Zap, X, Trophy, Sparkles } from 'lucide-react';

// ─── per-level config ──────────────────────────────────────────────────────────
const LEVEL_META: Record<string, {
    label: string;
    sublabel: string;
    description: string;
    icon: React.ElementType;
    // Tailwind gradient classes (used on text + button)
    gradientFrom: string;
    gradientTo: string;
    // Inline hex values for the icon circle background (CSS gradient)
    circleBg: [string, string];
    // Glow colour under the circle
    glow: string;
    // Confetti colours
    particle: string[];
    // Top accent bar colour
    accentBar: string;
    // Achievement badge label pill colour
    pillBg: string;
    pillText: string;
}> = {
    level_1: {
        label: 'Level 1 Seller',
        sublabel: 'First Milestone Achieved',
        description: 'Your hard work is paying off. You\'ve proven yourself as a reliable seller — keep delivering great work!',
        icon: Award,
        gradientFrom: '#16a34a',
        gradientTo: '#4ade80',
        circleBg: ['#16a34a', '#4ade80'],
        glow: 'rgba(34,197,94,0.35)',
        particle: ['#16a34a', '#4ade80', '#bbf7d0', '#ffffff', '#ffd700', '#fbbf24'],
        accentBar: 'linear-gradient(90deg, #16a34a, #4ade80, #16a34a)',
        pillBg: '#dcfce7',
        pillText: '#15803d',
    },
    level_2: {
        label: 'Level 2 Seller',
        sublabel: 'Elite Professional',
        description: 'You\'ve built a track record buyers trust. You\'re now among the top sellers on EasyFinder.',
        icon: Trophy,
        gradientFrom: '#b45309',
        gradientTo: '#fcd34d',
        circleBg: ['#92400e', '#f59e0b'],
        glow: 'rgba(245,158,11,0.40)',
        // Gold coins palette
        particle: ['#f59e0b', '#fcd34d', '#fef3c7', '#d97706', '#ffffff', '#f97316'],
        accentBar: 'linear-gradient(90deg, #92400e, #f59e0b, #fcd34d, #f59e0b, #92400e)',
        pillBg: '#fef3c7',
        pillText: '#92400e',
    },
    level_3: {
        label: 'Top Seller',
        sublabel: 'Invite-Only Excellence',
        description: 'You have reached the highest seller level. Handpicked by our team — this is the greatest honour on EasyFinder.',
        icon: Zap,
        gradientFrom: '#7c3aed',
        gradientTo: '#ec4899',
        circleBg: ['#7c3aed', '#ec4899'],
        glow: 'rgba(168,85,247,0.40)',
        particle: ['#7c3aed', '#ec4899', '#f9a8d4', '#c4b5fd', '#ffffff', '#fbbf24'],
        accentBar: 'linear-gradient(90deg, #7c3aed, #ec4899, #7c3aed)',
        pillBg: '#f3e8ff',
        pillText: '#6b21a8',
    },
};

// ─── confetti ─────────────────────────────────────────────────────────────────
function burst(colors: string[], origin: { x: number; y: number }, angle: number) {
    confetti({
        particleCount: 90,
        angle,
        spread: 75,
        origin,
        colors,
        gravity: 1.1,
        drift: angle < 90 ? 0.4 : -0.4,
        scalar: 1.15,
        ticks: 300,
        shapes: ['circle', 'square'],
    });
}

// ─── sparkle star SVG (inline) ────────────────────────────────────────────────
function StarSparkle({ style, className }: { style?: React.CSSProperties; className?: string }) {
    return (
        <svg viewBox="0 0 20 20" fill="currentColor" className={className} style={style}>
            <path d="M10 1l2.39 6.26L19 9l-6.61 1.74L10 18l-2.39-6.26L1 9l6.61-1.74z" />
        </svg>
    );
}

// ─── component ────────────────────────────────────────────────────────────────
interface LevelUpCelebrationProps {
    newLevel: string;
    onDone: (newLevel: string) => void;
}

export default function LevelUpCelebration({ newLevel, onDone }: LevelUpCelebrationProps) {
    const meta = LEVEL_META[newLevel] ?? LEVEL_META.level_1;
    const Icon = meta.icon;

    const [visible, setVisible] = useState(false);   // modal entrance
    const [closing, setClosing] = useState(false);   // modal exit
    const confettiRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // entrance animation
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 60);
        return () => clearTimeout(t);
    }, []);

    // fire confetti immediately when modal appears
    const fireConfetti = useCallback(() => {
        const c = meta.particle;
        burst(c, { x: 0, y: 0.55 }, 60);
        burst(c, { x: 1, y: 0.55 }, 120);

        let i = 0;
        confettiRef.current = setInterval(() => {
            i++;
            burst(c, { x: 0, y: 0.55 }, 60);
            burst(c, { x: 1, y: 0.55 }, 120);
            if (i >= 4) {
                clearInterval(confettiRef.current!);
                confettiRef.current = null;
            }
        }, 550);
    }, [meta.particle]);

    useEffect(() => {
        if (visible) {
            // slight delay so modal is visually in before confetti
            const t = setTimeout(fireConfetti, 300);
            return () => clearTimeout(t);
        }
    }, [visible, fireConfetti]);

    useEffect(() => {
        return () => { if (confettiRef.current) clearInterval(confettiRef.current); };
    }, []);

    const handleClose = () => {
        setClosing(true);
        setTimeout(() => onDone(newLevel), 350);
    };

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            style={{
                background: closing
                    ? 'rgba(0,0,0,0)'
                    : visible ? 'rgba(0,0,0,0.60)' : 'rgba(0,0,0,0)',
                backdropFilter: visible && !closing ? 'blur(6px)' : 'none',
                transition: 'background 0.35s ease, backdrop-filter 0.35s ease',
            }}
        >
            {/* ── Card ── */}
            <div
                style={{
                    opacity: closing ? 0 : visible ? 1 : 0,
                    transform: closing
                        ? 'scale(0.92) translateY(24px)'
                        : visible ? 'scale(1) translateY(0)' : 'scale(0.88) translateY(32px)',
                    transition: 'opacity 0.4s cubic-bezier(.34,1.56,.64,1), transform 0.4s cubic-bezier(.34,1.56,.64,1)',
                    width: '100%',
                    maxWidth: 420,
                    position: 'relative',
                    borderRadius: 28,
                    background: '#fff',
                    boxShadow: `0 32px 80px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06)`,
                    overflow: 'hidden',
                    textAlign: 'center',
                }}
            >
                {/* animated accent bar at top */}
                <div style={{
                    height: 5,
                    background: meta.accentBar,
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 2.5s linear infinite',
                }} />

                {/* ── decorative floating sparkles ── */}
                <StarSparkle className="absolute top-7 left-5 w-3 h-3 opacity-30" style={{ color: meta.gradientTo, animation: 'float1 3s ease-in-out infinite' }} />
                <StarSparkle className="absolute top-12 right-6 w-4 h-4 opacity-20" style={{ color: meta.gradientFrom, animation: 'float2 4s ease-in-out infinite' }} />
                <StarSparkle className="absolute bottom-20 left-8 w-3 h-3 opacity-20" style={{ color: meta.gradientTo, animation: 'float3 3.5s ease-in-out infinite' }} />

                {/* ── main content ── */}
                <div style={{ padding: '36px 36px 32px' }}>

                    {/* icon circle */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                        <div style={{ position: 'relative' }}>
                            {/* outer glow ring */}
                            <div style={{
                                position: 'absolute', inset: -10,
                                borderRadius: '50%',
                                background: `radial-gradient(circle, ${meta.glow} 0%, transparent 70%)`,
                                animation: 'pulse-glow 2s ease-in-out infinite',
                            }} />
                            {/* circle */}
                            <div style={{
                                width: 100, height: 100,
                                borderRadius: '50%',
                                background: `linear-gradient(135deg, ${meta.circleBg[0]}, ${meta.circleBg[1]})`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: `0 12px 40px ${meta.glow}, 0 4px 16px rgba(0,0,0,0.18)`,
                                position: 'relative',
                                zIndex: 1,
                                animation: 'icon-drop 0.6s cubic-bezier(.34,1.56,.64,1) 0.1s both',
                            }}>
                                <Icon style={{ width: 46, height: 46, color: '#fff', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.25))' }} />
                            </div>
                            {/* sparkle badge dot */}
                            <div style={{
                                position: 'absolute', top: -2, right: -2,
                                width: 26, height: 26, borderRadius: '50%',
                                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                                border: '3px solid #fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 2px 8px rgba(245,158,11,0.5)',
                                zIndex: 2,
                                animation: 'badge-pop 0.5s cubic-bezier(.34,1.56,.64,1) 0.5s both',
                            }}>
                                <span style={{ fontSize: 13, lineHeight: 1 }}>⭐</span>
                            </div>
                        </div>
                    </div>

                    {/* achievement pill */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '4px 14px',
                            borderRadius: 999,
                            background: meta.pillBg,
                            color: meta.pillText,
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                        }}>
                            <Sparkles style={{ width: 11, height: 11 }} />
                            {meta.sublabel}
                        </span>
                    </div>

                    {/* heading */}
                    <h2 style={{
                        fontSize: 28,
                        fontWeight: 800,
                        margin: '0 0 10px',
                        background: `linear-gradient(135deg, ${meta.gradientFrom}, ${meta.gradientTo})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        lineHeight: 1.2,
                    }}>
                        {meta.label}
                    </h2>

                    {/* divider */}
                    <div style={{
                        width: 48, height: 3, borderRadius: 999, margin: '0 auto 16px',
                        background: `linear-gradient(90deg, ${meta.gradientFrom}, ${meta.gradientTo})`,
                    }} />

                    {/* description */}
                    <p style={{
                        fontSize: 14.5,
                        color: '#6b7280',
                        lineHeight: 1.65,
                        margin: '0 0 28px',
                    }}>
                        {meta.description}
                    </p>

                    {/* CTA button */}
                    <button
                        onClick={handleClose}
                        style={{
                            width: '100%',
                            padding: '14px 0',
                            borderRadius: 16,
                            border: 'none',
                            cursor: 'pointer',
                            background: `linear-gradient(135deg, ${meta.gradientFrom}, ${meta.gradientTo})`,
                            color: '#fff',
                            fontSize: 16,
                            fontWeight: 700,
                            letterSpacing: '0.01em',
                            boxShadow: `0 8px 24px ${meta.glow}`,
                            transition: 'opacity 0.15s, transform 0.15s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.92'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
                        onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)'; }}
                        onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
                    >
                        Awesome, let&apos;s go! 🎉
                    </button>
                </div>

                {/* close button */}
                <button
                    onClick={handleClose}
                    style={{
                        position: 'absolute', top: 14, right: 14,
                        width: 32, height: 32, borderRadius: '50%',
                        border: 'none', background: '#f3f4f6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: '#9ca3af',
                        transition: 'background 0.15s, color 0.15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#e5e7eb'; (e.currentTarget as HTMLButtonElement).style.color = '#374151'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f3f4f6'; (e.currentTarget as HTMLButtonElement).style.color = '#9ca3af'; }}
                >
                    <X style={{ width: 16, height: 16 }} />
                </button>
            </div>

            {/* keyframe styles injected inline */}
            <style>{`
                @keyframes shimmer {
                    0%   { background-position: 200% center; }
                    100% { background-position: -200% center; }
                }
                @keyframes pulse-glow {
                    0%, 100% { transform: scale(1); opacity: 0.8; }
                    50%       { transform: scale(1.12); opacity: 1; }
                }
                @keyframes icon-drop {
                    from { opacity: 0; transform: scale(0.4) rotate(-20deg); }
                    to   { opacity: 1; transform: scale(1) rotate(0deg); }
                }
                @keyframes badge-pop {
                    from { opacity: 0; transform: scale(0); }
                    to   { opacity: 1; transform: scale(1); }
                }
                @keyframes float1 {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50%      { transform: translateY(-6px) rotate(15deg); }
                }
                @keyframes float2 {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50%      { transform: translateY(-8px) rotate(-10deg); }
                }
                @keyframes float3 {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50%      { transform: translateY(-5px) rotate(20deg); }
                }
            `}</style>
        </div>
    );
}
