// This script ensures Prisma Client is generated during Vercel deployments
const { exec } = require('child_process');

console.log('Running prisma generate script for Vercel deployment...');

exec('npx prisma generate', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error during prisma generate: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }
  console.log(`stdout: ${stdout}`);
  console.log('Prisma Client was generated successfully!');
}); 