const prisma = require('./src/prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
    console.log('Mereset password superadmin di Railway...');
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    await prisma.user.update({
        where: { email: 'superadmin@kampus.ac.id' },
        data: {
            password: hashedPassword,
            status: true
        }
    });
    console.log('Sukses: Password dikembalikan ke password123 dan akun diaktifkan!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
