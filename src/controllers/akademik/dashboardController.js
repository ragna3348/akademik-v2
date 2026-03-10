const prisma = require('../../prisma/client');

const getStats = async (req, res) => {
    try {
        // Ambil semua statistik sekaligus
        const [
            totalMahasiswa,
            totalDosen,
            totalProdi,
            totalMataKuliah,
            mahasiswaAktif,
            tagihan
        ] = await Promise.all([
            prisma.mahasiswa.count(),
            prisma.dosen.count(),
            prisma.prodi.count(),
            prisma.mataKuliah.count(),
            prisma.mahasiswa.count({ where: { status: 'aktif' } }),
            prisma.keuangan.aggregate({
                _sum: { nominal: true },
                where: { status: 'belum_bayar' }
            })
        ]);

        res.json({
            success: true,
            data: {
                totalMahasiswa,
                totalDosen,
                totalProdi,
                totalMataKuliah,
                mahasiswaAktif,
                totalTagihan: tagihan._sum.nominal || 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getStats };