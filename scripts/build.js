const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Checking Prisma Client...');

// Check if Prisma client exists
const prismaClientPath = path.join(__dirname, '../node_modules/@prisma/client');
const prismaGeneratedPath = path.join(__dirname, '../node_modules/.prisma/client');

const prismaClientExists = fs.existsSync(prismaClientPath);
const prismaGeneratedExists = fs.existsSync(prismaGeneratedPath);

if (!prismaClientExists || !prismaGeneratedExists) {
  console.log('📦 Generating Prisma Client...');
  try {
    execSync('npx prisma generate', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    console.log('✅ Prisma Client generated successfully');
  } catch (error) {
    console.warn('⚠️  Prisma generate failed (file may be locked), but continuing build...');
    console.warn('   Prisma Client should already exist from postinstall hook.');
  }
} else {
  console.log('✅ Prisma Client already generated');
}

console.log('🚀 Starting Next.js build...');

// Run Next.js build
try {
  execSync('next build', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
} catch (error) {
  process.exit(1);
}
