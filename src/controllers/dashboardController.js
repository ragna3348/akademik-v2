const prisma = require('../prisma/client');

const getDashboard = async (req, res) => {
    try {
        const [
            totalMahasiswa,
            totalDosen,
            totalProdi,
            totalMataKuliah,
            totalPendaftar,
            pendaftarLulus,
            pendaftarGugur,
            krsMenunggu,
            tagihanBelumBayar,
            mahasiswaPerProdi,
            pendaftarPerGelombang,
            mahasiswaPerStatus,
            pendaftarPerBulan,
            krsPerStatus,
        ] = await Promise.all([
            prisma.mahasiswa.count(),
            prisma.dosen.count({ where: { isAktif: true } }),
            prisma.prodi.count({ where: { isAktif: true } }),
            prisma.mataKuliah.count({ where: { isAktif: true } }),
            prisma.pendaftar.count(),
            prisma.pendaftar.count({ where: { status: 'LULUS' } }),
            prisma.pendaftar.count({ where: { status: 'GAGAL' } }),
            prisma.kRS.count({ where: { status: 'DIAJUKAN' } }),
            prisma.keuangan.aggregate({
                where: { status: 'belum_bayar' },
                _sum: { nominal: true },
                _count: true
            }),
            prisma.mahasiswa.groupBy({
                by: ['prodiId'],
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 8
            }),
            prisma.pendaftar.groupBy({
                by: ['gelombangId'],
                _count: { id: true },
                where: { gelombangId: { not: null } }
            }),
            prisma.mahasiswa.groupBy({
                by: ['status'],
                _count: { id: true }
            }),
            prisma.pendaftar.findMany({
                select: { createdAt: true },
                orderBy: { createdAt: 'desc' },
                take: 200
            }),
            prisma.kRS.groupBy({
                by: ['status'],
                _count: { id: true }
            })
        ]);

        // Resolve nama prodi
        const prodiIds = mahasiswaPerProdi.map(p => p.prodiId);
        const prodiList = await prisma.prodi.findMany({
            where: { id: { in: prodiIds } },
            select: { id: true, nama: true, jenjang: true }
        });
        const prodiMap = Object.fromEntries(prodiList.map(p => [p.id, p]));

        // Resolve nama gelombang
        const gelombangIds = pendaftarPerGelombang.map(p => p.gelombangId).filter(Boolean);
        const gelombangList = await prisma.gelombang.findMany({
            where: { id: { in: gelombangIds } },
            select: { id: true, nama: true, tahun: true }
        });
        const gelombangMap = Object.fromEntries(gelombangList.map(g => [g.id, g]));

        // Pendaftar per bulan (6 bulan terakhir)
        const now = new Date();
        const bulanData = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const label = d.toLocaleString('id-ID', { month: 'short', year: 'numeric' });
            const count = pendaftarPerBulan.filter(p => {
                const pd = new Date(p.createdAt);
                return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear();
            }).length;
            bulanData.push({ label, count });
        }

        // Aktivitas terbaru
        const [pendaftarBaru, krsBaru] = await Promise.all([
            prisma.pendaftar.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: { nama: true, prodi: { select: { nama: true } }, createdAt: true, status: true }
            }),
            prisma.kRS.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                where: { status: 'DIAJUKAN' },
                select: {
                    mahasiswa: { select: { nama: true, nim: true } },
                    periode: { select: { nama: true } },
                    totalSks: true,
                    createdAt: true
                }
            })
        ]);

        res.json({
            success: true,
            data: {
                stats: {
                    totalMahasiswa,
                    totalDosen,
                    totalProdi,
                    totalMataKuliah,
                    totalPendaftar,
                    pendaftarLulus,
                    pendaftarGugur,
                    pendaftarProses: totalPendaftar - pendaftarLulus - pendaftarGugur,
                    krsMenunggu,
                    tagihanBelumBayar: tagihanBelumBayar._count,
                    totalTagihanBelumBayar: tagihanBelumBayar._sum.nominal || 0
                },
                charts: {
                    mahasiswaPerProdi: mahasiswaPerProdi.map(p => ({
                        nama: prodiMap[p.prodiId]?.nama || 'Unknown',
                        jenjang: prodiMap[p.prodiId]?.jenjang || '',
                        total: p._count.id
                    })),
                    pendaftarPerGelombang: pendaftarPerGelombang.map(p => ({
                        nama: gelombangMap[p.gelombangId]?.nama || 'Tanpa Gelombang',
                        tahun: gelombangMap[p.gelombangId]?.tahun || '',
                        total: p._count.id
                    })),
                    mahasiswaPerStatus: mahasiswaPerStatus.map(s => ({
                        status: s.status,
                        total: s._count.id
                    })),
                    pendaftarPerBulan: bulanData,
                    krsPerStatus: krsPerStatus.map(k => ({
                        status: k.status,
                        total: k._count.id
                    }))
                },
                aktivitas: {
                    pendaftarBaru,
                    krsBaru
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getDashboard };