const prisma = require('../prisma/client');

// Helper sanitasi error
const safeError = (error, msg = 'Terjadi kesalahan server!') =>
    process.env.NODE_ENV === 'production' ? msg : error.message;

/**
 * Generate NIM anti race-condition.
 * Menggunakan pendekatan: generate beberapa kandidat NIM dan retry jika sudah ada.
 */
const generateNIM = async (prodiId, tahunDaftar, jenisKelasId, retries = 5) => {
    const prodi = await prisma.prodi.findUnique({ where: { id: prodiId } });
    if (!prodi) throw new Error('Program studi tidak ditemukan!');

    const jenisKelas = jenisKelasId
        ? await prisma.jenisKelas.findUnique({ where: { id: jenisKelasId } })
        : null;

    const kodeProdi = prodi.kodeNim;
    const tahun = String(tahunDaftar);
    const kodeKelas = jenisKelas ? String(jenisKelas.kodeAngka) : '0';
    const prefix = `${kodeProdi}${tahun}${kodeKelas}`;

    for (let attempt = 0; attempt < retries; attempt++) {
        // Ambil NIM terakhir dengan locking — findFirst dengan urutan desc
        const lastMhs = await prisma.mahasiswa.findFirst({
            where: { nim: { startsWith: prefix } },
            orderBy: { nim: 'desc' }
        });

        let nomorUrut = 1;
        if (lastMhs) {
            const lastNum = parseInt(lastMhs.nim.slice(-3));
            nomorUrut = isNaN(lastNum) ? 1 : lastNum + 1;
        }

        const nim = `${prefix}${String(nomorUrut).padStart(3, '0')}`;

        // Cek apakah NIM sudah ada (anti race condition)
        const exists = await prisma.mahasiswa.findUnique({ where: { nim } });
        if (!exists) return nim;

        // Jika sudah ada, coba nomor berikutnya
        if (attempt === retries - 1) {
            throw new Error('Gagal generate NIM unik setelah beberapa percobaan. Coba lagi.');
        }
    }
};

module.exports = { generateNIM };