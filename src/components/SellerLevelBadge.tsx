'use client';

import { Shield, Award, Star, Zap } from 'lucide-react';

interface SellerLevelBadgeProps {
  level: 'starter_pro' | 'trusted_specialist' | 'secure_elite' | 'top_performer';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function SellerLevelBadge({ 
  level, 
  size = 'md', 
  showLabel = true 
}: SellerLevelBadgeProps) {
  const levelConfig = {
    starter_pro: {
      label: 'Starter Pro',
      icon: Shield,
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-700',
      iconColor: 'text-gray-600',
      borderColor: 'border-gray-300',
    },
    trusted_specialist: {
      label: 'Trusted Specialist',
      icon: Award,
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
      iconColor: 'text-green-600',
      borderColor: 'border-green-300',
    },
    secure_elite: {
      label: 'Secure Elite',
      icon: Star,
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-600',
      borderColor: 'border-yellow-300',
    },
    top_performer: {
      label: 'Top Performer',
      icon: Zap,
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-700',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-300',
    },
  };

  const config = levelConfig[level];
  const Icon = config.icon;

  const sizeClasses = {
    sm: {
      container: showLabel ? 'px-2 py-1' : 'p-1',
      icon: 'h-3 w-3',
      text: 'text-xs',
    },
    md: {
      container: showLabel ? 'px-3 py-1.5' : 'p-1.5',
      icon: 'h-4 w-4',
      text: 'text-sm',
    },
    lg: {
      container: showLabel ? 'px-4 py-2' : 'p-2',
      icon: 'h-5 w-5',
      text: 'text-base',
    },
  };

  const { container, icon, text } = sizeClasses[size];

  return (
    <span
      className={`inline-flex items-center ${container} rounded-full border ${config.bgColor} ${config.textColor} ${config.borderColor} font-semibold`}
    >
      <Icon className={`${icon} ${config.iconColor} ${showLabel ? 'mr-1' : ''}`} />
      {showLabel && <span className={text}>{config.label}</span>}
    </span>
  );
}

