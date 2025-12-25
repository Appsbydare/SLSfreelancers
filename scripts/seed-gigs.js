/**
 * Seed script to populate sample gigs into the database
 * Run with: node scripts/seed-gigs.js
 * 
 * Note: This requires Supabase credentials to be configured
 */

const fs = require('fs');
const path = require('path');

// Load sample gigs data
const sampleGigsPath = path.join(__dirname, '../data/sample-gigs.json');
const sampleGigs = JSON.parse(fs.readFileSync(sampleGigsPath, 'utf8'));

console.log(`Loaded ${sampleGigs.length} sample gigs from data/sample-gigs.json`);
console.log('\nTo seed these gigs into your database:');
console.log('1. Ensure you have Supabase configured');
console.log('2. Create seller/tasker accounts first');
console.log('3. Update this script to use your Supabase client');
console.log('4. Run: node scripts/seed-gigs.js\n');

// This is a template - you'll need to implement the actual database insertion
// using your Supabase client configuration

async function seedGigs() {
  console.log('Sample gigs data structure:');
  console.log(JSON.stringify(sampleGigs[0], null, 2));
  console.log('\nTotal gigs to seed:', sampleGigs.length);
  
  // TODO: Implement actual database insertion
  // Example structure:
  // for (const gigData of sampleGigs) {
  //   // 1. Create gig
  //   // 2. Create packages for the gig
  //   // 3. Link to seller_id
  // }
}

if (require.main === module) {
  seedGigs().catch(console.error);
}

module.exports = { sampleGigs };

