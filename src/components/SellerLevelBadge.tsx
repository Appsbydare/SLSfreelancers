'use client';

import { useEffect, useRef, useState } from 'react';
import { Shield, Award, Star, Zap } from 'lucide-react';

type LevelKey = 'starter_pro' | 'trusted_specialist' | 'secure_elite' | 'top_performer' | 'level_0' | 'level_1' | 'level_2' | 'level_3';

interface SellerLevelBadgeProps {
  level: LevelKey;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animate?: boolean;
  celebrate?: boolean;
  prevLevel?: string;
}

const LEVEL_CONFIG: Record<string, {
  label: string;
  icon: React.ElementType;
  bg: string;
  text: string;
  iconCls: string;
  border: string;
  glowRgb: string;
}> = {
  starter_pro:        { label: 'Legacy Starter',    icon: Shield, bg: 'bg-gray-100',     text: 'text-gray-700',  iconCls: 'text-gray-600',   border: 'border-gray-300',          glowRgb: '107,114,128' },
  trusted_specialist: { label: 'Legacy Specialist', icon: Award,  bg: 'bg-gray-100',     text: 'text-gray-700',  iconCls: 'text-gray-600',   border: 'border-gray-300',          glowRgb: '107,114,128' },
  secure_elite:       { label: 'Legacy Elite',      icon: Star,   bg: 'bg-gray-100',     text: 'text-gray-700',  iconCls: 'text-gray-600',   border: 'border-gray-300',          glowRgb: '107,114,128' },
  top_performer:      { label: 'Legacy Top',        icon: Zap,    bg: 'bg-gray-100',     text: 'text-gray-700',  iconCls: 'text-gray-600',   border: 'border-gray-300',          glowRgb: '107,114,128' },
  level_0: { label: 'New Seller',    icon: Shield, bg: 'bg-gray-100',            text: 'text-gray-700',    iconCls: 'text-gray-500',    border: 'border-gray-300',          glowRgb: '107,114,128' },
  level_1: { label: 'Level 1 Seller', icon: Award, bg: 'bg-green-100',           text: 'text-green-800',   iconCls: 'text-green-600',   border: 'border-green-300',         glowRgb: '34,197,94' },
  level_2: { label: 'Level 2 Seller', icon: Star,  bg: 'bg-amber-100',           text: 'text-amber-800',   iconCls: 'text-amber-600',   border: 'border-amber-300',         glowRgb: '245,158,11' },
  level_3: { label: 'Top Seller',     icon: Zap,   bg: 'bg-gradient-to-r from-purple-100 to-pink-100', text: 'text-purple-700', iconCls: 'text-pink-600', border: 'border-purple-300', glowRgb: '168,85,247' },
};

const SIZE = {
  sm: { wrap: (l: boolean) => l ? 'px-2 py-0.5 gap-1'   : 'p-1',   icon: 'h-3 w-3', text: 'text-[11px]' },
  md: { wrap: (l: boolean) => l ? 'px-3 py-1.5 gap-1.5' : 'p-1.5', icon: 'h-4 w-4', text: 'text-sm'     },
  lg: { wrap: (l: boolean) => l ? 'px-4 py-2 gap-2'     : 'p-2',   icon: 'h-5 w-5', text: 'text-base'   },
};

type Phase = 'out' | 'in' | 'glow' | null;

export default function SellerLevelBadge({
  level,
  size = 'md',
  showLabel = true,
  animate = false,
  celebrate = false,
  prevLevel,
}: SellerLevelBadgeProps) {
  const [phase, setPhase] = useState<Phase>(null);
  const [midFlip, setMidFlip] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  // Normal state popping
  const [popping, setPopping] = useState(false);
  const prevLevelRef = useRef(level);
  
  useEffect(() => {
    if (animate && level !== prevLevelRef.current && !celebrate && !prevLevel) {
      setPopping(true);
      const t = setTimeout(() => setPopping(false), 600);
      prevLevelRef.current = level;
      return () => clearTimeout(t);
    }
    if (!celebrate && !prevLevel) prevLevelRef.current = level;
  }, [level, animate, celebrate, prevLevel]);

  // Celebrate morph animation
  useEffect(() => {
    if (!celebrate) {
      clearTimers();
      setPhase(null);
      setMidFlip(false);
      return;
    }

    clearTimers();
    setPhase('out');
    setMidFlip(false);

    timers.current.push(
      setTimeout(() => {
        setMidFlip(true);
        setPhase('in');
      }, 300),
      setTimeout(() => {
        setPhase('glow');
      }, 800),
      setTimeout(() => {
        setPhase(null);
        prevLevelRef.current = level;
      }, 2800)
    );

    return clearTimers;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [celebrate]);

  // While waiting for the popup to be dismissed (celebrate is false, but prevLevel is set),
  // we intentionally show the prevLevel. We only switch to the new level once `midFlip` becomes true.
  const activeDisplayLevel = (prevLevel && !midFlip) ? prevLevel : level;
  
  const cfg = LEVEL_CONFIG[activeDisplayLevel] || LEVEL_CONFIG.level_0;
  const glowCfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.level_0; // Always glow with the new tier color
  const Icon = cfg.icon;
  const sz = SIZE[size];

  const animStyle: React.CSSProperties = (() => {
    if (popping) return { transform: 'scale(1.15)', boxShadow: '0 0 0 4px rgba(34,197,94,0.2)' };
    if (phase === 'out') return { animation: 'slb-shrink-out 0.3s cubic-bezier(0.4, 0, 1, 1) forwards' };
    if (phase === 'in')  return { animation: 'slb-spring-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' };
    if (phase === 'glow') return {
      animation: 'slb-glow 2s cubic-bezier(0.1, 0.8, 0.3, 1) forwards',
      ['--slb-glow' as string]: glowCfg.glowRgb,
    };
    return {};
  })();

  return (
    <>
      <span
        className={`
          inline-flex items-center rounded-full border font-semibold overflow-hidden relative
          ${sz.wrap(showLabel)}
          ${cfg.bg} ${cfg.text} ${cfg.border}
          transition-colors duration-200
        `}
        style={{
          ...animStyle,
          transformOrigin: 'center center',
          transition: popping ? 'transform 0.3s, box-shadow 0.3s' : undefined
        }}
      >
        {phase === 'in' && <span className="absolute inset-0 slb-shimmer" aria-hidden />}
        <Icon className={`${sz.icon} ${cfg.iconCls} shrink-0 relative z-10`} />
        {showLabel && (
          <span className={`${sz.text} relative z-10 whitespace-nowrap`}>
            {cfg.label}
          </span>
        )}
      </span>

      <style>{`
        @keyframes slb-shrink-out {
          0% { transform: scale(1); opacity: 1; }
          20% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(0.5); opacity: 0; }
        }

        @keyframes slb-spring-in {
          0% { transform: scale(0.5); opacity: 0; }
          40% { transform: scale(1.15); opacity: 1; }
          65% { transform: scale(0.95); opacity: 1; }
          85% { transform: scale(1.02); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }

        @keyframes slb-glow {
          0%   { box-shadow: 0 0 0 0 rgba(var(--slb-glow), 0.6); transform: scale(1); }
          30%  { box-shadow: 0 0 0 8px rgba(var(--slb-glow), 0), 0 0 24px rgba(var(--slb-glow), 0.4); transform: scale(1.02); }
          100% { box-shadow: 0 0 0 12px rgba(var(--slb-glow), 0), 0 0 12px rgba(var(--slb-glow), 0); transform: scale(1); }
        }

        .slb-shimmer {
          background: linear-gradient(
            105deg,
            transparent 0%, transparent 30%,
            rgba(255,255,255,0.8) 50%,
            transparent 70%, transparent 100%
          );
          background-size: 300% 100%;
          animation: slb-shimmer-sweep 0.6s ease-out forwards;
        }
        
        @keyframes slb-shimmer-sweep {
          0%   { background-position: 200% center; }
          100% { background-position: -100% center; }
        }
      `}</style>
    </>
  );
}
