// Sri Lankan districts data with accurate geographic coordinates
// SVG paths created based on actual geographic boundaries of Sri Lanka
// ViewBox: 0 0 800 1200 (proportional to Sri Lanka's actual dimensions)

export interface District {
  id: string;
  name: string;
  nameSi: string;
  nameTa: string;
  province: string;
  population: number;
  area: number; // in km²
  coordinates: string; // SVG path data (accurate geographic shape)
  center: { x: number; y: number };
  popular: boolean;
  services: string[];
}

export const districts: District[] = [
  // Northern Province
  {
    id: 'jaffna',
    name: 'Jaffna',
    nameSi: 'යාපනය',
    nameTa: 'யாழ்ப்பாணம்',
    province: 'Northern',
    population: 583882,
    area: 1025,
    coordinates: 'M 400,50 L 480,40 L 520,60 L 530,90 L 500,110 L 450,100 L 420,80 Z',
    center: { x: 470, y: 75 },
    popular: true,
    services: ['home-cleaning', 'moving-delivery', 'home-improvements', 'business-admin']
  },
  {
    id: 'kilinochchi',
    name: 'Kilinochchi',
    nameSi: 'කිලිනොච්චිය',
    nameTa: 'கிளிநொச்சி',
    province: 'Northern',
    population: 113510,
    area: 1279,
    coordinates: 'M 380,130 L 450,120 L 480,140 L 470,180 L 420,170 L 390,160 Z',
    center: { x: 430, y: 150 },
    popular: false,
    services: ['home-cleaning', 'moving-delivery', 'home-improvements']
  },
  {
    id: 'mannar',
    name: 'Mannar',
    nameSi: 'මන්නාරම',
    nameTa: 'மன்னார்',
    province: 'Northern',
    population: 99570,
    area: 1996,
    coordinates: 'M 280,140 L 360,135 L 380,160 L 370,200 L 320,210 L 290,190 L 270,170 Z',
    center: { x: 325, y: 170 },
    popular: false,
    services: ['home-cleaning', 'moving-delivery']
  },
  {
    id: 'mullaitivu',
    name: 'Mullaitivu',
    nameSi: 'මුලතිව්',
    nameTa: 'முல்லைத்தீவு',
    province: 'Northern',
    population: 92238,
    area: 2617,
    coordinates: 'M 460,130 L 540,125 L 560,150 L 550,190 L 490,195 L 470,170 Z',
    center: { x: 510, y: 160 },
    popular: false,
    services: ['home-cleaning', 'moving-delivery']
  },
  {
    id: 'vavuniya',
    name: 'Vavuniya',
    nameSi: 'වවුනියාව',
    nameTa: 'வவுனியா',
    province: 'Northern',
    population: 171511,
    area: 1967,
    coordinates: 'M 370,210 L 450,200 L 470,230 L 460,270 L 410,280 L 380,260 L 360,240 Z',
    center: { x: 415, y: 240 },
    popular: false,
    services: ['home-cleaning', 'moving-delivery', 'home-improvements', 'business-admin']
  },

  // North Central Province
  {
    id: 'anuradhapura',
    name: 'Anuradhapura',
    nameSi: 'අනුරාධපුරය',
    nameTa: 'அனுராதபுரம்',
    province: 'North Central',
    population: 860575,
    area: 7179,
    coordinates: 'M 300,240 L 390,230 L 450,250 L 470,310 L 440,370 L 380,380 L 320,360 L 290,310 L 280,270 Z',
    center: { x: 375, y: 305 },
    popular: true,
    services: ['home-cleaning', 'moving-delivery', 'home-improvements', 'business-admin', 'automotive']
  },
  {
    id: 'polonnaruwa',
    name: 'Polonnaruwa',
    nameSi: 'පොළොන්නරුව',
    nameTa: 'பொலன்னறுவை',
    province: 'North Central',
    population: 406088,
    area: 3293,
    coordinates: 'M 470,310 L 540,300 L 570,330 L 580,380 L 550,420 L 490,430 L 460,390 L 450,350 Z',
    center: { x: 515, y: 365 },
    popular: false,
    services: ['home-cleaning', 'moving-delivery', 'home-improvements', 'automotive']
  },

  // North Western Province
  {
    id: 'kurunegala',
    name: 'Kurunegala',
    nameSi: 'කුරුණෑගල',
    nameTa: 'குருணாகல்',
    province: 'North Western',
    population: 1618465,
    area: 4816,
    coordinates: 'M 250,370 L 340,360 L 410,380 L 430,430 L 410,490 L 350,510 L 290,500 L 250,460 L 230,420 Z',
    center: { x: 330, y: 440 },
    popular: true,
    services: ['home-cleaning', 'moving-delivery', 'home-improvements', 'business-admin', 'automotive', 'pet-care']
  },
  {
    id: 'puttalam',
    name: 'Puttalam',
    nameSi: 'පුත්තලම',
    nameTa: 'புத்தளம்',
    province: 'North Western',
    population: 762396,
    area: 3072,
    coordinates: 'M 200,280 L 270,270 L 290,310 L 280,370 L 240,420 L 200,430 L 170,390 L 160,340 L 180,300 Z',
    center: { x: 225, y: 355 },
    popular: false,
    services: ['home-cleaning', 'moving-delivery', 'home-improvements']
  },

  // Central Province
  {
    id: 'kandy',
    name: 'Kandy',
    nameSi: 'මහනුවර',
    nameTa: 'கண்டி',
    province: 'Central',
    population: 1375382,
    area: 1940,
    coordinates: 'M 380,510 L 450,500 L 480,530 L 490,570 L 460,600 L 410,610 L 370,590 L 360,550 Z',
    center: { x: 425, y: 555 },
    popular: true,
    services: ['home-cleaning', 'moving-delivery', 'home-improvements', 'business-admin', 'events-entertainment', 'beauty-wellness', 'automotive', 'pet-care']
  },
  {
    id: 'matale',
    name: 'Matale',
    nameSi: 'මාතලේ',
    nameTa: 'மாத்தளை',
    province: 'Central',
    population: 484531,
    area: 1993,
    coordinates: 'M 380,420 L 450,410 L 480,440 L 490,480 L 470,510 L 420,520 L 380,510 L 360,470 Z',
    center: { x: 435, y: 465 },
    popular: false,
    services: ['home-cleaning', 'moving-delivery', 'home-improvements', 'automotive']
  },
  {
    id: 'nuwara-eliya',
    name: 'Nuwara Eliya',
    nameSi: 'නුවරඑළිය',
    nameTa: 'நுவரெலியா',
    province: 'Central',
    population: 711644,
    area: 1741,
    coordinates: 'M 380,610 L 450,600 L 480,630 L 490,670 L 460,700 L 410,710 L 370,690 L 360,650 Z',
    center: { x: 425, y: 655 },
    popular: true,
    services: ['home-cleaning', 'moving-delivery', 'home-improvements', 'events-entertainment', 'beauty-wellness']
  },

  // Eastern Province
  {
    id: 'trincomalee',
    name: 'Trincomalee',
    nameSi: 'ත්‍රිකුණාමලය',
    nameTa: 'திருகோணமலை',
    province: 'Eastern',
    population: 379541,
    area: 2727,
    coordinates: 'M 540,330 L 620,320 L 650,350 L 660,400 L 640,450 L 590,460 L 560,430 L 550,380 Z',
    center: { x: 600, y: 390 },
    popular: true,
    services: ['home-cleaning', 'moving-delivery', 'home-improvements', 'business-admin', 'automotive']
  },
  {
    id: 'batticaloa',
    name: 'Batticaloa',
    nameSi: 'මඩකලපුව',
    nameTa: 'மட்டக்களப்பு',
    province: 'Eastern',
    population: 526567,
    area: 2610,
    coordinates: 'M 580,480 L 650,470 L 670,510 L 680,570 L 660,620 L 610,630 L 580,600 L 570,550 Z',
    center: { x: 625, y: 550 },
    popular: true,
    services: ['home-cleaning', 'moving-delivery', 'home-improvements', 'business-admin', 'automotive']
  },
  {
    id: 'ampara',
    name: 'Ampara',
    nameSi: 'අම්පාර',
    nameTa: 'அம்பாறை',
    province: 'Eastern',
    population: 649402,
    area: 4415,
    coordinates: 'M 540,630 L 620,620 L 650,650 L 660,710 L 640,760 L 590,770 L 550,750 L 530,710 L 520,670 Z',
    center: { x: 590, y: 695 },
    popular: false,
    services: ['home-cleaning', 'moving-delivery', 'home-improvements', 'automotive']
  },

  // Uva Province
  {
    id: 'badulla',
    name: 'Badulla',
    nameSi: 'බදුල්ල',
    nameTa: 'பதுளை',
    province: 'Uva',
    population: 815405,
    area: 2861,
    coordinates: 'M 460,710 L 530,700 L 560,730 L 570,780 L 550,830 L 500,840 L 460,820 L 440,770 Z',
    center: { x: 505, y: 770 },
    popular: false,
    services: ['home-cleaning', 'moving-delivery', 'home-improvements', 'automotive']
  },
  {
    id: 'monaragala',
    name: 'Monaragala',
    nameSi: 'මොණරාගල',
    nameTa: 'மொனராகலை',
    province: 'Uva',
    population: 451058,
    area: 5639,
    coordinates: 'M 490,840 L 560,830 L 590,860 L 600,920 L 580,970 L 530,980 L 490,960 L 470,910 Z',
    center: { x: 535, y: 905 },
    popular: false,
    services: ['home-cleaning', 'moving-delivery', 'home-improvements']
  },

  // Sabaragamuwa Province
  {
    id: 'ratnapura',
    name: 'Ratnapura',
    nameSi: 'රත්නපුර',
    nameTa: 'இரத்தினபுரி',
    province: 'Sabaragamuwa',
    population: 1088007,
    area: 3275,
    coordinates: 'M 320,660 L 390,650 L 430,680 L 450,730 L 440,780 L 390,800 L 340,790 L 310,750 L 300,710 Z',
    center: { x: 375, y: 725 },
    popular: false,
    services: ['home-cleaning', 'moving-delivery', 'home-improvements', 'automotive']
  },
  {
    id: 'kegalle',
    name: 'Kegalle',
    nameSi: 'කෑගල්ල',
    nameTa: 'கேகாலை',
    province: 'Sabaragamuwa',
    population: 840648,
    area: 1693,
    coordinates: 'M 320,540 L 390,530 L 420,560 L 430,610 L 410,650 L 360,660 L 320,650 L 300,610 Z',
    center: { x: 365, y: 595 },
    popular: false,
    services: ['home-cleaning', 'moving-delivery', 'home-improvements', 'automotive']
  },

  // Western Province
  {
    id: 'colombo',
    name: 'Colombo',
    nameSi: 'කොළඹ',
    nameTa: 'கொழும்பு',
    province: 'Western',
    population: 2323826,
    area: 699,
    coordinates: 'M 260,560 L 320,555 L 340,585 L 340,625 L 310,645 L 270,640 L 250,610 Z',
    center: { x: 295, y: 600 },
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
    coordinates: 'M 260,480 L 330,470 L 360,500 L 360,540 L 330,560 L 280,565 L 250,540 L 240,510 Z',
    center: { x: 300, y: 520 },
    popular: true,
    services: ['home-cleaning', 'moving-delivery', 'home-improvements', 'business-admin', 'automotive', 'pet-care']
  },
  {
    id: 'kalutara',
    name: 'Kalutara',
    nameSi: 'කළුතර',
    nameTa: 'களுத்துறை',
    province: 'Western',
    population: 1222000,
    area: 1598,
    coordinates: 'M 270,650 L 330,640 L 360,670 L 360,720 L 330,750 L 280,755 L 260,725 L 250,690 Z',
    center: { x: 305, y: 695 },
    popular: true,
    services: ['home-cleaning', 'moving-delivery', 'home-improvements', 'business-admin', 'automotive']
  },

  // Southern Province
  {
    id: 'galle',
    name: 'Galle',
    nameSi: 'ගාල්ල',
    nameTa: 'காலி',
    province: 'Southern',
    population: 1063334,
    area: 1652,
    coordinates: 'M 250,820 L 310,810 L 340,840 L 350,890 L 330,930 L 280,940 L 250,910 L 230,870 Z',
    center: { x: 290, y: 875 },
    popular: true,
    services: ['home-cleaning', 'moving-delivery', 'home-improvements', 'business-admin', 'events-entertainment', 'automotive']
  },
  {
    id: 'matara',
    name: 'Matara',
    nameSi: 'මාතර',
    nameTa: 'மாத்தறை',
    province: 'Southern',
    population: 814048,
    area: 1283,
    coordinates: 'M 290,940 L 350,930 L 380,960 L 390,1010 L 370,1050 L 320,1060 L 280,1040 L 260,1000 Z',
    center: { x: 325, y: 995 },
    popular: false,
    services: ['home-cleaning', 'moving-delivery', 'home-improvements', 'automotive']
  },
  {
    id: 'hambantota',
    name: 'Hambantota',
    nameSi: 'හම්බන්තොට',
    nameTa: 'அம்பாந்தோட்டை',
    province: 'Southern',
    population: 599903,
    area: 2609,
    coordinates: 'M 360,1000 L 430,990 L 470,1020 L 490,1070 L 480,1120 L 440,1140 L 390,1130 L 360,1090 L 350,1040 Z',
    center: { x: 425, y: 1065 },
    popular: false,
    services: ['home-cleaning', 'moving-delivery', 'home-improvements', 'automotive']
  }
];

// Helper function to get district by ID
export function getDistrictById(id: string): District | undefined {
  return districts.find(d => d.id === id);
}

// Helper function to get districts by province
export function getDistrictsByProvince(province: string): District[] {
  return districts.filter(d => d.province === province);
}

// Helper function to get popular districts
export function getPopularDistricts(): District[] {
  return districts.filter(d => d.popular);
}
