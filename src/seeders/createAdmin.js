const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    const hash = await bcrypt.hash('password123', 10);
    
    const user = await prisma.user.create({
        data: {
            nama: 'Super Admin',
            email: 'superadmin@kampus.ac.id',
            password: hash,
            roles: {
                create: [{ role: 'SUPER_ADMIN' }]
            }
        }
    });
    
    console.log('✅ Super Admin berhasil dibuat!');
    console.log('Email:', user.email);
    console.log('Password: password123');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());