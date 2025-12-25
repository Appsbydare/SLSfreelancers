import HeroBanner from '@/components/HeroBanner';
import CategoryGrid from '@/components/CategoryGrid';
import DistrictServices from '@/components/DistrictServices';
import DualModeExplainer from '@/components/DualModeExplainer';
import FeaturedGigs from '@/components/FeaturedGigs';
import TopSellers from '@/components/TopSellers';

export default function HomePage() {
  return (
    <>
      <HeroBanner />
      <FeaturedGigs />
      <CategoryGrid />
      <DualModeExplainer />
      <TopSellers />
      <DistrictServices />
    </>
  );
}
