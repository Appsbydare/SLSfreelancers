import HeroBanner from '@/components/HeroBanner';
import CategoryGrid from '@/components/CategoryGrid';
import SriLankaMap from '@/components/SriLankaMap';
import DistrictServices from '@/components/DistrictServices';

export default function HomePage() {
  return (
    <>
      <HeroBanner />
      <CategoryGrid />
      <SriLankaMap />
      <DistrictServices />
    </>
  );
}
