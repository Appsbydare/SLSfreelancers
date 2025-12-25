import Link from 'next/link';
import { ArrowRight, CheckCircle, Star, Shield, Clock, MessageCircle } from 'lucide-react';

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            How Sri Lanka Tasks Works
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Getting things done has never been easier. Whether you need help with a task or want to earn money, our platform connects you with the right people.
          </p>
        </div>

        {/* For Task Posters */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              For Task Posters
            </h2>
            <p className="text-lg text-gray-600">
              Need something done? Here&apos;s how to get started:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <div className="w-16 h-16 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-brand-green">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Describe what you need done
              </h3>
              <p className="text-gray-600 mb-6">
                Post your task with details, budget, and location. Be specific about what you need done.
              </p>
              <Link
                href="/post-task"
                className="inline-flex items-center text-brand-green hover:text-brand-green/80 font-medium"
              >
                Post a task now
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <div className="w-16 h-16 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-brand-green">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Set your budget
              </h3>
              <p className="text-gray-600 mb-6">
                Set your budget range to help taskers understand your expectations and attract quality offers.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <div className="w-16 h-16 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-brand-green">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Receive quotes and pick the best Tasker
              </h3>
              <p className="text-gray-600 mb-6">
                Review offers from skilled taskers, check their profiles and reviews, then choose the best one.
              </p>
            </div>
          </div>
        </section>

        {/* For Taskers */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              For Taskers
            </h2>
            <p className="text-lg text-gray-600">
              Want to earn money? Here&apos;s how to get started:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-green-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Create Your Profile
              </h3>
              <p className="text-gray-600 mb-6">
                Set up your profile with skills, experience, and portfolio. Get verified to build trust.
              </p>
              <Link
                href="/become-tasker"
                className="inline-flex items-center text-green-600 hover:text-green-700 font-medium"
              >
                Become a tasker
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Browse & Apply
              </h3>
              <p className="text-gray-600 mb-6">
                Find tasks that match your skills and location. Submit competitive offers with your proposal.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Complete & Get Paid
              </h3>
              <p className="text-gray-600 mb-6">
                Do great work, get positive reviews, and receive secure payments when tasks are completed.
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Sri Lanka Tasks?
            </h2>
            <p className="text-lg text-gray-600">
              We provide a safe, secure, and efficient platform for all your task needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="w-12 h-12 bg-brand-green/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-brand-green" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure Payments</h3>
              <p className="text-gray-600">
                Your money is held securely until the task is completed to your satisfaction.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Verified Reviews</h3>
              <p className="text-gray-600">
                Read real reviews from other users to choose the best tasker for your needs.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Insurance Coverage</h3>
              <p className="text-gray-600">
                We provide liability insurance for most task activities for your peace of mind.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="w-12 h-12 bg-brand-green/10 rounded-lg flex items-center justify-center mb-4">
                <MessageCircle className="h-6 w-6 text-brand-green" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Easy Communication</h3>
              <p className="text-gray-600">
                Chat directly with taskers through our secure messaging system.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Response</h3>
              <p className="text-gray-600">
                Get responses from taskers within hours, not days. Fast and efficient service.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Quality Guarantee</h3>
              <p className="text-gray-600">
                We ensure high-quality service through our verification and review system.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-brand-green rounded-lg p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-white mb-8 max-w-2xl mx-auto">
            Join thousands of Sri Lankans who are already using our platform to get things done.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/post-task"
              className="inline-flex items-center px-8 py-4 bg-white text-brand-green text-lg font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Post Your First Task
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/become-tasker"
              className="inline-flex items-center px-8 py-4 bg-transparent text-white text-lg font-semibold rounded-lg border-2 border-white hover:bg-white hover:text-brand-green transition-colors"
            >
              Start Earning Today
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
