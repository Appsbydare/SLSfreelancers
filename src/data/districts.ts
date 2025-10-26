// Sri Lankan districts data with coordinates and information
export interface District {
  id: string;
  name: string;
  nameSi: string;
  nameTa: string;
  province: string;
  population: number;
  area: number; // in km²
  coordinates: string; // SVG path data
  center: { x: number; y: number };
  popular: boolean;
  services: string[];
}

export const districts: District[] = [
  // Western Province
  {
    id: 'colombo',
    name: 'Colombo',
    nameSi: 'කොළඹ',
    nameTa: 'கொழும்பு',
    province: 'Western',
    population: 2323826,
    area: 699,
    coordinates: 'M150,80 L180,75 L200,90 L190,120 L170,130 L150,125 L140,110 Z',
    center: { x: 165, y: 105 },
    popular: true,
    services: ['home-cleaning', 'moving-delivery', 'business-admin', 'creative-digital', 'events-entertainment', 'beauty-wellness', 'automotive', 'pet-care', 'lessons-training']
  },
  {
    id: 'gampaha',
    name: 'Gampaha',
    nameSi: 'ගම්පහ',
    nameTa: 'கம்பஹா',
    province: 'Western',
    population: 2300000,
    area: 1387,
    coordinates: 'M100,60 L150,55 L160,80 L140,100 L120,95 L90,85 Z',
    center: { x: 125, y: 80 },
    popular: true,
    services: ['home-cleaning', 'moving-delivery', 'home-improvements', 'business-admin', 'automotive', 'pet-care']
  },
  {
    id: 'kalutara',
    name: 'Kalutara',
    nameSi: 'කළුතර',
    nameTa: 'களுத்துறை',
    province: 'Western',
    population: 1200000,
    area: 1598,
    coordinates: 'M50,120 L100,115 L110,140 L90,160 L70,155 L40,145 Z',
    center: { x: 80, y: 140 },
    popular: true,
    services: ['home-cleaning', 'moving-delivery', 'home-improvements', 'automotive', 'pet-care']
  },

  // Central Province
  {
    id: 'kandy',
    name: 'Kandy',
    nameSi: 'මහනුවර',
    nameTa: 'கண்டி',
    province: 'Central',
    population: 1400000,
    area: 1940,
    coordinates: 'M200,150 L250,145 L270,170 L260,200 L230,210 L200,195 Z',
    center: { x: 235, y: 180 },
    popular: true,
    services: ['home-cleaning', 'moving-delivery', 'home-improvements', 'business-admin', 'creative-digital', 'events-entertainment', 'beauty-wellness', 'automotive', 'pet-care', 'lessons-training']
  },
  {
    id: 'matale',
    name: 'Matale',
    nameSi: 'මාතලේ',
    nameTa: 'மாத்தளை',
    province: 'Central',
    population: 500000,
    area: 1993,
    coordinates: 'M250,200 L300,195 L320,220 L310,250 L280,260 L250,245 Z',
    center: { x: 285, y: 230 },
    popular: false,
    services: ['home-cleaning', 'moving-delivery', 'home-improvements', 'automotive', 'pet-care']
  },
  {
    id: 'nuwara-eliya',
    name: 'Nuwara Eliya',
    nameSi: 'නුවර එළිය',
    nameTa: 'நுவரெலியா',
    province: 'Central',
    population: 700000,
    area: 1741,
    coordinates: 'M200,200 L250,195 L270,220 L260,250 L230,260 L200,245 Z',
    center: { x: 235, y: 230 },
    popular: true,
    services: ['home-cleaning', 'moving-delivery', 'home-improvements', 'events-entertainment', 'beauty-wellness', 'automotive', 'pet-care']
  },

  // Southern Province
  {
    id: 'galle',
    name: 'Galle',
    nameSi: 'ගාල්ල',
    nameTa: 'காலி',
    province: 'Southern',
    population: 1100000,
    area: 1652,
    coordinates: 'M80,200 L130,195 L150,220 L140,250 L110,260 L80,245 Z',
    center: { x: 115, y: 230 },
    popular: true,
    services: ['home-cleaning', 'moving-delivery', 'home-improvements', 'events-entertainment', 'beauty-wellness', 'automotive', 'pet-care']
  },
  {
    id: 'matara',
    name: 'Matara',
    nameSi: 'මාතර',
    nameTa: 'மாத்தறை',
    province: 'Southern',
    population: 800000,
    area: 1283,
    coordinates: 'M50,250 L100,245 L120,270 L110,300 L80,310 L50,295 Z',
    center: { x: 85, y: 280 },
    popular: true,
    services: ['home-cleaning', 'moving-delivery', 'home-improvements', 'automotive', 'pet-care']
  },
  {
    id: 'hambantota',
    name: 'Hambantota',
    nameSi: 'හම්බන්තොට',
    nameTa: 'அம்பாந்தோட்டை',
    province: 'Southern',
    population: 600000,
    area: 2609,
    coordinates: 'M100,300 L150,295 L170,320 L160,350 L130,360 L100,345 Z',
    center: { x: 135, y: 330 },
    popular: false,
    services: ['home-cleaning', 'moving-delivery', 'home-improvements', 'automotive', 'pet-care']
  },

  // Northern Province
  {
    id: 'jaffna',
    name: 'Jaffna',
    nameSi: 'යාපනය',
    nameTa: 'யாழ்ப்பாணம்',
    province: 'Northern',
    population: 600000,
    area: 1025,
    coordinates: 'M200,50 L250,45 L270,70 L260,100 L230,110 L200,95 Z',
    center: { x: 235, y: 80 },
    popular: true,
    services: ['home-cleaning', 'moving-delivery', 'home-improvements', 'business-admin', 'creative-digital', 'events-entertainment', 'beauty-wellness', 'automotive', 'pet-care', 'lessons-training']
  },
  {
    id: 'vanni',
    name: 'Vanni',
    nameSi: 'වන්නි',
    nameTa: 'வன்னி',
    province: 'Northern',
    population: 400000,
    area: 1967,
    coordinates: 'M150,100 L200,95 L220,120 L210,150 L180,160 L150,145 Z',
    center: { x: 185, y: 130 },
    popular: false,
    services: ['home-cleaning', 'moving-delivery', 'home-improvements', 'automotive', 'pet-care']
  },

  // Eastern Province
  {
    id: 'batticaloa',
    name: 'Batticaloa',
    nameSi: 'මඩකලපුව',
    nameTa: 'மட்டக்களப்பு',
    province: 'Eastern',
    population: 500000,
    area: 2854,
    coordinates: 'M250,150 L300,145 L320,170 L310,200 L280,210 L250,195 Z',
    center: { x: 285, y: 180 },
    popular: true,
    services: ['home-cleaning', 'moving-delivery', 'home-improvements', 'business-admin', 'creative-digital', 'events-entertainment', 'beauty-wellness', 'automotive', 'pet-care']
  },
  {
    id: 'trincomalee',
    name: 'Trincomalee',
    nameSi: 'ත්‍රිකුණාමලය',
    nameTa: 'திருகோணமலை',
    province: 'Eastern',
    population: 400000,
    area: 2727,
    coordinates: 'M300,100 L350,95 L370,120 L360,150 L330,160 L300,145 Z',
    center: { x: 335, y: 130 },
    popular: true,
    services: ['home-cleaning', 'moving-delivery', 'home-improvements', 'events-entertainment', 'beauty-wellness', 'automotive', 'pet-care']
  },

  // North Western Province
  {
    id: 'kurunegala',
    name: 'Kurunegala',
    nameSi: 'කුරුණෑගල',
    nameTa: 'குருநாகல்',
    province: 'North Western',
    population: 1600000,
    area: 4816,
    coordinates: 'M100,120 L150,115 L170,140 L160,170 L130,180 L100,165 Z',
    center: { x: 135, y: 150 },
    popular: true,
    services: ['home-cleaning', 'moving-delivery', 'home-improvements', 'business-admin', 'creative-digital', 'events-entertainment', 'beauty-wellness', 'automotive', 'pet-care', 'lessons-training']
  },
  {
    id: 'puttalam',
    name: 'Puttalam',
    nameSi: 'පුත්තලම',
    nameTa: 'புத்தளம்',
    province: 'North Western',
    population: 800000,
    area: 3072,
    coordinates: 'M50,80 L100,75 L120,100 L110,130 L80,140 L50,125 Z',
    center: { x: 85, y: 110 },
    popular: false,
    services: ['home-cleaning', 'moving-delivery', 'home-improvements', 'automotive', 'pet-care']
  },

  // North Central Province
  {
    id: 'anuradhapura',
    name: 'Anuradhapura',
    nameSi: 'අනුරාධපුර',
    nameTa: 'அனுராதபுரம்',
    province: 'North Central',
    population: 800000,
    area: 7179,
    coordinates: 'M150,150 L200,145 L220,170 L210,200 L180,210 L150,195 Z',
    center: { x: 185, y: 180 },
    popular: true,
    services: ['home-cleaning', 'moving-delivery', 'home-improvements', 'business-admin', 'creative-digital', 'events-entertainment', 'beauty-wellness', 'automotive', 'pet-care']
  },
  {
    id: 'polonnaruwa',
    name: 'Polonnaruwa',
    nameSi: 'පොළොන්නරුව',
    nameTa: 'பொலன்னறுவை',
    province: 'North Central',
    population: 400000,
    area: 3383,
    coordinates: 'M200,200 L250,195 L270,220 L260,250 L230,260 L200,245 Z',
    center: { x: 235, y: 230 },
    popular: false,
    services: ['home-cleaning', 'moving-delivery', 'home-improvements', 'automotive', 'pet-care']
  },

  // Uva Province
  {
    id: 'badulla',
    name: 'Badulla',
    nameSi: 'බදුල්ල',
    nameTa: 'பதுளை',
    province: 'Uva',
    population: 800000,
    area: 2861,
    coordinates: 'M200,250 L250,245 L270,270 L260,300 L230,310 L200,295 Z',
    center: { x: 235, y: 280 },
    popular: true,
    services: ['home-cleaning', 'moving-delivery', 'home-improvements', 'business-admin', 'creative-digital', 'events-entertainment', 'beauty-wellness', 'automotive', 'pet-care']
  },
  {
    id: 'monaragala',
    name: 'Monaragala',
    nameSi: 'මොනරාගල',
    nameTa: 'மொனராகலை',
    province: 'Uva',
    population: 500000,
    area: 5639,
    coordinates: 'M150,300 L200,295 L220,320 L210,350 L180,360 L150,345 Z',
    center: { x: 185, y: 330 },
    popular: false,
    services: ['home-cleaning', 'moving-delivery', 'home-improvements', 'automotive', 'pet-care']
  },

  // Sabaragamuwa Province
  {
    id: 'ratnapura',
    name: 'Ratnapura',
    nameSi: 'රත්නපුර',
    nameTa: 'இரத்தினபுரி',
    province: 'Sabaragamuwa',
    population: 1000000,
    area: 3275,
    coordinates: 'M100,200 L150,195 L170,220 L160,250 L130,260 L100,245 Z',
    center: { x: 135, y: 230 },
    popular: true,
    services: ['home-cleaning', 'moving-delivery', 'home-improvements', 'business-admin', 'creative-digital', 'events-entertainment', 'beauty-wellness', 'automotive', 'pet-care']
  },
  {
    id: 'kegalle',
    name: 'Kegalle',
    nameSi: 'කෑගල්ල',
    nameTa: 'கேகாலை',
    province: 'Sabaragamuwa',
    population: 800000,
    area: 1693,
    coordinates: 'M120,150 L170,145 L190,170 L180,200 L150,210 L120,195 Z',
    center: { x: 155, y: 180 },
    popular: false,
    services: ['home-cleaning', 'moving-delivery', 'home-improvements', 'automotive', 'pet-care']
  }
];

// Helper functions
export const getDistrictById = (id: string): District | undefined => {
  return districts.find(district => district.id === id);
};

export const getDistrictsByProvince = (province: string): District[] => {
  return districts.filter(district => district.province === province);
};

export const getPopularDistricts = (): District[] => {
  return districts.filter(district => district.popular);
};

export const getDistrictsByService = (serviceId: string): District[] => {
  return districts.filter(district => district.services.includes(serviceId));
};
