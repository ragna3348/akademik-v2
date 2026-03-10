const prisma = require('../../prisma/client');
const { generateNIM } = require('../../utils/nimGenerator');
const { kirimEmail } = require('../../utils/emailSender');

// GET /heregistrasi — list pendaftar LULUS
const getAll = async (req, res) => {
    try {
        const data = await prisma.pendaftar.findMany({
            where: { status: 'LULUS' },
            include: {
                prodi: true,
                gelombang: true,
                jenisKelas: true,
                pembayaran: true
            },
            orderBy: { createdAt: 'desc' }
        });

        const result = await Promise.all(data.map(async (p) => {
            const mahasiswa = await prisma.mahasiswa.findFirst({
                where: { email: p.email }
            });
            return { ...p, sudahRegistrasi: !!mahasiswa, mahasiswa };
        }));

        res.json({ success: true, total: result.length, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Alias GET /heregistrasi/calon
const getCalon = async (req, res) => {
    return getAll(req, res);
};

// GET /heregistrasi/mahasiswa — list mahasiswa aktif
const getMahasiswa = async (req, res) => {
    try {
        const data = await prisma.mahasiswa.findMany({
            include: { prodi: true, jenisKelas: true, dosenWali: true },
            orderBy: { nim: 'asc' }
        });
        res.json({ success: true, total: data.length, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /heregistrasi/proses/:pendaftarId
const proses = async (req, res) => {
    try {
        const pendaftarId = parseInt(req.params.pendaftarId);
        const pendaftar = await prisma.pendaftar.findUnique({
            where: { id: pendaftarId },
            include: { prodi: true, jenisKelas: true }
        });

        if (!pendaftar) {
            return res.status(404).json({ success: false, message: 'Pendaftar tidak ditemukan!' });
        }
        if (pendaftar.status !== 'LULUS') {
            return res.status(400).json({ success: false, message: 'Pendaftar belum berstatus LULUS!' });
        }

        const existing = await prisma.mahasiswa.findFirst({ where: { email: pendaftar.email } });
        if (existing) {
            return res.status(400).json({ success: false, message: `Sudah diregistrasi dengan NIM ${existing.nim}!` });
        }

        // Generate NIM
        const nim = await generateNIM(
            pendaftar.prodiId,
            pendaftar.tahunDaftar,
            pendaftar.jenisKelasId
        );

        // Buat mahasiswa
        const mahasiswa = await prisma.mahasiswa.create({
            data: {
                nim,
                nama: pendaftar.nama,
                email: pendaftar.email,
                telepon: pendaftar.telepon,
                alamat: pendaftar.alamat,
                foto: pendaftar.foto,
                tahunAngkatan: pendaftar.tahunDaftar,
                semester: 1,
                status: 'AKTIF',
                prodiId: pendaftar.prodiId,
                jenisKelasId: pendaftar.jenisKelasId
            },
            include: { prodi: true, jenisKelas: true }
        });

        // Update role: hapus PENDAFTAR, beri MAHASISWA
        const user = await prisma.user.findUnique({ where: { email: pendaftar.email } });
        if (user) {
            await prisma.userRole.deleteMany({ where: { userId: user.id } });
            await prisma.userRole.create({
                data: { userId: user.id, role: 'MAHASISWA' }
            });
        }

        // Kirim email selamat datang
        try {
            const daftarInfo = [
                { label: 'Program Studi', value: mahasiswa.prodi?.nama },
                { label: 'Jenjang', value: mahasiswa.prodi?.jenjang },
                { label: 'Jenis Kelas', value: mahasiswa.jenisKelas?.nama || '-' },
                { label: 'Tahun Angkatan', value: mahasiswa.tahunAngkatan },
                { label: 'Semester', value: 1 },
            ];

            await kirimEmail(
                pendaftar.email,
                'Selamat! Anda Resmi Menjadi Mahasiswa',
                `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #4f46e5; padding: 24px; border-radius: 8px 8px 0 0;">
                        <h2 style="color: white; margin: 0;">🎓 Selamat Datang, Mahasiswa Baru!</h2>
                    </div>
                    <div style="background: #fff; border: 1px solid #e0e0e0; padding: 32px; border-radius: 0 0 8px 8px;">
                        <p style="color: #333;">Yth. <strong>${mahasiswa.nama}</strong>,</p>
                        <p style="color: #333;">Selamat! Anda telah resmi terdaftar sebagai mahasiswa <strong>${mahasiswa.prodi?.nama}</strong>.</p>

                        <div style="background: #eef2ff; border: 1px solid #c7d2fe; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: center;">
                            <p style="margin: 0; color: #6366f1; font-size: 14px;">Nomor Induk Mahasiswa (NIM)</p>
                            <p style="margin: 8px 0 0; color: #3730a3; font-size: 32px; font-weight: bold; letter-spacing: 4px;">${nim}</p>
                        </div>

                        <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                            <table style="width: 100%; font-size: 14px; color: #374151;">
                                ${daftarInfo.map(d => `
                                    <tr>
                                        <td style="padding: 4px 0; color: #6b7280;">${d.label}</td>
                                        <td style="font-weight: bold;">${d.value}</td>
                                    </tr>
                                `).join('')}
                            </table>
                        </div>

                        <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                            <p style="margin: 0; color: #1d4ed8; font-size: 14px;">
                                💡 Silakan login ke portal mahasiswa menggunakan email dan password yang sudah Anda buat sebelumnya.
                                Akun Anda kini telah diaktifkan sebagai Mahasiswa.
                            </p>
                        </div>

                        <p style="color: #6b7280; font-size: 13px; border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 24px;">
                            Email ini dikirim otomatis oleh sistem. Jika ada pertanyaan, hubungi bagian akademik.
                        </p>
                    </div>
                </div>
                `
            );
        } catch (emailError) {
            console.error('Gagal kirim email heregistrasi:', emailError);
        }

        res.json({
            success: true,
            message: `Heregistrasi berhasil! NIM: ${nim}`,
            data: mahasiswa
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /heregistrasi/proses-massal
const prosesMassal = async (req, res) => {
    try {
        const { pendaftarIds } = req.body;
        if (!pendaftarIds || pendaftarIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Pilih minimal 1 pendaftar!' });
        }

        const hasil = [];
        const gagal = [];

        for (const id of pendaftarIds) {
            try {
                const pendaftar = await prisma.pendaftar.findUnique({
                    where: { id: parseInt(id) },
                    include: { prodi: true, jenisKelas: true }
                });

                if (!pendaftar || pendaftar.status !== 'LULUS') {
                    gagal.push({ id, alasan: 'Bukan status LULUS' });
                    continue;
                }

                const existing = await prisma.mahasiswa.findFirst({ where: { email: pendaftar.email } });
                if (existing) {
                    gagal.push({ id, nama: pendaftar.nama, alasan: 'Sudah diregistrasi' });
                    continue;
                }

                const nim = await generateNIM(
                    pendaftar.prodiId,
                    pendaftar.tahunDaftar,
                    pendaftar.jenisKelasId
                );

                await prisma.mahasiswa.create({
                    data: {
                        nim,
                        nama: pendaftar.nama,
                        email: pendaftar.email,
                        telepon: pendaftar.telepon,
                        alamat: pendaftar.alamat,
                        foto: pendaftar.foto,
                        tahunAngkatan: pendaftar.tahunDaftar,
                        semester: 1,
                        status: 'AKTIF',
                        prodiId: pendaftar.prodiId,
                        jenisKelasId: pendaftar.jenisKelasId
                    }
                });

                // Update role: hapus PENDAFTAR, beri MAHASISWA
                const user = await prisma.user.findUnique({ where: { email: pendaftar.email } });
                if (user) {
                    await prisma.userRole.deleteMany({ where: { userId: user.id } });
                    await prisma.userRole.create({
                        data: { userId: user.id, role: 'MAHASISWA' }
                    });
                }

                hasil.push({ id, nama: pendaftar.nama, nim });

            } catch (err) {
                gagal.push({ id, alasan: err.message });
            }
        }

        res.json({
            success: true,
            message: `${hasil.length} berhasil, ${gagal.length} gagal`,
            data: { berhasil: hasil, gagal }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /heregistrasi/pindah-prodi/:mahasiswaId
const pindahProdi = async (req, res) => {
    try {
        const { prodiIdBaru } = req.body;
        const mahasiswaId = parseInt(req.params.mahasiswaId);

        const mahasiswa = await prisma.mahasiswa.findUnique({ where: { id: mahasiswaId } });
        if (!mahasiswa) return res.status(404).json({ success: false, message: 'Mahasiswa tidak ditemukan!' });

        const nimBaru = await generateNIM(prodiIdBaru, mahasiswa.tahunAngkatan, mahasiswa.jenisKelasId);

        const updated = await prisma.mahasiswa.update({
            where: { id: mahasiswaId },
            data: { nim: nimBaru, prodiId: parseInt(prodiIdBaru) },
            include: { prodi: true }
        });

        res.json({ success: true, message: `NIM baru: ${nimBaru}`, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAll, getCalon, proses, prosesMassal, getMahasiswa, pindahProdi };