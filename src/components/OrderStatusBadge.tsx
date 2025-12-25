'use client';

import { 
  Clock, 
  Package, 
  CheckCircle, 
  RefreshCw, 
  XCircle, 
  AlertTriangle 
} from 'lucide-react';

interface OrderStatusBadgeProps {
  status: 'pending' | 'in_progress' | 'delivered' | 'revision_requested' | 'completed' | 'cancelled' | 'disputed';
  size?: 'sm' | 'md' | 'lg';
}

export default function OrderStatusBadge({ status, size = 'md' }: OrderStatusBadgeProps) {
  const config = {
    pending: {
      label: 'Pending',
      icon: Clock,
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-700',
      borderColor: 'border-yellow-200',
    },
    in_progress: {
      label: 'In Progress',
      icon: Package,
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200',
    },
    delivered: {
      label: 'Delivered',
      icon: CheckCircle,
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-200',
    },
    revision_requested: {
      label: 'Revision Requested',
      icon: RefreshCw,
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-700',
      borderColor: 'border-orange-200',
    },
    completed: {
      label: 'Completed',
      icon: CheckCircle,
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
      borderColor: 'border-green-200',
    },
    cancelled: {
      label: 'Cancelled',
      icon: XCircle,
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-700',
      borderColor: 'border-gray-200',
    },
    disputed: {
      label: 'Disputed',
      icon: AlertTriangle,
      bgColor: 'bg-red-100',
      textColor: 'text-red-700',
      borderColor: 'border-red-200',
    },
  };

  const { label, icon: Icon, bgColor, textColor, borderColor } = config[status];

  const sizeClasses = {
    sm: {
      container: 'px-2 py-1',
      icon: 'h-3 w-3',
      text: 'text-xs',
    },
    md: {
      container: 'px-3 py-1.5',
      icon: 'h-4 w-4',
      text: 'text-sm',
    },
    lg: {
      container: 'px-4 py-2',
      icon: 'h-5 w-5',
      text: 'text-base',
    },
  };

  const { container, icon, text } = sizeClasses[size];

  return (
    <span
      className={`inline-flex items-center ${container} rounded-full border ${bgColor} ${textColor} ${borderColor} font-medium`}
    >
      <Icon className={`${icon} mr-1`} />
      <span className={text}>{label}</span>
    </span>
  );
}

