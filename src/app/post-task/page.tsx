'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Upload, MapPin, Calendar, DollarSign } from 'lucide-react';
import { categories } from '@/data/categories';
import { uploadFile } from '@/lib/supabase-storage';

export default function PostTaskPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    budgetMin: '',
    budgetMax: '',
    location: '',
    city: '',
    district: '',
    deadline: '',
    images: [] as File[],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Get customer ID from session/auth (for now, using a demo user)
      // TODO: Replace with actual authenticated user ID
      const customerId = sessionStorage.getItem('userId') || 'demo-customer-id';

      // Upload images if any
      const imageUrls: string[] = [];
      for (const file of formData.images) {
        const result = await uploadFile(file, 'tasks', customerId);
        if (result.success && result.url) {
          imageUrls.push(result.url);
        }
      }

      // Parse location to extract city and district
      const locationParts = formData.location.split(',').map(s => s.trim());
      const city = locationParts[0] || formData.location;
      const district = locationParts[1] || locationParts[0] || formData.location;

      // Create task via API
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          location: formData.location,
          city,
          district,
          budgetMin: parseFloat(formData.budgetMin) || 0,
          budgetMax: parseFloat(formData.budgetMax) || parseFloat(formData.budgetMin) || 0,
          scheduledDate: formData.deadline || null,
          images: imageUrls,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert('Task posted successfully! Task ID: ' + data.task.id);
        router.push('/browse-tasks');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to post task');
      }
    } catch (err) {
      console.error('Error posting task:', err);
      setError('Failed to post task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Post a Task
          </h1>
          <p className="text-gray-600">
            Describe what you need done and get quotes from skilled professionals.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Task Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                What do you need done?
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Clean my house, Assemble furniture, Paint room"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Describe the task in detail
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Provide as much detail as possible. Include size, materials, special requirements, etc."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Budget Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget Range (LKR)
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="number"
                    name="budgetMin"
                    value={formData.budgetMin}
                    onChange={handleInputChange}
                    placeholder="Min"
                    min="0"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
                    required
                  />
                </div>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="number"
                    name="budgetMax"
                    value={formData.budgetMax}
                    onChange={handleInputChange}
                    placeholder="Max"
                    min="0"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                This helps taskers understand your budget range
              </p>
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g., Colombo 7, Kandy, Galle"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Deadline */}
            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
                When do you need this done?
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="date"
                  id="deadline"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
                />
              </div>
            </div>

            {/* Images */}
            <div>
              <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-2">
                Photos (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Upload photos to help taskers understand your needs
                </p>
                <input
                  type="file"
                  id="images"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label
                  htmlFor="images"
                  className="inline-flex items-center px-4 py-2 bg-brand-green text-white text-sm font-medium rounded-lg hover:bg-brand-green/90 cursor-pointer"
                >
                  Choose Files
                </label>
              </div>
              {formData.images.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">
                    {formData.images.length} file(s) selected
                  </p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center px-6 py-4 bg-brand-green text-white text-lg font-semibold rounded-lg hover:bg-brand-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Posting Task...' : 'Post Task for Free'}
                {!isLoading && <ArrowRight className="ml-2 h-5 w-5" />}
              </button>
              <p className="text-sm text-gray-500 text-center mt-2">
                It's free to post a task. You only pay when you hire someone.
              </p>
            </div>
          </form>
        </div>

        {/* Tips */}
        <div className="mt-8 bg-brand-green/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-brand-green mb-3">
            Tips for getting the best results:
          </h3>
          <ul className="space-y-2 text-brand-green">
            <li>• Be specific about what you need done</li>
            <li>• Include measurements, materials, or special requirements</li>
            <li>• Set a realistic budget to attract quality taskers</li>
            <li>• Upload photos to help taskers understand the scope</li>
            <li>• Be available to answer questions from interested taskers</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
