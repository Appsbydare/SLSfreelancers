import HeroBanner from '@/components/HeroBanner';
import CategoryGrid from '@/components/CategoryGrid';
import DistrictServices from '@/components/DistrictServices';
import ScrollingGigsPanel from '@/components/ScrollingGigsPanel';
import ScrollingTasksPanel from '@/components/ScrollingTasksPanel';
import PostRequestSection from '@/components/PostRequestSection';
import TopSellers from '@/components/TopSellers';
import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase-server';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;

  // Fetch categories
  const { data: categories } = await supabaseServer
    .from('categories')
    .select('*')
    .order('popular', { ascending: false });

  // Fetch tasks
  const { data: tasksData } = await supabaseServer
    .from('tasks')
    .select(`
      *,
      customers (
        users (
          first_name,
          last_name
        )
      ),
      offers (count)
    `)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(10);

  // Transform to Task type
  const tasks = tasksData?.map((t: any) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    budget: t.budget,
    location: t.location,
    category: t.category,
    postedDate: new Date(t.created_at),
    posterId: t.customer_id,
    posterName: t.customers?.users?.first_name || 'Unknown',
    posterRating: 5.0, // Placeholder
    offersCount: t.offers?.[0]?.count || 0,
    status: t.status,
  })) || [];

  // Fetch featured gigs
  const { data: gigsData } = await supabaseServer
    .from('gigs')
    .select(`
      *,
      seller:seller_id (
        *,
        user:user_id (
          first_name,
          last_name,
          profile_image_url
        )
      ),
      packages:gig_packages (price)
    `)
    .eq('status', 'active')
    .limit(10);

  const gigs = gigsData?.map((g: any) => ({
    id: g.id,
    title: g.title,
    slug: g.slug,
    description: g.description,
    images: g.images,
    sellerName: g.seller?.user?.first_name,
    sellerAvatar: g.seller?.user?.profile_image_url,
    sellerRating: g.rating,
    sellerLevel: g.seller?.level_code,
    startingPrice: Math.min(...(g.packages?.map((p: any) => p.price) || [0])),
    ordersCount: g.orders_count,
    isVerified: g.seller?.level_code !== 'starter_pro', // Example logic
  })) || [];

  // Fetch top sellers
  const { data: sellersData } = await supabaseServer
    .from('taskers')
    .select(`
      *,
      user:user_id (
        id,
        first_name,
        last_name,
        profile_image_url
      )
    `)
    .order('rating', { ascending: false })
    .limit(8);

  return (
    <>
      <HeroBanner />
      <ScrollingGigsPanel gigs={gigs} />
      <CategoryGrid categories={categories || []} />
      <ScrollingTasksPanel tasks={tasks} />
      <PostRequestSection />
      <TopSellers sellers={sellersData || []} />
      <DistrictServices />

      {/* How It Works Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 font-geom">
            How It Works
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Learn how EasyFinder connects you with skilled professionals to get any task done quickly and reliably.
          </p>
          <Link
            href={`/${locale}/how-it-works`}
            className="inline-flex items-center px-8 py-3 bg-brand-green text-white font-medium rounded-lg hover:bg-brand-green/90 transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            Learn More
          </Link>
        </div>
      </div>
    </>
  );
}
