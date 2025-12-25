'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Plus, X, MapPin, DollarSign } from 'lucide-react';
import Image from 'next/image';
import FileUpload from '@/components/FileUpload';
import { uploadFile, validateImageFile } from '@/lib/supabase-storage';
import { showToast } from '@/lib/toast';

const CATEGORIES = [
  'Cleaning',
  'Handyman',
  'Plumbing',
  'Electrical',
  'Painting',
  'Gardening',
  'Moving',
  'Assembly',
  'IT Support',
  'Photography',
  'Tutoring',
  'Pet Care',
  'Beauty & Wellness',
  'Event Help',
  'Delivery',
  'Other',
];

const DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Monaragala', 'Ratnapura', 'Kegalle',
];

export default function TaskerStage3Page() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [formData, setFormData] = useState({
    bio: '',
    categories: [] as string[],
    skills: [] as string[],
    skillInput: '',
    serviceAreas: [] as string[],
    hourlyRate: '',
    portfolioFiles: [] as File[],
    profileImageFiles: [] as File[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const verifiedId = sessionStorage.getItem('verifiedTaskerId');
    
    if (!verifiedId) {
      router.push('/tasker/onboarding/stage-1');
      return;
    }
    
    setUserId(verifiedId);
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => {
      const categories = prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category];
      
      return { ...prev, categories };
    });

    if (errors.categories) {
      setErrors(prev => ({ ...prev, categories: '' }));
    }
  };

  const handleServiceAreaToggle = (district: string) => {
    setFormData(prev => {
      const serviceAreas = prev.serviceAreas.includes(district)
        ? prev.serviceAreas.filter(d => d !== district)
        : [...prev.serviceAreas, district];
      
      return { ...prev, serviceAreas };
    });

    if (errors.serviceAreas) {
      setErrors(prev => ({ ...prev, serviceAreas: '' }));
    }
  };

  const handleAddSkill = () => {
    if (!formData.skillInput.trim()) return;

    if (formData.skills.includes(formData.skillInput.trim())) {
      setErrors(prev => ({ ...prev, skillInput: 'Skill already added' }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      skills: [...prev.skills, prev.skillInput.trim()],
      skillInput: '',
    }));

    if (errors.skills) {
      setErrors(prev => ({ ...prev, skills: '' }));
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill),
    }));
  };

  const handleFileChange = (field: 'portfolioFiles' | 'profileImageFiles', files: File[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: files,
    }));

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.bio.trim()) {
      newErrors.bio = 'Bio is required';
    } else if (formData.bio.trim().length < 50) {
      newErrors.bio = 'Bio must be at least 50 characters';
    }

    if (formData.categories.length === 0) {
      newErrors.categories = 'Please select at least one category';
    }

    if (formData.skills.length === 0) {
      newErrors.skills = 'Please add at least one skill';
    }

    if (formData.serviceAreas.length === 0) {
      newErrors.serviceAreas = 'Please select at least one service area';
    }

    if (!formData.hourlyRate) {
      newErrors.hourlyRate = 'Hourly rate is required';
    } else if (parseFloat(formData.hourlyRate) < 100) {
      newErrors.hourlyRate = 'Hourly rate must be at least LKR 100';
    }

    if (formData.profileImageFiles.length === 0) {
      newErrors.profileImageFiles = 'Profile image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Upload profile image
      const profileImageResult = await uploadFile(
        formData.profileImageFiles[0],
        'profiles',
        userId
      );

      if (!profileImageResult.success) {
        throw new Error('Failed to upload profile image');
      }

      // Upload portfolio images
      const portfolioUrls: string[] = [];
      for (const file of formData.portfolioFiles) {
        const result = await uploadFile(file, 'portfolios', userId);
        if (result.success && result.url) {
          portfolioUrls.push(result.url);
        }
      }

      // Update tasker profile
      const response = await fetch('/api/taskers/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          bio: formData.bio.trim(),
          categories: formData.categories,
          skills: formData.skills,
          serviceAreas: formData.serviceAreas,
          hourlyRate: parseFloat(formData.hourlyRate),
          profileImageUrl: profileImageResult.url,
          portfolioUrls,
        }),
      });

      if (response.ok) {
        // Show success message
        showToast.success('Professional profile created! One more step to go...');
        
        sessionStorage.setItem('stage3Complete', 'true');
        
        // Redirect after short delay
        setTimeout(() => {
          router.push('/tasker/onboarding/stage-4');
        }, 1500);
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.message || 'Failed to save profile' });
        showToast.error(errorData.message || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Profile save error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save profile. Please try again.';
      setErrors({ submit: errorMessage });
      showToast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.svg"
              alt="EasyFinder"
              width={141}
              height={48}
              className="h-12 w-auto"
              priority
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Professional Profile
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Stage 3 of 4: Build Your Profile
          </p>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-16 h-2 bg-brand-green rounded-full"></div>
              <div className="w-16 h-2 bg-brand-green rounded-full"></div>
              <div className="w-16 h-2 bg-brand-green rounded-full"></div>
              <div className="w-16 h-2 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow sm:rounded-lg p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {errors.submit}
              </div>
            )}

            {/* Profile Image */}
            <FileUpload
              label="Profile Photo"
              accept="image/*"
              maxSizeMB={5}
              multiple={false}
              required={true}
              onChange={(files) => handleFileChange('profileImageFiles', files)}
              helperText="Upload a professional photo of yourself. This will be visible to customers."
              error={errors.profileImageFiles}
            />

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                About You <span className="text-red-500">*</span>
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={5}
                value={formData.bio}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-brand-green focus:border-brand-green ${
                  errors.bio ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Tell customers about your experience, expertise, and what makes you great at what you do..."
              />
              <div className="mt-1 flex justify-between items-center">
                <p className="text-xs text-gray-500">Minimum 50 characters</p>
                <p className="text-xs text-gray-500">{formData.bio.length} characters</p>
              </div>
              {errors.bio && (
                <p className="mt-1 text-sm text-red-600">{errors.bio}</p>
              )}
            </div>

            {/* Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Service Categories <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {CATEGORIES.map(category => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => handleCategoryToggle(category)}
                    className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                      formData.categories.includes(category)
                        ? 'bg-brand-green text-white border-brand-green'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-brand-green'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
              {errors.categories && (
                <p className="mt-2 text-sm text-red-600">{errors.categories}</p>
              )}
            </div>

            {/* Skills */}
            <div>
              <label htmlFor="skillInput" className="block text-sm font-medium text-gray-700 mb-2">
                Skills <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  id="skillInput"
                  name="skillInput"
                  type="text"
                  value={formData.skillInput}
                  onChange={handleInputChange}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-green focus:border-brand-green"
                  placeholder="e.g., Plumbing, Carpentry, etc."
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-4 py-2 bg-brand-green text-white rounded-md hover:bg-brand-green/90 flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </button>
              </div>
              {errors.skillInput && (
                <p className="mt-1 text-sm text-red-600">{errors.skillInput}</p>
              )}
              
              {formData.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.skills.map(skill => (
                    <span
                      key={skill}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-brand-green/10 text-brand-green"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="ml-2 hover:text-brand-green/70"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {errors.skills && (
                <p className="mt-2 text-sm text-red-600">{errors.skills}</p>
              )}
            </div>

            {/* Service Areas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <MapPin className="inline h-4 w-4 mr-1" />
                Service Areas <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-gray-500 mb-3">Select the districts where you can provide services</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto border border-gray-200 rounded-md p-3">
                {DISTRICTS.map(district => (
                  <label
                    key={district}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={formData.serviceAreas.includes(district)}
                      onChange={() => handleServiceAreaToggle(district)}
                      className="h-4 w-4 text-brand-green focus:ring-brand-green border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{district}</span>
                  </label>
                ))}
              </div>
              {errors.serviceAreas && (
                <p className="mt-2 text-sm text-red-600">{errors.serviceAreas}</p>
              )}
            </div>

            {/* Hourly Rate */}
            <div>
              <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="inline h-4 w-4 mr-1" />
                Hourly Rate (LKR) <span className="text-red-500">*</span>
              </label>
              <input
                id="hourlyRate"
                name="hourlyRate"
                type="number"
                min="100"
                step="50"
                value={formData.hourlyRate}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-brand-green focus:border-brand-green ${
                  errors.hourlyRate ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="1000"
              />
              <p className="mt-1 text-xs text-gray-500">This is your base rate. You can adjust pricing for specific tasks.</p>
              {errors.hourlyRate && (
                <p className="mt-1 text-sm text-red-600">{errors.hourlyRate}</p>
              )}
            </div>

            {/* Portfolio */}
            <FileUpload
              label="Portfolio Images (Optional)"
              accept="image/*"
              maxSizeMB={5}
              multiple={true}
              required={false}
              onChange={(files) => handleFileChange('portfolioFiles', files)}
              helperText="Upload photos of your previous work. This helps customers see the quality of your services."
            />

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t">
              <button
                type="button"
                onClick={() => router.push('/tasker/onboarding/stage-2')}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-green hover:bg-brand-green/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : 'Continue'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

