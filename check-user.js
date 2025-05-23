const { PrismaClient } = require('@prisma/client');

async function checkUser() {
  const prisma = new PrismaClient();
  
  try {
    const user = await prisma.user.findUnique({
      where: {
        email: 's.tcukanov2@gmail.com'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
    
    if (user) {
      console.log('User found:');
      console.log(`ID: ${user.id}`);
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Created: ${user.createdAt}`);
      
      if (user.role === 'ADMIN') {
        console.log('\n✅ User has ADMIN role - should be able to access admin pages');
      } else {
        console.log(`\n❌ User role is ${user.role} - needs to be ADMIN to access admin pages`);
      }
    } else {
      console.log('❌ User not found with email: s.tcukanov2@gmail.com');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser(); 