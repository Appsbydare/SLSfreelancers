'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Upload, X, AlertCircle } from 'lucide-react';
import { categories } from '@/data/categories';
import { uploadFile } from '@/lib/supabase-storage';

const STEPS = [
  { id: 1, name: 'Overview', description: 'Basic information' },
  { id: 2, name: 'Pricing', description: 'Packages & pricing' },
  { id: 3, name: 'Description', description: 'Details & gallery' },
  { id: 4, name: 'Requirements', description: 'Buyer requirements' },
  { id: 5, name: 'Publish', description: 'Review & publish' },
];

export default function CreateGigPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    subcategory: '',
    tags: [] as string[],
    deliveryType: 'service' as 'digital' | 'physical' | 'service',
    description: '',
    images: [] as File[],
    imageUrls: [] as string[],
    packages: {
      basic: { name: 'Basic', description: '', price: '', deliveryDays: '', revisions: '', features: [''] },
      standard: { name: 'Standard', description: '', price: '', deliveryDays: '', revisions: '', features: [''] },
      premium: { name: 'Premium', description: '', price: '', deliveryDays: '', revisions: '', features: [''] },
    },
    requirements: [] as Array<{ question: string; answerType: string; options?: string[]; isRequired: boolean }>,
  });

  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Check authentication
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login?redirect=/seller/gigs/create');
      return;
    }
    
    const userData = JSON.parse(userStr);
    if (userData.userType !== 'tasker') {
      router.push('/');
      return;
    }
    
    setUser(userData);
  }, []);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.title.trim()) newErrors.title = 'Title is required';
      if (formData.title.length < 10) newErrors.title = 'Title must be at least 10 characters';
      if (!formData.category) newErrors.category = 'Category is required';
    } else if (step === 2) {
      if (!formData.packages.basic.price || parseFloat(formData.packages.basic.price) < 100) {
        newErrors['basic.price'] = 'Basic package price must be at least LKR 100';
      }
      if (!formData.packages.basic.deliveryDays || parseInt(formData.packages.basic.deliveryDays) < 1) {
        newErrors['basic.deliveryDays'] = 'Delivery days must be at least 1';
      }
    } else if (step === 3) {
      if (!formData.description.trim()) newErrors.description = 'Description is required';
      if (formData.description.length < 50) newErrors.description = 'Description must be at least 50 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 5 - formData.images.length);
      setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && formData.tags.length < 10) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  const addFeature = (tier: 'basic' | 'standard' | 'premium') => {
    setFormData(prev => ({
      ...prev,
      packages: {
        ...prev.packages,
        [tier]: {
          ...prev.packages[tier],
          features: [...prev.packages[tier].features, ''],
        },
      },
    }));
  };

  const updateFeature = (tier: 'basic' | 'standard' | 'premium', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      packages: {
        ...prev.packages,
        [tier]: {
          ...prev.packages[tier],
          features: prev.packages[tier].features.map((f, i) => i === index ? value : f),
        },
      },
    }));
  };

  const removeFeature = (tier: 'basic' | 'standard' | 'premium', index: number) => {
    setFormData(prev => ({
      ...prev,
      packages: {
        ...prev.packages,
        [tier]: {
          ...prev.packages[tier],
          features: prev.packages[tier].features.filter((_, i) => i !== index),
        },
      },
    }));
  };

  const addRequirement = () => {
    setFormData(prev => ({
      ...prev,
      requirements: [
        ...prev.requirements,
        { question: '', answerType: 'text', isRequired: true },
      ],
    }));
  };

  const updateRequirement = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.map((req, i) =>
        i === index ? { ...req, [field]: value } : req
      ),
    }));
  };

  const removeRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index),
    }));
  };

  const handlePublish = async () => {
    if (!validateStep(3)) return;

    setLoading(true);
    setError('');

    try {
      // Upload images
      const uploadedImages: string[] = [];
      for (const file of formData.images) {
        const result = await uploadFile(file, 'gigs', user.id);
        if (result.success && result.url) {
          uploadedImages.push(result.url);
        }
      }

      // Create gig
      const gigResponse = await fetch('/api/gigs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          subcategory: formData.subcategory || null,
          tags: formData.tags,
          images: uploadedImages,
          deliveryType: formData.deliveryType,
        }),
      });

      if (!gigResponse.ok) throw new Error('Failed to create gig');

      const { gig } = await gigResponse.json();

      // Create packages
      const packagesToCreate = ['basic', 'standard', 'premium']
        .filter(tier => formData.packages[tier as keyof typeof formData.packages].price)
        .map((tier) => {
          const pkg = formData.packages[tier as keyof typeof formData.packages];
          return {
            tier,
            name: pkg.name,
            description: pkg.description,
            price: parseFloat(pkg.price),
            deliveryDays: parseInt(pkg.deliveryDays),
            revisions: pkg.revisions === 'unlimited' ? null : parseInt(pkg.revisions),
            features: pkg.features.filter(f => f.trim()),
          };
        });

      const packagesResponse = await fetch(`/api/gigs/${gig.id}/packages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          packages: packagesToCreate,
        }),
      });

      if (!packagesResponse.ok) throw new Error('Failed to create packages');

      // Create requirements if any
      if (formData.requirements.length > 0) {
        const reqsResponse = await fetch(`/api/gigs/${gig.id}/requirements`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            requirements: formData.requirements.map((req, index) => ({
              question: req.question,
              answerType: req.answerType,
              options: req.options,
              isRequired: req.isRequired,
              sortOrder: index,
            })),
          }),
        });

        if (!reqsResponse.ok) throw new Error('Failed to create requirements');
      }

      // Publish the gig by updating status
      await fetch(`/api/gigs/${gig.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          status: 'active',
        }),
      });

      // Redirect to gig page
      router.push(`/gigs/${gig.slug}?new=true`);
    } catch (err: any) {
      console.error('Publish error:', err);
      setError(err.message || 'Failed to publish gig');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create a New Gig</h1>

          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex-1 relative">
                <div className="flex items-center">
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      currentStep > step.id
                        ? 'bg-brand-green border-brand-green text-white'
                        : currentStep === step.id
                        ? 'border-brand-green text-brand-green'
                        : 'border-gray-300 text-gray-400'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <div className="ml-3 hidden md:block">
                    <p className={`text-sm font-medium ${
                      currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {step.name}
                    </p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`absolute top-5 left-10 right-0 h-0.5 ${
                      currentStep > step.id ? 'bg-brand-green' : 'bg-gray-300'
                    }`}
                    style={{ width: 'calc(100% - 2.5rem)' }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-8">
          {/* Step 1: Overview */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Gig Overview</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gig Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="I will..."
                  maxLength={80}
                  className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.title}
                  </p>
                )}
                <p className="mt-1 text-sm text-gray-500">{formData.title.length}/80 characters</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green ${
                      errors.category ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Type
                  </label>
                  <select
                    value={formData.deliveryType}
                    onChange={(e) => setFormData(prev => ({ ...prev, deliveryType: e.target.value as any }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green"
                  >
                    <option value="service">Service</option>
                    <option value="digital">Digital</option>
                    <option value="physical">Physical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (helps buyers find your gig)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add a tag and press Enter"
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    disabled={formData.tags.length >= 10}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 bg-brand-green/10 text-brand-green rounded-full text-sm"
                    >
                      #{tag}
                      <button
                        onClick={() => removeTag(index)}
                        className="ml-2 text-brand-green hover:text-brand-green/70"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Pricing */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Pricing & Packages</h2>
              <p className="text-gray-600">Create up to 3 package tiers for your gig. At least Basic package is required.</p>

              {(['basic', 'standard', 'premium'] as const).map((tier) => (
                <div key={tier} className="border border-gray-300 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 capitalize mb-4">{tier} Package {tier === 'basic' && '*'}</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price (LKR) *
                      </label>
                      <input
                        type="number"
                        value={formData.packages[tier].price}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          packages: {
                            ...prev.packages,
                            [tier]: { ...prev.packages[tier], price: e.target.value },
                          },
                        }))}
                        placeholder="1000"
                        min="100"
                        className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green ${
                          errors[`${tier}.price`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors[`${tier}.price`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`${tier}.price`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Delivery Time (days) *
                      </label>
                      <input
                        type="number"
                        value={formData.packages[tier].deliveryDays}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          packages: {
                            ...prev.packages,
                            [tier]: { ...prev.packages[tier], deliveryDays: e.target.value },
                          },
                        }))}
                        placeholder="3"
                        min="1"
                        className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green ${
                          errors[`${tier}.deliveryDays`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Revisions
                    </label>
                    <select
                      value={formData.packages[tier].revisions}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        packages: {
                          ...prev.packages,
                          [tier]: { ...prev.packages[tier], revisions: e.target.value },
                        },
                      }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green"
                    >
                      <option value="0">0 revisions</option>
                      <option value="1">1 revision</option>
                      <option value="2">2 revisions</option>
                      <option value="3">3 revisions</option>
                      <option value="5">5 revisions</option>
                      <option value="unlimited">Unlimited revisions</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Features
                    </label>
                    {formData.packages[tier].features.map((feature, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) => updateFeature(tier, index, e.target.value)}
                          placeholder="Enter a feature"
                          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green"
                        />
                        {formData.packages[tier].features.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeFeature(tier, index)}
                            className="p-2 text-red-500 hover:text-red-700"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addFeature(tier)}
                      className="text-sm text-brand-green hover:underline"
                    >
                      + Add feature
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 3: Description & Gallery */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Description & Gallery</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={8}
                  placeholder="Describe your service in detail..."
                  className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">{formData.description.length} characters (minimum 50)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gig Images (up to 5)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    id="image-upload"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Click to upload images</p>
                  </label>
                </div>

                {formData.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-4 mt-4">
                    {formData.images.map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Requirements */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Buyer Requirements (Optional)</h2>
              <p className="text-gray-600">Get the information you need from buyers to complete their order.</p>

              {formData.requirements.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No requirements added yet</p>
                  <button
                    type="button"
                    onClick={addRequirement}
                    className="px-6 py-3 bg-brand-green text-white rounded-lg hover:bg-brand-green/90 font-semibold"
                  >
                    Add First Requirement
                  </button>
                </div>
              ) : (
                <>
                  {formData.requirements.map((req, index) => (
                    <div key={index} className="border border-gray-300 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-semibold text-gray-900">Requirement #{index + 1}</h4>
                        <button
                          onClick={() => removeRequirement(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Question
                          </label>
                          <input
                            type="text"
                            value={req.question}
                            onChange={(e) => updateRequirement(index, 'question', e.target.value)}
                            placeholder="What do you want to ask the buyer?"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Answer Type
                            </label>
                            <select
                              value={req.answerType}
                              onChange={(e) => updateRequirement(index, 'answerType', e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green"
                            >
                              <option value="text">Text</option>
                              <option value="choice">Multiple Choice</option>
                              <option value="file">File Upload</option>
                            </select>
                          </div>

                          <div className="flex items-center">
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={req.isRequired}
                                onChange={(e) => updateRequirement(index, 'isRequired', e.target.checked)}
                                className="h-4 w-4 text-brand-green focus:ring-brand-green border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-700">Required</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addRequirement}
                    className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-brand-green hover:text-brand-green"
                  >
                    + Add Another Requirement
                  </button>
                </>
              )}
            </div>
          )}

          {/* Step 5: Review & Publish */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Review & Publish</h2>
              
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Title</h4>
                  <p className="text-gray-700">{formData.title}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Category</h4>
                  <p className="text-gray-700">{formData.category}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Packages</h4>
                  <div className="space-y-2">
                    {(['basic', 'standard', 'premium'] as const).map((tier) =>
                      formData.packages[tier].price ? (
                        <div key={tier} className="flex justify-between">
                          <span className="capitalize">{tier}</span>
                          <span>LKR {formData.packages[tier].price} - {formData.packages[tier].deliveryDays} days</span>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Images</h4>
                  <p className="text-gray-700">{formData.images.length} image(s) uploaded</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Requirements</h4>
                  <p className="text-gray-700">{formData.requirements.length} requirement(s)</p>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              <button
                onClick={handlePublish}
                disabled={loading}
                className="w-full bg-brand-green text-white py-4 px-6 rounded-lg hover:bg-brand-green/90 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Publishing...' : 'Publish Gig'}
              </button>
            </div>
          )}

          {/* Navigation Buttons */}
          {currentStep < 5 && (
            <div className="flex justify-between mt-8 pt-8 border-t border-gray-200">
              <button
                onClick={handleBack}
                disabled={currentStep === 1}
                className="flex items-center px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back
              </button>

              <button
                onClick={handleNext}
                className="flex items-center px-6 py-3 bg-brand-green text-white rounded-lg hover:bg-brand-green/90 font-semibold"
              >
                Continue
                <ArrowRight className="h-5 w-5 ml-2" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

