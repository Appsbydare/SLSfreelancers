import HeroBanner from '@/components/HeroBanner';
import CategoryGrid from '@/components/CategoryGrid';
import DistrictServices from '@/components/DistrictServices';
import ScrollingGigsPanel from '@/components/ScrollingGigsPanel';
import PostRequestSection from '@/components/PostRequestSection';
import TopSellers from '@/components/TopSellers';

export default function HomePage() {
  return (
    <>
      <HeroBanner />
      <ScrollingGigsPanel />
      <CategoryGrid />
      <PostRequestSection />
      <TopSellers />
      <DistrictServices />
    </>
  );
}
