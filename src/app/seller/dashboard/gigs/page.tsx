'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Plus, 
  Edit, 
  Pause, 
  Play, 
  Trash2, 
  Eye,
  Package
} from 'lucide-react';

export default function SellerGigsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [gigs, setGigs] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadGigs();
  }, []);

  const loadGigs = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        router.push('/login?type=tasker');
        return;
      }

      const userData = JSON.parse(userStr);
      setUser(userData);

      const response = await fetch(`/api/gigs?sellerId=${userData.id}`);
      if (response.ok) {
        const data = await response.json();
        setGigs(data.gigs || []);
      }
    } catch (error) {
      console.error('Error loading gigs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePauseGig = async (gigId: string) => {
    try {
      await fetch(`/api/gigs/${gigId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          status: 'paused',
        }),
      });
      loadGigs();
    } catch (error) {
      console.error('Error pausing gig:', error);
    }
  };

  const handleActivateGig = async (gigId: string) => {
    try {
      await fetch(`/api/gigs/${gigId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          status: 'active',
        }),
      });
      loadGigs();
    } catch (error) {
      console.error('Error activating gig:', error);
    }
  };

  const handleDeleteGig = async (gigId: string) => {
    if (!confirm('Are you sure you want to delete this gig? This action cannot be undone.')) {
      return;
    }

    try {
      await fetch(`/api/gigs/${gigId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      loadGigs();
    } catch (error) {
      console.error('Error deleting gig:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Gigs</h1>
          <p className="text-gray-600 mt-1">Manage your service offerings</p>
        </div>
        <Link
          href="/seller/gigs/create"
          className="inline-flex items-center px-6 py-3 bg-brand-green text-white rounded-lg font-semibold hover:bg-brand-green/90 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create New Gig
        </Link>
      </div>

      {/* Gigs List */}
      {gigs.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No gigs yet</h3>
          <p className="text-gray-600 mb-6">Create your first gig to start selling services</p>
          <Link
            href="/seller/gigs/create"
            className="inline-flex items-center px-6 py-3 bg-brand-green text-white rounded-lg font-semibold hover:bg-brand-green/90 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Your First Gig
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {gigs.map((gig) => (
            <div key={gig.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Gig Image */}
                <div className="relative w-full md:w-48 h-48 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                  {gig.images && gig.images.length > 0 ? (
                    <Image
                      src={gig.images[0]}
                      alt={gig.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No Image
                    </div>
                  )}
                </div>

                {/* Gig Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">{gig.title}</h3>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        gig.status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : gig.status === 'paused'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {gig.status.charAt(0).toUpperCase() + gig.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-4 line-clamp-2">{gig.description}</p>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-6 mb-4 text-sm text-gray-600">
                    <div>
                      <span className="font-semibold">{gig.views_count || 0}</span> views
                    </div>
                    <div>
                      <span className="font-semibold">{gig.orders_count || 0}</span> orders
                    </div>
                    <div>
                      <span className="font-semibold">{gig.rating?.toFixed(1) || '0.0'}</span> rating
                    </div>
                    <div>
                      Starting at <span className="font-semibold text-brand-green">
                        LKR {gig.startingPrice?.toLocaleString() || '0'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/gigs/${gig.slug}`}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Link>
                    <Link
                      href={`/seller/gigs/${gig.id}/edit`}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Link>
                    {gig.status === 'active' ? (
                      <button
                        onClick={() => handlePauseGig(gig.id)}
                        className="inline-flex items-center px-4 py-2 border border-yellow-300 rounded-lg text-sm font-medium text-yellow-700 hover:bg-yellow-50 transition-colors"
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </button>
                    ) : (
                      <button
                        onClick={() => handleActivateGig(gig.id)}
                        className="inline-flex items-center px-4 py-2 border border-green-300 rounded-lg text-sm font-medium text-green-700 hover:bg-green-50 transition-colors"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Activate
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteGig(gig.id)}
                      className="inline-flex items-center px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

