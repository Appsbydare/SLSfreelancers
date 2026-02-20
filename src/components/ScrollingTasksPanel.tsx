'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { MapPin, Clock, DollarSign, Users } from 'lucide-react';
import { Task } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface ScrollingTasksPanelProps {
  tasks: Task[];
  autoScroll?: boolean;
  scrollSpeed?: number; // pixels per second
}

export default function ScrollingTasksPanel({
  tasks,
  autoScroll = true,
  scrollSpeed = 30
}: ScrollingTasksPanelProps) {
  const [isPaused, setIsPaused] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollAnimationRef = useRef<number | null>(null);
  const lastScrollTimeRef = useRef<number>(Date.now());
  const router = useRouter();
  const locale = useLocale();
  const { user } = useAuth();

  useEffect(() => {
    // Only auto-scroll if we have enough tasks to overflow (approx) or just generic check
    // If we have few tasks, auto-scroll might look weird without duplication, but preserving user request to remove dups.
    if (autoScroll && tasks.length > 3 && !isPaused) {
      startAutoScroll();
    } else {
      stopAutoScroll();
    }

    return () => {
      stopAutoScroll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoScroll, tasks.length, isPaused]);

  const startAutoScroll = () => {
    if (!scrollContainerRef.current) return;

    const scroll = () => {
      if (!scrollContainerRef.current || isPaused) return;

      const now = Date.now();
      const deltaTime = (now - lastScrollTimeRef.current) / 1000;
      lastScrollTimeRef.current = now;

      const scrollAmount = scrollSpeed * deltaTime;
      scrollContainerRef.current.scrollLeft += scrollAmount;

      const maxScroll = scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth;
      if (scrollContainerRef.current.scrollLeft >= maxScroll) {
        // Reset to start - this is jerky without duplication, but better than showing triple tasks
        scrollContainerRef.current.scrollLeft = 0;
      }

      scrollAnimationRef.current = requestAnimationFrame(scroll);
    };

    scrollAnimationRef.current = requestAnimationFrame(scroll);
  };

  const stopAutoScroll = () => {
    if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current);
      scrollAnimationRef.current = null;
    }
  };

  const handleTaskClick = (taskId: string) => {
    if (user?.userType === 'tasker' || user?.hasTaskerAccount) {
      router.push(`/${locale}/seller/dashboard/tasks/${taskId}`);
    } else {
      router.push(`/${locale}/become-tasker`);
    }
  };

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
    if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    }
    return 'Just now';
  };

  if (!tasks || tasks.length === 0) return null;

  return (
    <div className="py-12 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 font-geom">
            Open Tasks
          </h2>
          <p className="text-gray-600">
            Browse available tasks and submit your offers
          </p>
        </div>

        <div className="relative" style={{ overflowX: 'auto', overflowY: 'visible' }}>
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide py-4"
            style={{
              scrollBehavior: 'auto',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                getTimeAgo={getTimeAgo}
                onClick={() => handleTaskClick(task.id)}
                onCardHover={(isHovering) => setIsPaused(isHovering)}
              />
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

function TaskCard({
  task,
  getTimeAgo,
  onClick,
  onCardHover
}: {
  task: Task;
  getTimeAgo: (date: Date) => string;
  onClick: () => void;
  onCardHover?: (isHovering: boolean) => void
}) {
  return (
    <div
      onClick={onClick}
      className="flex-shrink-0 w-80 bg-white rounded-lg border-2 border-gray-200 shadow-lg hover:shadow-2xl hover:shadow-brand-green/20 transition-all duration-300 hover:-translate-y-1 overflow-hidden group hover:border-brand-green/50 hover:ring-2 hover:ring-brand-green/30 cursor-pointer"
      onMouseEnter={() => onCardHover?.(true)}
      onMouseLeave={() => onCardHover?.(false)}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-brand-green transition-colors">
              {task.title}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {task.description}
            </p>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2 text-brand-green" />
            <span>{task.location}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-2 text-gray-400" />
            <span>{getTimeAgo(task.postedDate)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center text-sm text-gray-600">
            <Users className="h-4 w-4 mr-1 text-gray-400" />
            <span>{task.offersCount} offers</span>
          </div>
          <div className="text-right">
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 text-brand-green mr-1" />
              <span className="text-lg font-bold text-brand-green">
                LKR {task.budget.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

