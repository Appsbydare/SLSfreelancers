'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { FileText, DollarSign, MapPin, Clock, Search, Filter } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getFilteredTasks, getCategories, TasksFilter } from '@/app/actions/requests';

export default function SellerRequestsPage() {
  const router = useRouter();
  const locale = useLocale();
  const { user, isLoading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [filters, setFilters] = useState<TasksFilter>({
    category: 'All',
    location: '',
    search: '',
  });

  // Debounce search could be added here

  const loadData = useCallback(async () => {
    if (authLoading) return;
    // Optional: Redirect if not tasker?
    // if (!user) router.push(...);

    try {
      setLoading(true);
      const [tasksData, catsData] = await Promise.all([
        getFilteredTasks(filters),
        getCategories()
      ]);

      setRequests(tasksData || []);
      if (catsData) setCategories(catsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [authLoading, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (key: keyof TasksFilter, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white border-b border-gray-200 mb-8">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Custom Requests</h1>
          <p className="text-gray-600 mt-2">Browse and bid on custom project requests from clients.</p>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <Filter className="h-4 w-4 mr-2" /> Filters
                </h3>
                <button
                  onClick={() => setFilters({ category: 'All', location: '', search: '' })}
                  className="text-xs text-brand-green hover:underline"
                >
                  Reset
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      className="pl-9 w-full rounded-md border-gray-300 shadow-sm focus:border-brand-green focus:ring-brand-green sm:text-sm py-2"
                      placeholder="Keywords..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-green focus:ring-brand-green sm:text-sm py-2"
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                  >
                    <option value="All">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      className="pl-9 w-full rounded-md border-gray-300 shadow-sm focus:border-brand-green focus:ring-brand-green sm:text-sm py-2"
                      placeholder="City or District"
                      value={filters.location}
                      onChange={(e) => handleFilterChange('location', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results List */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
                <p className="text-gray-500">Loading requests...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-100">
                <FileText className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No requests found</h3>
                <p className="text-gray-500">Try adjusting your filters or check back later.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <Link
                    key={request.id}
                    href={`/${locale}/seller/dashboard/tasks/${request.id}`}
                    className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100 hover:border-brand-green/30 group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {request.category}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(request.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-brand-green transition-colors">
                          {request.title}
                        </h3>
                        <p className="text-gray-600 mb-4 line-clamp-2 text-sm">{request.description}</p>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <div className="flex items-center bg-green-50 text-green-700 px-2 py-1 rounded">
                            <DollarSign className="h-4 w-4 mr-1" />
                            <span className="font-semibold">LKR {request.budget?.toLocaleString() || 'Negotiable'}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                            <span>{request.location}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 sm:mt-0 sm:ml-6 flex items-center sm:flex-col sm:items-end justify-between">
                        <div className="text-sm text-gray-500 mb-2 hidden sm:block">
                          {request.offers_count || 0} Bid{(request.offers_count || 0) !== 1 ? 's' : ''}
                        </div>
                        <span className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-green hover:bg-brand-green/90 focus:outline-none">
                          View Details
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
                <p className="text-center text-xs text-gray-400 mt-6">
                  Showing top {requests.length} results
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div >
  );
}

