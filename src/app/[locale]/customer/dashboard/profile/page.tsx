import { getTranslations } from 'next-intl/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { User, MapPin, Phone, Mail, Calendar } from 'lucide-react';
import ProfileForm from '@/app/[locale]/customer/dashboard/profile/ProfileForm';

export default async function CustomerProfilePage() {
    // Create authenticated Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options);
                    });
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    // Fetch user data from users table
    const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

    // Fetch customer data
    const { data: customerData } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', userData.id)
        .maybeSingle();

    if (!userData) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">Unable to load profile data.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
                <p className="text-gray-600 mt-1">Manage your personal information</p>
            </div>

            {/* Profile Overview Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="flex items-start gap-6">
                    <div className="h-20 w-20 rounded-full bg-brand-green/10 flex items-center justify-center flex-shrink-0">
                        {userData.profile_image_url ? (
                            <img
                                src={userData.profile_image_url}
                                alt="Profile"
                                className="h-20 w-20 rounded-full object-cover"
                            />
                        ) : (
                            <User className="h-10 w-10 text-brand-green" />
                        )}
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900">
                            {userData.first_name} {userData.last_name}
                        </h2>
                        {userData.calling_name && (
                            <p className="text-sm text-gray-500">"{userData.calling_name}"</p>
                        )}
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center text-gray-600">
                                <Mail className="h-4 w-4 mr-2" />
                                {userData.email}
                            </div>
                            <div className="flex items-center text-gray-600">
                                <Phone className="h-4 w-4 mr-2" />
                                {userData.phone || 'Not provided'}
                            </div>
                            <div className="flex items-center text-gray-600">
                                <MapPin className="h-4 w-4 mr-2" />
                                {userData.location || 'Not provided'}
                            </div>
                            <div className="flex items-center text-gray-600">
                                <Calendar className="h-4 w-4 mr-2" />
                                Joined {new Date(userData.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Profile Form */}
            <ProfileForm userData={userData} customerData={customerData} />
        </div>
    );
}
