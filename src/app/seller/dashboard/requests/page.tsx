'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText, DollarSign, MapPin, Clock } from 'lucide-react';

export default function SellerRequestsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        router.push('/login?type=tasker');
        return;
      }

      // Fetch open tasks (custom requests)
      const response = await fetch('/api/tasks?status=open&limit=20');
      if (response.ok) {
        const data = await response.json();
        setRequests(data.tasks || []);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Custom Requests</h1>
        <p className="text-gray-600 mt-1">Browse and bid on custom project requests</p>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No open requests at the moment</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Link
              key={request.id}
              href={`/tasks/${request.id}`}
              className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{request.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{request.description}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      <span>LKR {request.budget?.toLocaleString() || 'Negotiable'}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{request.location}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{request.offersCount || 0} offers</span>
                    </div>
                  </div>
                </div>
                <div className="ml-4">
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Open
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

