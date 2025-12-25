// Script to convert GeoJSON coordinates to SVG paths for Sri Lanka districts
const fs = require('fs');
const path = require('path');

// Read the GeoJSON file
const geojsonPath = path.join(__dirname, '../../lk.json');
const geojson = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));

// Map of district name variations to standardized IDs and names
const districtMapping = {
  'Trikuṇāmalaya': { id: 'trincomalee', name: 'Trincomalee', nameSi: 'ත්‍රිකුණාමලය', nameTa: 'திருகோணமலை' },
  'Mulativ': { id: 'mullaitivu', name: 'Mullaitivu', nameSi: 'මුලතිව්', nameTa: 'முல்லைத்தீவு' },
  'Yāpanaya': { id: 'jaffna', name: 'Jaffna', nameSi: 'යාපනය', nameTa: 'யாழ்ப்பாணம்' },
  'Kilinŏchchi': { id: 'kilinochchi', name: 'Kilinochchi', nameSi: 'කිලිනොච්චිය', nameTa: 'கிளிநொச்சி' },
  'Mannārama': { id: 'mannar', name: 'Mannar', nameSi: 'මන්නාරම', nameTa: 'மன்னார்' },
  'Puttalama': { id: 'puttalam', name: 'Puttalam', nameSi: 'පුත්තලම', nameTa: 'புத்தளம்' },
  'Gampaha': { id: 'gampaha', name: 'Gampaha', nameSi: 'ගම්පහ', nameTa: 'கம்பஹா' },
  'Kŏḷamba': { id: 'colombo', name: 'Colombo', nameSi: 'කොළඹ', nameTa: 'கொழும்பு' },
  'Kaḷutara': { id: 'kalutara', name: 'Kalutara', nameSi: 'කළුතර', nameTa: 'களுத்துறை' },
  'Gālla': { id: 'galle', name: 'Galle', nameSi: 'ගාල්ල', nameTa: 'காலி' },
  'Mātara': { id: 'matara', name: 'Matara', nameSi: 'මාතර', nameTa: 'மாத்தறை' },
  'Hambantŏṭa': { id: 'hambantota', name: 'Hambantota', nameSi: 'හම්බන්තොට', nameTa: 'அம்பாந்தோட்டை' },
  'Ampāra': { id: 'ampara', name: 'Ampara', nameSi: 'අම්පාර', nameTa: 'அம்பாறை' },
  'Maḍakalapuva': { id: 'batticaloa', name: 'Batticaloa', nameSi: 'මඩකලපුව', nameTa: 'மட்டக்களப்பு' },
  'Ratnapura': { id: 'ratnapura', name: 'Ratnapura', nameSi: 'රත්නපුර', nameTa: 'இரத்தினபுரி' },
  'Mŏṇarāgala': { id: 'monaragala', name: 'Monaragala', nameSi: 'මොණරාගල', nameTa: 'மொனராகலை' },
  'Kægalla': { id: 'kegalle', name: 'Kegalle', nameSi: 'කෑගල්ල', nameTa: 'கேகாலை' },
  'Badulla': { id: 'badulla', name: 'Badulla', nameSi: 'බදුල්ල', nameTa: 'பதுளை' },
  'Mātale': { id: 'matale', name: 'Matale', nameSi: 'මාතලේ', nameTa: 'மாத்தளை' },
  'Pŏḷŏnnaruva': { id: 'polonnaruwa', name: 'Polonnaruwa', nameSi: 'පොළොන්නරුව', nameTa: 'பொலன்னறுவை' },
  'Kuruṇægala': { id: 'kurunegala', name: 'Kurunegala', nameSi: 'කුරුණෑගල', nameTa: 'குருணாகல்' },
  'Anurādhapura': { id: 'anuradhapura', name: 'Anuradhapura', nameSi: 'අනුරාධපුරය', nameTa: 'அனுராதபுரம்' },
  'Nuvara Ĕliya': { id: 'nuwara-eliya', name: 'Nuwara Eliya', nameSi: 'නුවරඑළිය', nameTa: 'நுவரெலியா' },
  'Vavuniyāva': { id: 'vavuniya', name: 'Vavuniya', nameSi: 'වවුනියාව', nameTa: 'வவுனியா' },
  'Mahanuvara': { id: 'kandy', name: 'Kandy', nameSi: 'මහනුවර', nameTa: 'கண்டி' }
};

// Province mapping
const provinceMapping = {
  'jaffna': 'Northern',
  'kilinochchi': 'Northern',
  'mannar': 'Northern',
  'mullaitivu': 'Northern',
  'vavuniya': 'Northern',
  'anuradhapura': 'North Central',
  'polonnaruwa': 'North Central',
  'kurunegala': 'North Western',
  'puttalam': 'North Western',
  'kandy': 'Central',
  'matale': 'Central',
  'nuwara-eliya': 'Central',
  'trincomalee': 'Eastern',
  'batticaloa': 'Eastern',
  'ampara': 'Eastern',
  'badulla': 'Uva',
  'monaragala': 'Uva',
  'ratnapura': 'Sabaragamuwa',
  'kegalle': 'Sabaragamuwa',
  'colombo': 'Western',
  'gampaha': 'Western',
  'kalutara': 'Western',
  'galle': 'Southern',
  'matara': 'Southern',
  'hambantota': 'Southern'
};

// Popular districts
const popularDistricts = ['colombo', 'gampaha', 'kandy', 'galle', 'jaffna', 'trincomalee', 'batticaloa', 'anuradhapura', 'kurunegala', 'kalutara', 'nuwara-eliya'];

// Population and area data
const districtData = {
  'colombo': { population: 2323826, area: 699 },
  'gampaha': { population: 2300000, area: 1387 },
  'kalutara': { population: 1222000, area: 1598 },
  'kandy': { population: 1375382, area: 1940 },
  'matale': { population: 484531, area: 1993 },
  'nuwara-eliya': { population: 711644, area: 1741 },
  'galle': { population: 1063334, area: 1652 },
  'matara': { population: 814048, area: 1283 },
  'hambantota': { population: 599903, area: 2609 },
  'jaffna': { population: 583882, area: 1025 },
  'kilinochchi': { population: 113510, area: 1279 },
  'mannar': { population: 99570, area: 1996 },
  'mullaitivu': { population: 92238, area: 2617 },
  'vavuniya': { population: 171511, area: 1967 },
  'puttalam': { population: 762396, area: 3072 },
  'kurunegala': { population: 1618465, area: 4816 },
  'anuradhapura': { population: 860575, area: 7179 },
  'polonnaruwa': { population: 406088, area: 3293 },
  'badulla': { population: 815405, area: 2861 },
  'monaragala': { population: 451058, area: 5639 },
  'ratnapura': { population: 1088007, area: 3275 },
  'kegalle': { population: 840648, area: 1693 },
  'trincomalee': { population: 379541, area: 2727 },
  'batticaloa': { population: 526567, area: 2610 },
  'ampara': { population: 649402, area: 4415 }
};

// Services per district
const getServicesForDistrict = (districtId) => {
  if (['colombo', 'gampaha', 'kandy'].includes(districtId)) {
    return ['home-cleaning', 'moving-delivery', 'business-admin', 'creative-digital', 'events-entertainment', 'beauty-wellness', 'automotive', 'pet-care', 'lessons-training'];
  } else if (popularDistricts.includes(districtId)) {
    return ['home-cleaning', 'moving-delivery', 'home-improvements', 'business-admin', 'automotive', 'pet-care'];
  } else {
    return ['home-cleaning', 'moving-delivery', 'home-improvements', 'automotive'];
  }
};

// Function to convert lat/lon coordinates to SVG coordinates
function convertToSVG(coordinates) {
  // Sri Lanka bounds approximately:
  // Latitude: 5.9° to 9.9° N
  // Longitude: 79.5° to 81.9° E
  
  const minLat = 5.9;
  const maxLat = 9.9;
  const minLon = 79.5;
  const maxLon = 81.9;
  
  // SVG viewBox: 0 0 800 1200 (matching our map component)
  const svgWidth = 800;
  const svgHeight = 1200;
  
  // Add padding
  const padding = 50;
  const usableWidth = svgWidth - (2 * padding);
  const usableHeight = svgHeight - (2 * padding);
  
  return coordinates.map(ring => {
    return ring.map(([lon, lat]) => {
      // Validate coordinates
      if (typeof lon !== 'number' || typeof lat !== 'number' || isNaN(lon) || isNaN(lat)) {
        console.warn(`Invalid coordinate: [${lon}, ${lat}]`);
        return [0, 0];
      }
      
      // Normalize to 0-1 range
      const x = (lon - minLon) / (maxLon - minLon);
      const y = 1 - ((lat - minLat) / (maxLat - minLat)); // Invert Y axis
      
      // Scale to SVG coordinates with padding
      return [
        padding + (x * usableWidth),
        padding + (y * usableHeight)
      ];
    });
  });
}

// Function to simplify polygon (Douglas-Peucker algorithm)
function simplifyPolygon(points, tolerance = 2) {
  if (points.length <= 2) return points;
  
  function perpendicularDistance(point, lineStart, lineEnd) {
    const [x, y] = point;
    const [x1, y1] = lineStart;
    const [x2, y2] = lineEnd;
    
    const dx = x2 - x1;
    const dy = y2 - y1;
    const mag = Math.sqrt(dx * dx + dy * dy);
    
    if (mag === 0) return Math.sqrt((x - x1) ** 2 + (y - y1) ** 2);
    
    const u = ((x - x1) * dx + (y - y1) * dy) / (mag * mag);
    const ix = x1 + u * dx;
    const iy = y1 + u * dy;
    
    return Math.sqrt((x - ix) ** 2 + (y - iy) ** 2);
  }
  
  function douglasPeucker(points, tolerance) {
    if (points.length <= 2) return points;
    
    let maxDistance = 0;
    let index = 0;
    const end = points.length - 1;
    
    for (let i = 1; i < end; i++) {
      const distance = perpendicularDistance(points[i], points[0], points[end]);
      if (distance > maxDistance) {
        maxDistance = distance;
        index = i;
      }
    }
    
    if (maxDistance > tolerance) {
      const left = douglasPeucker(points.slice(0, index + 1), tolerance);
      const right = douglasPeucker(points.slice(index), tolerance);
      return [...left.slice(0, -1), ...right];
    }
    
    return [points[0], points[end]];
  }
  
  return douglasPeucker(points, tolerance);
}

// Function to calculate centroid
function calculateCentroid(points) {
  let x = 0, y = 0;
  points.forEach(([px, py]) => {
    x += px;
    y += py;
  });
  return {
    x: Math.round(x / points.length),
    y: Math.round(y / points.length)
  };
}

// Function to create SVG path from coordinates
function createSVGPath(geometry, simplify = true) {
  const { type, coordinates } = geometry;
  
  let allPolygons = [];
  
  // Handle both Polygon and MultiPolygon
  if (type === 'MultiPolygon') {
    // Include ALL polygons from MultiPolygon (important for islands like Jaffna)
    allPolygons = coordinates;
  } else if (type === 'Polygon') {
    allPolygons = [coordinates];
  } else {
    console.warn(`Unsupported geometry type: ${type}`);
    return { path: '', center: { x: 400, y: 600 } };
  }
  
  if (!allPolygons || allPolygons.length === 0) {
    console.warn('No coordinates found');
    return { path: '', center: { x: 400, y: 600 } };
  }
  
  // Process all polygons and combine into one path
  const pathParts = [];
  let allPoints = [];
  
  allPolygons.forEach(polygonCoords => {
    const svgCoords = convertToSVG(polygonCoords);
    const mainRing = svgCoords[0];
    
    // Simplify if requested
    const points = simplify ? simplifyPolygon(mainRing, 1.5) : mainRing;
    
    if (points.length === 0) return;
    
    // Add points for centroid calculation
    allPoints = allPoints.concat(points);
    
    // Create path for this polygon
    const polygonPath = points.map((coord, i) => {
      const [x, y] = coord;
      const roundedX = Math.round(x * 10) / 10;
      const roundedY = Math.round(y * 10) / 10;
      return i === 0 ? `M ${roundedX},${roundedY}` : `L ${roundedX},${roundedY}`;
    });
    
    polygonPath.push('Z'); // Close the path
    pathParts.push(polygonPath.join(' '));
  });
  
  if (pathParts.length === 0 || allPoints.length === 0) {
    return { path: '', center: { x: 400, y: 600 } };
  }
  
  // Calculate centroid from all points
  const center = calculateCentroid(allPoints);
  
  return {
    path: pathParts.join(' '),
    center
  };
}

// Process each feature
const districts = geojson.features.map(feature => {
  const geoName = feature.properties.name;
  const mapping = districtMapping[geoName];
  
  if (!mapping) {
    console.warn(`No mapping found for: ${geoName}`);
    return null;
  }
  
  const { path, center } = createSVGPath(feature.geometry);
  const data = districtData[mapping.id] || { population: 0, area: 0 };
  
  if (!path || path === '') {
    console.warn(`Failed to generate path for: ${geoName}`);
    return null;
  }
  
  return {
    id: mapping.id,
    name: mapping.name,
    nameSi: mapping.nameSi,
    nameTa: mapping.nameTa,
    province: provinceMapping[mapping.id],
    population: data.population,
    area: data.area,
    coordinates: path,
    center: center,
    popular: popularDistricts.includes(mapping.id),
    services: getServicesForDistrict(mapping.id)
  };
}).filter(Boolean);

// Sort districts alphabetically
districts.sort((a, b) => a.name.localeCompare(b.name));

// Generate TypeScript file
const output = `// Sri Lankan districts data with accurate geographic coordinates
// Generated from GeoJSON data source: SimpleMaps
// Coordinates are converted to SVG paths for optimal rendering

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

export const districts: District[] = ${JSON.stringify(districts, null, 2)};

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
`;

// Write the output file
const outputPath = path.join(__dirname, '../src/data/districts.ts');
fs.writeFileSync(outputPath, output, 'utf8');

console.log('✅ Successfully converted GeoJSON to SVG paths!');
console.log(`📝 Output written to: ${outputPath}`);
console.log(`📊 Processed ${districts.length} districts`);

