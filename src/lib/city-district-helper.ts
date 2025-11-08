import { districts, City, District } from '@/data/districts';

export interface CityWithDistricts {
  city: City;
  districts: District[];
}

/**
 * Get all unique cities from all districts
 * Maps each city to its district(s) - handles cities that appear in multiple districts
 */
export function getAllCitiesWithDistricts(): CityWithDistricts[] {
  const cityMap = new Map<string, { city: City; districts: District[] }>();

  districts.forEach((district) => {
    district.cities.forEach((city) => {
      const cityKey = city.name.toLowerCase();
      
      if (cityMap.has(cityKey)) {
        // City already exists, add this district to its list
        const existing = cityMap.get(cityKey)!;
        // Check if district is not already added
        if (!existing.districts.find(d => d.id === district.id)) {
          existing.districts.push(district);
        }
      } else {
        // New city, create entry
        cityMap.set(cityKey, {
          city,
          districts: [district]
        });
      }
    });
  });

  // Convert map to array and sort by city name
  return Array.from(cityMap.values()).sort((a, b) => 
    a.city.name.localeCompare(b.city.name)
  );
}

/**
 * Get all unique cities (just the city objects)
 */
export function getAllCities(): City[] {
  const cities = getAllCitiesWithDistricts();
  return cities.map(item => item.city);
}

/**
 * Get districts for a specific city name
 */
export function getDistrictsForCity(cityName: string): District[] {
  const cityData = getAllCitiesWithDistricts().find(
    item => item.city.name.toLowerCase() === cityName.toLowerCase()
  );
  return cityData?.districts || [];
}

/**
 * Get city by name
 */
export function getCityByName(cityName: string): City | undefined {
  const cityData = getAllCitiesWithDistricts().find(
    item => item.city.name.toLowerCase() === cityName.toLowerCase()
  );
  return cityData?.city;
}

