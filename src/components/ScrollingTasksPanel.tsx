'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { MapPin, Clock, DollarSign, Users } from 'lucide-react';
import { Task } from '@/types';

interface ScrollingTasksPanelProps {
  autoScroll?: boolean;
  scrollSpeed?: number; // pixels per second
}

// Sample task data
const sampleTasks: Task[] = [
  {
    id: '1',
    title: 'Need Home Cleaning Service',
    description: 'Looking for professional home cleaning service for a 3-bedroom house in Colombo. Need deep cleaning including kitchen and bathrooms.',
    budget: 5000,
    location: 'Colombo',
    category: 'cleaning',
    postedDate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    posterId: 'user-1',
    posterName: 'Sarah M.',
    posterRating: 4.8,
    offersCount: 5,
    status: 'open',
  },
  {
    id: '2',
    title: 'Furniture Assembly Required',
    description: 'Need help assembling IKEA furniture - 2 wardrobes and a dining table. Tools provided. Urgent completion needed.',
    budget: 3000,
    location: 'Kandy',
    category: 'assembly',
    postedDate: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    posterId: 'user-2',
    posterName: 'John D.',
    posterRating: 4.9,
    offersCount: 8,
    status: 'open',
  },
  {
    id: '3',
    title: 'Garden Landscaping Project',
    description: 'Looking for a skilled gardener to redesign my front garden. Need design ideas and implementation. Medium-sized garden.',
    budget: 15000,
    location: 'Galle',
    category: 'gardening',
    postedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    posterId: 'user-3',
    posterName: 'Priya K.',
    posterRating: 4.7,
    offersCount: 3,
    status: 'open',
  },
  {
    id: '4',
    title: 'Delivery Service Needed',
    description: 'Need to deliver packages from Colombo to Kandy. 5 medium-sized boxes. Flexible timing preferred.',
    budget: 4000,
    location: 'Colombo',
    category: 'delivery',
    postedDate: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    posterId: 'user-4',
    posterName: 'Michael R.',
    posterRating: 4.6,
    offersCount: 12,
    status: 'open',
  },
  {
    id: '5',
    title: 'Handyman for Home Repairs',
    description: 'Multiple small repairs needed: fix leaking tap, repair door handle, install curtain rods. All materials provided.',
    budget: 6000,
    location: 'Negombo',
    category: 'handyman',
    postedDate: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    posterId: 'user-5',
    posterName: 'David L.',
    posterRating: 5.0,
    offersCount: 7,
    status: 'open',
  },
  {
    id: '6',
    title: 'Interior Painting Service',
    description: 'Need to paint 2 bedrooms and living room. Walls need preparation and 2 coats of paint. Color already selected.',
    budget: 25000,
    location: 'Colombo',
    category: 'painting',
    postedDate: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    posterId: 'user-6',
    posterName: 'Emma W.',
    posterRating: 4.8,
    offersCount: 6,
    status: 'open',
  },
  {
    id: '7',
    title: 'Math Tutoring for Grade 10',
    description: 'Looking for an experienced tutor for my son. Need help with algebra and geometry. 2 sessions per week.',
    budget: 2000,
    location: 'Kandy',
    category: 'tuition',
    postedDate: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    posterId: 'user-7',
    posterName: 'Nimal S.',
    posterRating: 4.9,
    offersCount: 4,
    status: 'open',
  },
  {
    id: '8',
    title: 'Moving Service Required',
    description: 'Need help moving furniture and boxes from Colombo to Galle. 2-bedroom apartment. Truck and helpers needed.',
    budget: 12000,
    location: 'Colombo',
    category: 'removals',
    postedDate: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    posterId: 'user-8',
    posterName: 'Lisa T.',
    posterRating: 4.7,
    offersCount: 9,
    status: 'open',
  },
  {
    id: '9',
    title: 'Mobile Phone Screen Repair',
    description: 'Samsung phone screen cracked. Need professional repair service. Original parts preferred if available.',
    budget: 8000,
    location: 'Colombo',
    category: 'mobile-repair',
    postedDate: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    posterId: 'user-9',
    posterName: 'Ravi P.',
    posterRating: 4.6,
    offersCount: 11,
    status: 'open',
  },
  {
    id: '10',
    title: 'Wedding Photography Needed',
    description: 'Looking for a professional wedding photographer for an outdoor ceremony. Date: Next month. Full day coverage required.',
    budget: 35000,
    location: 'Galle',
    category: 'wedding',
    postedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    posterId: 'user-10',
    posterName: 'Anjali N.',
    posterRating: 4.9,
    offersCount: 5,
    status: 'open',
  },
];

export default function ScrollingTasksPanel({ 
  autoScroll = true, 
  scrollSpeed = 30 
}: ScrollingTasksPanelProps) {
  const [tasks] = useState<Task[]>(sampleTasks);
  const [isPaused, setIsPaused] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollAnimationRef = useRef<number | null>(null);
  const lastScrollTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (autoScroll && tasks.length > 0 && !isPaused) {
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

  return (
    <div 
      className="py-12 bg-gradient-to-b from-gray-50 to-white"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 font-geom">
            Open Tasks
          </h2>
          <p className="text-gray-600">
            Browse available tasks and submit your offers
          </p>
        </div>

        <div className="relative overflow-hidden">
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide"
            style={{
              scrollBehavior: 'auto',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {/* Duplicate tasks multiple times for seamless infinite loop */}
            {[...tasks, ...tasks, ...tasks].map((task, index) => (
              <TaskCard key={`${task.id}-${index}`} task={task} getTimeAgo={getTimeAgo} />
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

function TaskCard({ task, getTimeAgo }: { task: Task; getTimeAgo: (date: Date) => string }) {
  return (
    <Link 
      href={`/browse-tasks?task=${task.id}`}
      className="flex-shrink-0 w-80 bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden group border border-gray-200"
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
    </Link>
  );
}

