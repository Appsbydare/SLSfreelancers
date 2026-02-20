'use client';

import { useState, useEffect, useActionState } from 'react';
import { ArrowRight, DollarSign, MapPin, Calendar, AlertCircle } from 'lucide-react';
import { updateTask } from '@/app/actions/tasks';
import { categories } from '@/data/categories';
import { useFormStatus } from 'react-dom';

interface EditTaskFormProps {
    task: any;
}

const initialState = {
    message: '',
    errors: {} as any,
};

export default function EditTaskForm({ task }: EditTaskFormProps) {
    const [state, dispatch] = useActionState(updateTask, initialState);
    const [categoriesList, setCategoriesList] = useState<any[]>([]);

    useEffect(() => {
        // Reuse categories logic or assume static list if small
        const fetchCategories = async () => {
            try {
                const response = await fetch('/api/categories');
                const { categories } = await response.json();
                if (categories) setCategoriesList(categories);
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };
        fetchCategories();
    }, []);

    // Format date for input
    const deadlineDate = task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '';

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Edit Task
                    </h1>
                    <p className="text-gray-600">
                        Update your task details
                    </p>
                </div>

                {/* Form */}
                <div className="bg-white rounded-lg shadow-sm border p-8">
                    <form action={dispatch} className="space-y-6">
                        <input type="hidden" name="taskId" value={task.id} />

                        {state?.message && (
                            <div className={`p-4 rounded-md ${state.message.startsWith('Database') || state.message === 'Validation failed' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
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
                                defaultValue={task.title}
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
                                defaultValue={task.description}
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
                                defaultValue={task.category}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
                                required
                            >
                                <option value="">Select a category</option>
                                {(categoriesList.length > 0 ? categoriesList : categories).map((category: any) => (
                                    <option key={category.id} value={category.id}>
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
                                    defaultValue={task.budget}
                                    placeholder="0"
                                    min="0"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
                                    required
                                />
                            </div>
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
                                    defaultValue={task.location}
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
                                    defaultValue={deadlineDate}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-6">
                            <SubmitButton />
                            <p className="text-sm text-gray-500 text-center mt-2">
                                Changes are saved immediately.
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full inline-flex items-center justify-center px-6 py-4 bg-brand-green text-white text-lg font-semibold rounded-lg hover:bg-brand-green/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
            {pending ? 'Saving...' : 'Save Changes'}
            {!pending && <ArrowRight className="ml-2 h-5 w-5" />}
        </button>
    );
}
