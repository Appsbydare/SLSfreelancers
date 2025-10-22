'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Filter, MapPin, Clock, DollarSign } from 'lucide-react';
import { categories } from '@/data/categories';
import { formatCurrency } from '@/lib/utils';

// Mock data for tasks
const mockTasks = [
  {
    id: '1',
    title: 'Home Cleaning Service',
    description: 'Need a thorough cleaning of my 3-bedroom house in Colombo 7. Includes kitchen, bathrooms, and living areas.',
    budget: 5000,
    location: 'Colombo 7',
    category: 'cleaning',
    postedDate: new Date('2024-01-20'),
    deadline: new Date('2024-01-25'),
    posterName: 'Sarah J.',
    posterRating: 4.8,
    offersCount: 12,
    status: 'open' as const,
  },
  {
    id: '2',
    title: 'Furniture Assembly',
    description: 'Need help assembling IKEA furniture - bed frame, wardrobe, and desk.',
    budget: 3000,
    location: 'Kandy',
    category: 'assembly',
    postedDate: new Date('2024-01-19'),
    posterName: 'Michael R.',
    posterRating: 4.9,
    offersCount: 8,
    status: 'open' as const,
  },
  {
    id: '3',
    title: 'Garden Landscaping',
    description: 'Transform my backyard with new plants, pathway, and small water feature.',
    budget: 15000,
    location: 'Galle',
    category: 'gardening',
    postedDate: new Date('2024-01-18'),
    posterName: 'Priya L.',
    posterRating: 4.7,
    offersCount: 15,
    status: 'open' as const,
  },
  {
    id: '4',
    title: 'Delivery Service',
    description: 'Need to deliver documents from Colombo to Kandy urgently.',
    budget: 2500,
    location: 'Colombo to Kandy',
    category: 'delivery',
    postedDate: new Date('2024-01-17'),
    posterName: 'David K.',
    posterRating: 4.6,
    offersCount: 6,
    status: 'open' as const,
  },
  {
    id: '5',
    title: 'Painting Service',
    description: 'Paint two bedrooms and living room. Walls need primer and two coats.',
    budget: 8000,
    location: 'Negombo',
    category: 'painting',
    postedDate: new Date('2024-01-16'),
    posterName: 'Nimal S.',
    posterRating: 4.5,
    offersCount: 10,
    status: 'open' as const,
  },
];

export default function BrowseTasksPage() {
  const t = useTranslations('navigation');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const filteredTasks = mockTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || task.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (sortBy) {
      case 'budget-high':
        return b.budget - a.budget;
      case 'budget-low':
        return a.budget - b.budget;
      case 'newest':
      default:
        return b.postedDate.getTime() - a.postedDate.getTime();
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('browseTasks')}
          </h1>
          <p className="text-gray-600">
            Find tasks that match your skills and start earning today.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="budget-high">Budget: High to Low</option>
                <option value="budget-low">Budget: Low to High</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mb-4">
          <p className="text-gray-600">
            Showing {sortedTasks.length} task{sortedTasks.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Task Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sortedTasks.map((task) => (
            <div key={task.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                    {task.title}
                  </h3>
                  <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(task.budget)}
                  </span>
                </div>

                <p className="text-gray-600 mb-4 line-clamp-2">
                  {task.description}
                </p>

                <div className="flex items-center text-sm text-gray-500 mb-4 space-x-4">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {task.location}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {task.postedDate.toLocaleDateString()}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-2">
                      <span className="text-sm font-medium text-gray-600">
                        {task.posterName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{task.posterName}</p>
                      <div className="flex items-center">
                        <span className="text-yellow-400">★</span>
                        <span className="text-sm text-gray-600 ml-1">{task.posterRating}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-gray-600">{task.offersCount} offers</p>
                    <button className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                      Make Offer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {sortedTasks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-600">
              Try adjusting your search criteria or check back later for new tasks.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
