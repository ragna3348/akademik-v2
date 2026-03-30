const prisma = require('../src/prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
    // ===== Super Admin =====
    const password = await bcrypt.hash('password123', 10);

    const existing = await prisma.user.findUnique({
        where: { email: 'superadmin@kampus.ac.id' }
    });

    if (!existing) {
        const user = await prisma.user.create({
            data: {
                nama: 'Super Admin',
                email: 'superadmin@kampus.ac.id',
                username: 'superadmin',
                password,
                roles: {
                    create: { role: 'SUPER_ADMIN' }
                }
            }
        });
        console.log('✅ Super Admin berhasil dibuat:', user.email);
    } else {
        await prisma.user.update({
            where: { email: 'superadmin@kampus.ac.id' },
            data: { username: 'superadmin' }
        });
        console.log('✅ Super Admin sudah ada, username diperbarui.');
    }

    // ===== Setting Umum =====
    const settingData = [
        { kunci: 'nama_kampus', nilai: 'Universitas Contoh', keterangan: 'Nama kampus' },
        { kunci: 'singkatan', nilai: 'UNCON', keterangan: 'Singkatan kampus' },
        { kunci: 'alamat', nilai: 'Jl. Contoh No. 1, Kota, Provinsi', keterangan: 'Alamat kampus' },
        { kunci: 'telepon', nilai: '(021) 1234567', keterangan: 'Telepon kampus' },
        { kunci: 'email', nilai: 'info@kampus.ac.id', keterangan: 'Email kampus' },
        { kunci: 'website', nilai: 'https://kampus.ac.id', keterangan: 'Website kampus' },
        { kunci: 'logo', nilai: '', keterangan: 'Path logo kampus' },
        { kunci: 'warna_primer', nilai: '#4f46e5', keterangan: 'Warna tema utama' },
        { kunci: 'tahun_berdiri', nilai: '2000', keterangan: 'Tahun berdiri' },
        { kunci: 'akreditasi', nilai: 'A', keterangan: 'Akreditasi institusi' },
        { kunci: 'max_sks', nilai: '24', keterangan: 'Maksimal SKS per semester' },
        { kunci: 'min_sks', nilai: '12', keterangan: 'Minimal SKS per semester' },
    ];

    for (const s of settingData) {
        await prisma.settingUmum.upsert({
            where: { kunci: s.kunci },
            update: {},
            create: s
        });
    }
    console.log('✅ Setting umum seeded');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());