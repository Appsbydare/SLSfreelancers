import { CheckCircle2 } from 'lucide-react';

interface VerifiedBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export default function VerifiedBadge({ size = 'md', showText = true, className = '' }: VerifiedBadgeProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <CheckCircle2 className={`${sizeClasses[size]} text-brand-green`} />
      {showText && (
        <span className={`${textSizeClasses[size]} font-medium text-brand-green`}>
          Verified
        </span>
      )}
    </div>
  );
}

