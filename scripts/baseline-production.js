#!/usr/bin/env node

/**
 * This script baselines the production database by marking all existing migrations as applied.
 * Run this ONCE to set up migration tracking on an existing database.
 * 
 * Usage: node scripts/baseline-production.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking for migrations...\n');

// Get all migration directories
const migrationsPath = path.join(__dirname, '../prisma/migrations');
const migrations = fs.readdirSync(migrationsPath)
  .filter(file => {
    const fullPath = path.join(migrationsPath, file);
    return fs.statSync(fullPath).isDirectory();
  })
  .sort();

console.log(`Found ${migrations.length} migrations:\n`);
migrations.forEach((m, i) => console.log(`  ${i + 1}. ${m}`));

console.log('\n📋 This script will mark ALL these migrations as already applied.');
console.log('⚠️  Only run this if your production database already has these schema changes!\n');

// Ask for confirmation
console.log('Starting baseline process...\n');

let successCount = 0;
let errorCount = 0;

for (const migration of migrations) {
  try {
    console.log(`✓ Marking ${migration} as applied...`);
    execSync(
      `npx prisma migrate resolve --applied "${migration}"`,
      { 
        stdio: 'pipe',
        cwd: path.join(__dirname, '..'),
      }
    );
    successCount++;
  } catch (error) {
    console.error(`✗ Failed to mark ${migration}: ${error.message}`);
    errorCount++;
  }
}

console.log('\n' + '='.repeat(60));
console.log(`\n✅ Successfully marked ${successCount} migrations as applied`);
if (errorCount > 0) {
  console.log(`❌ Failed to mark ${errorCount} migrations`);
}

console.log('\n🎉 Database baseline complete!');
console.log('\nYou can now safely use "prisma migrate deploy" in production.\n');

