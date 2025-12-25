import HeroBanner from '@/components/HeroBanner';
import CategoryGrid from '@/components/CategoryGrid';
import DistrictServices from '@/components/DistrictServices';
import ScrollingGigsPanel from '@/components/ScrollingGigsPanel';
import ScrollingTasksPanel from '@/components/ScrollingTasksPanel';
import PostRequestSection from '@/components/PostRequestSection';
import TopSellers from '@/components/TopSellers';
import Link from 'next/link';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  
  return (
    <>
      <HeroBanner />
      <ScrollingGigsPanel />
      <CategoryGrid />
      <ScrollingTasksPanel />
      <PostRequestSection />
      <TopSellers />
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
