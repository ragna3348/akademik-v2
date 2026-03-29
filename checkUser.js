const prisma = require('./src/prisma/client');

async function main() {
    console.log('Mencari user superadmin@kampus.ac.id...');
    const user = await prisma.user.findUnique({
        where: { email: 'superadmin@kampus.ac.id' }
    });

    if (user) {
        console.log('User ditemukan!');
        console.log('ID:', user.id);
        console.log('Nama:', user.nama);
        console.log('Status Aktif:', user.status);
        console.log('Hash Password (terenkripsi):', user.password);
    } else {
        console.log('User tidak ditemukan di database Railway!');
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
