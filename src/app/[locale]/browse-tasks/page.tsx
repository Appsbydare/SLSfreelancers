'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, MapPin, Clock, DollarSign } from 'lucide-react';
// import { categories } from '@/data/categories'; // Still useful for filter dropdown, but we should fetch from DB ideally or keep static for now if unchanged
import { formatCurrency } from '@/lib/utils';
import { districts, District, City } from '@/data/districts';
import { useDistrict } from '@/contexts/DistrictContext';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function BrowseTasksPage() {
  const locale = useLocale();
  const t = useTranslations();
  const { selectedDistrict, setSelectedDistrict } = useDistrict();
  const searchParams = useSearchParams();

  // State
  const [tasks, setTasks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]); // Fetch from DB
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');
  const [selectedCityId, setSelectedCityId] = useState<string>('');
  const [sortBy, setSortBy] = useState('newest');
  const [taskerType, setTaskerType] = useState<string>('all');

  // Sync filters from URL/Context
  useEffect(() => {
    if (selectedDistrict) {
      setSelectedDistrictId(selectedDistrict.id);
      setSelectedCityId('');
    }
  }, [selectedDistrict]);

  useEffect(() => {
    const cat = searchParams?.get('category');
    if (cat) setSelectedCategory(cat);

    const svc = searchParams?.get('service');
    if (svc) setSearchTerm(svc);
  }, [searchParams]);

  // Fetch Categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (data) setCategories(data);
    };
    fetchCategories();
  }, []);

  // Fetch Tasks
  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          customers!inner (
            users (
              first_name,
              last_name,
              profile_image_url
            )
          ),
          offers (count)
        `)
        .eq('status', 'open');

      if (searchTerm) {
        // Simple OR search on title and description
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }

      if (selectedDistrictId) {
        // Assuming location column stores somewhat structured data or we filter by text
        // Ideally schema has district_id. For now, text search on location
        const dist = districts.find(d => d.id === selectedDistrictId)?.name;
        if (dist) {
          query = query.ilike('location', `%${dist}%`);
        }
      }

      // Sorting
      switch (sortBy) {
        case 'budget-high':
          query = query.order('budget', { ascending: false });
          break;
        case 'budget-low':
          query = query.order('budget', { ascending: true });
          break;
        case 'newest':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching tasks:', error);
      } else {
        setTasks(data || []);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedCategory, selectedDistrictId, sortBy]); // Removed dependencies that might cause loop if not careful, using manual debouncing logic is better, but this is simple

  // Trigger fetch when filters change
  // Use debounce for search term could be good, but for now simple effect
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTasks();
    }, 500); // 500ms debounce
    return () => clearTimeout(timer);
  }, [fetchTasks]);


  // Helpers
  const selectedDistrictObj = districts.find(d => d.id === selectedDistrictId);
  const availableCities = selectedDistrictObj?.cities || [];

  const getDistrictName = (district: District) => {
    switch (locale) {
      case 'si': return district.nameSi;
      case 'ta': return district.nameTa;
      default: return district.name;
    }
  };

  const getCityName = (city: City) => {
    switch (locale) {
      case 'si': return city.nameSi;
      case 'ta': return city.nameTa;
      default: return city.name;
    }
  };

  const handleDistrictChange = (districtId: string) => {
    setSelectedDistrictId(districtId);
    setSelectedCityId('');
    const district = districts.find(d => d.id === districtId);
    if (district) {
      setSelectedDistrict(district);
    } else {
      setSelectedDistrict(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-24 pt-4 pb-6">

        {/* Top Filters */}
        <div className="bg-white rounded-md shadow-sm border border-gray-200 p-4 mb-6">
          {/* Search Bar Row */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search tasks by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Category */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full h-10 text-sm px-3 border border-gray-300 rounded-md focus:ring-1 focus:ring-brand-green focus:border-brand-green"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}> // Assuming DB uses 'id' or 'slug'
                  {/* We might need to handle localization here if we want perfect polish, but name is reliable */}
                  {category.name}
                </option>
              ))}
            </select>
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full h-10 text-sm px-3 border border-gray-300 rounded-md focus:ring-1 focus:ring-brand-green focus:border-brand-green"
            >
              <option value="newest">Newest First</option>
              <option value="budget-high">Budget: High to Low</option>
              <option value="budget-low">Budget: Low to High</option>
            </select>

            {/* District */}
            <select
              value={selectedDistrictId}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="w-full h-10 text-sm px-3 border border-gray-300 rounded-md focus:ring-1 focus:ring-brand-green focus:border-brand-green"
            >
              <option value="">All Districts</option>
              {districts.map((district) => (
                <option key={district.id} value={district.id}>
                  {getDistrictName(district)}
                </option>
              ))}
            </select>

            {/* City (Optional - just visual for now if we don't have City in DB) */}
            <select
              value={selectedCityId}
              onChange={(e) => setSelectedCityId(e.target.value)}
              disabled={!selectedDistrictId}
              className="w-full h-10 text-sm px-3 border border-gray-300 rounded-md focus:ring-1 focus:ring-brand-green focus:border-brand-green disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">All Cities</option>
              {availableCities.map((city) => (
                <option key={city.id} value={city.id}>
                  {getCityName(city)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Info */}
        <div className="mb-4">
          {isLoading ? (
            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <p className="text-gray-600">
              Showing {tasks.length} task{tasks.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Task Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isLoading ? (
            // Skeletons
            [...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))
          ) : (
            tasks.map((task) => {
              // Safe accessors
              const posterName = task.customers?.users?.first_name || 'Unknown User';
              const posterInitial = posterName.charAt(0);
              const offersCount = task.offers?.[0]?.count || 0;
              const formattedDate = new Date(task.created_at).toLocaleDateString();

              return (
                <div key={task.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                        {task.title}
                      </h3>
                      <span className="text-lg font-bold text-brand-green">
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
                        {formattedDate}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        {task.customers?.users?.profile_image_url ? (
                          <img
                            src={task.customers.users.profile_image_url}
                            alt={posterName}
                            className="w-8 h-8 rounded-full mr-2 object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-2">
                            <span className="text-sm font-medium text-gray-600">
                              {posterInitial}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{posterName}</p>
                          <div className="flex items-center">
                            <span className="text-yellow-400">★</span>
                            <span className="text-sm text-gray-600 ml-1">5.0</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-gray-600">{offersCount} offers</p>
                        <button className="mt-2 px-4 py-2 bg-brand-green text-white text-sm font-medium rounded-lg hover:bg-brand-green/90 transition-colors">
                          Make Offer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {!isLoading && tasks.length === 0 && (
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
