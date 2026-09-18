import { seedDatabase, getDatabaseHealth, DB_PATH } from './database.js';

console.log(`🌱 Seeding SQLite database at: ${DB_PATH}`);
const success = seedDatabase();

if (success) {
  const health = getDatabaseHealth();
  console.log('✅ Database seeded successfully!');
  console.log(`📊 Total Notes: ${health.tables?.notes}, Total Sections: ${health.tables?.sections}`);
  console.log(`💾 Database file size: ${health.sizeKB}`);
} else {
  console.error('❌ Failed to seed database.');
  process.exit(1);
}
