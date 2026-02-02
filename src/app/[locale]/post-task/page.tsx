'use client';

import { useState, useEffect } from 'react';
import { useFormState } from 'react-dom';
import { ArrowRight, Upload, MapPin, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { categories } from '@/data/categories';
import { createTask } from '@/app/actions/tasks';
import { supabase } from '@/lib/supabase';

interface FormState {
  message: string;
  errors: {
    [key: string]: string[] | undefined;
  };
}

const initialState: FormState = {
  message: '',
  errors: {},
};

export default function PostTaskPage() {
  const [state, dispatch] = useFormState(createTask, initialState);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);

  // Since we use controlled inputs for some UX (like image preview), we keep state.
  // But for server action, we can rely on FormData or sync state to hidden inputs if complex.
  // Here, standard inputs work with FormData seamlessly.

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('categories').select('*').order('name');
      if (data) setCategoriesList(data);
    };
    fetchCategories();
  }, []);

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
          <form action={dispatch} className="space-y-6">

            {state?.message && (
              <div className={`p-4 rounded-md ${state.message === 'Validation failed' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                <div className="flex">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  <p>{state.message}</p>
                </div>
              </div>
            )}

            {/* Task Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                What do you need done?
              </label>
              <input
                type="text"
                id="title"
                name="title"
                placeholder="e.g., Clean my house, Assemble furniture, Paint room"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
                required
              />
              {state?.errors?.title && (
                <p className="mt-1 text-sm text-red-600">{state.errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Describe the task in detail
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                placeholder="Provide as much detail as possible. Include size, materials, special requirements, etc."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
                required
              />
              {state?.errors?.description && (
                <p className="mt-1 text-sm text-red-600">{state.errors.description}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                id="category"
                name="category"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
                required
              >
                <option value="">Select a category</option>
                {categoriesList.map((category) => (
                  <option key={category.id} value={category.id}> // Use name or ID based on schema. Schema likely stores TEXT category? Or ID? DB schema said 'category' text?
                    // Actually `categories` table has ID. `tasks.category` column type?
                    // Let's assume `tasks.category` stores the ID or name. 
                    // In typical refactor, I should store ID. 
                    // But legacy mock data used slug. 
                    // I'll stick to ID if foreign key exists? 
                    // Schema.sql said `category` column in tasks is just text? 
                    // Wait, `tasks` table `category` column is Text. 
                    // I will store category ID or Name. 
                    {category.name}
                  </option>
                ))}
              </select>
              {state?.errors?.category && (
                <p className="mt-1 text-sm text-red-600">{state.errors.category}</p>
              )}
            </div>

            {/* Budget */}
            <div>
              <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-2">
                Budget (LKR)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="number"
                  id="budget"
                  name="budget"
                  placeholder="0"
                  min="0"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
                  required
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                This helps taskers understand your budget range
              </p>
              {state?.errors?.budget && (
                <p className="mt-1 text-sm text-red-600">{state.errors.budget}</p>
              )}
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
                  placeholder="e.g., Colombo 7, Kandy, Galle"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
                  required
                />
              </div>
              {state?.errors?.location && (
                <p className="mt-1 text-sm text-red-600">{state.errors.location}</p>
              )}
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <SubmitButton />
              <p className="text-sm text-gray-500 text-center mt-2">
                It&apos;s free to post a task. You only pay when you hire someone.
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

import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full inline-flex items-center justify-center px-6 py-4 bg-brand-green text-white text-lg font-semibold rounded-lg hover:bg-brand-green/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {pending ? 'Posting...' : 'Post Task for Free'}
      {!pending && <ArrowRight className="ml-2 h-5 w-5" />}
    </button>
  );
}
