const prisma = require('../../prisma/client');
const { generateNoPendaftaran } = require('../../utils/noPendaftaran');
const { kirimEmail } = require('../../utils/emailSender');

const getAll = async (req, res) => {
    try {
        const data = await prisma.pendaftar.findMany({
            include: {
                prodi: true,
                gelombang: true,
                jenisKelas: true,
                pembayaran: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, total: data.length, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getById = async (req, res) => {
    try {
        const data = await prisma.pendaftar.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                prodi: true,
                gelombang: true,
                jenisKelas: true,
                pembayaran: true
            }
        });
        if (!data) return res.status(404).json({ success: false, message: 'Pendaftar tidak ditemukan!' });
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const create = async (req, res) => {
    try {
        const {
            nama, nik, nisn, tempatLahir, tanggalLahir,
            jenisKelamin, agama, email, telepon, alamat,
            asalSekolah, tahunLulus, nilaiRaport,
            gelombangId, prodiId, jenisKelasId
        } = req.body;

        if (!nama || !email || !prodiId) {
            return res.status(400).json({
                success: false,
                message: 'Nama, email, dan prodi harus diisi!'
            });
        }

        const existing = await prisma.pendaftar.findUnique({ where: { email } });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Email sudah terdaftar!'
            });
        }

        const tahunDaftar = new Date().getFullYear();
        const noPendaftaran = await generateNoPendaftaran(
            tahunDaftar,
            gelombangId ? parseInt(gelombangId) : 0
        );

        let biayaDaftar = 0;
        if (gelombangId) {
            const gelombang = await prisma.gelombang.findUnique({
                where: { id: parseInt(gelombangId) }
            });
            if (gelombang) biayaDaftar = gelombang.biayaDaftar;
        }

        const foto = req.files?.foto?.[0]
            ? `/${req.files.foto[0].destination}/${req.files.foto[0].filename}`
            : null;
        const dokumenKTP = req.files?.dokumenKTP?.[0]
            ? `/${req.files.dokumenKTP[0].destination}/${req.files.dokumenKTP[0].filename}`
            : null;
        const dokumenKK = req.files?.dokumenKK?.[0]
            ? `/${req.files.dokumenKK[0].destination}/${req.files.dokumenKK[0].filename}`
            : null;
        const dokumenIjazah = req.files?.dokumenIjazah?.[0]
            ? `/${req.files.dokumenIjazah[0].destination}/${req.files.dokumenIjazah[0].filename}`
            : null;

        const data = await prisma.pendaftar.create({
            data: {
                noPendaftaran,
                nama, nik: nik || null, nisn: nisn || null,
                tempatLahir: tempatLahir || null,
                tanggalLahir: tanggalLahir ? new Date(tanggalLahir) : null,
                jenisKelamin: jenisKelamin || null,
                agama: agama || null,
                email, telepon: telepon || null, alamat: alamat || null,
                asalSekolah: asalSekolah || null,
                tahunLulus: tahunLulus ? parseInt(tahunLulus) : null,
                nilaiRaport: nilaiRaport ? parseFloat(nilaiRaport) : null,
                gelombangId: gelombangId ? parseInt(gelombangId) : null,
                prodiId: parseInt(prodiId),
                jenisKelasId: jenisKelasId ? parseInt(jenisKelasId) : null,
                tahunDaftar, foto, dokumenKTP, dokumenKK, dokumenIjazah
            },
            include: { prodi: true, gelombang: true }
        });

        if (gelombangId && biayaDaftar > 0) {
            await prisma.pembayaranMaba.create({
                data: {
                    pendaftarId: data.id,
                    jenis: 'Biaya Pendaftaran',
                    nominal: biayaDaftar,
                    status: 'BELUM_BAYAR'
                }
            });
        }

        res.status(201).json({
            success: true,
            message: 'Pendaftaran berhasil!',
            data
        });

    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ success: false, message: 'Email sudah terdaftar!' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateStatus = async (req, res) => {
    try {
        const { status, alasan } = req.body;
        const pendaftarId = parseInt(req.params.id);

        // Ambil data pendaftar dulu
        const pendaftar = await prisma.pendaftar.findUnique({
            where: { id: pendaftarId },
            include: { prodi: true }
        });

        if (!pendaftar) {
            return res.status(404).json({ success: false, message: 'Pendaftar tidak ditemukan!' });
        }

        // Update status pendaftar
        const data = await prisma.pendaftar.update({
            where: { id: pendaftarId },
            data: { status }
        });

        // Jika GUGUR → hapus akun user + kirim email
        if (status === 'GUGUR') {
            // Hapus user berdasarkan email
            const user = await prisma.user.findUnique({
                where: { email: pendaftar.email }
            });

            if (user) {
                // Hapus UserRole dulu (cascade), lalu User
                await prisma.userRole.deleteMany({ where: { userId: user.id } });
                await prisma.user.delete({ where: { id: user.id } });
            }

            // Kirim email pemberitahuan gugur
            try {
                await kirimEmail(
                    pendaftar.email,
                    'Pemberitahuan Hasil Seleksi Pendaftaran',
                    `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: #1e3a5f; padding: 24px; border-radius: 8px 8px 0 0;">
                            <h2 style="color: white; margin: 0;">🎓 Sistem Informasi Akademik</h2>
                        </div>
                        <div style="background: #fff; border: 1px solid #e0e0e0; padding: 32px; border-radius: 0 0 8px 8px;">
                            <p style="color: #333;">Yth. <strong>${pendaftar.nama}</strong>,</p>
                            <p style="color: #333;">Kami informasikan bahwa hasil seleksi pendaftaran Anda untuk program studi <strong>${pendaftar.prodi?.nama}</strong> dengan nomor pendaftaran <strong>${pendaftar.noPendaftaran}</strong> dinyatakan:</p>

                            <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 4px; margin: 20px 0;">
                                <h3 style="color: #dc2626; margin: 0;">❌ TIDAK LULUS SELEKSI</h3>
                            </div>

                            ${alasan ? `
                            <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 16px; border-radius: 4px; margin: 16px 0;">
                                <p style="margin: 0; color: #374151;"><strong>Alasan:</strong> ${alasan}</p>
                            </div>
                            ` : ''}

                            <p style="color: #333;">Akun pendaftaran Anda telah dihapus dari sistem kami.</p>
                            <p style="color: #333;">Namun Anda <strong>masih dapat mendaftar kembali</strong> pada gelombang berikutnya menggunakan email yang sama.</p>

                            <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 16px; border-radius: 4px; margin: 20px 0;">
                                <p style="margin: 0; color: #1d4ed8;">💡 Untuk mendaftar kembali, kunjungi portal pendaftaran kami dan buat akun baru dengan email yang sama.</p>
                            </div>

                            <p style="color: #6b7280; font-size: 14px; margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
                                Email ini dikirim otomatis oleh sistem. Jika ada pertanyaan, hubungi bagian akademik kami.
                            </p>
                        </div>
                    </div>
                    `
                );
            } catch (emailError) {
                console.error('Gagal kirim email gugur:', emailError);
                // Tetap lanjut meski email gagal
            }
        }

        res.json({
            success: true,
            message: `Status diupdate ke ${status}!${status === 'GUGUR' ? ' Akun pendaftar telah dihapus dan email pemberitahuan telah dikirim.' : ''}`,
            data
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getDashboardStats = async (req, res) => {
    try {
        const [total, sudahBayar, lulus, gugur] = await Promise.all([
            prisma.pendaftar.count(),
            prisma.pendaftar.count({ where: { status: 'BAYAR' } }),
            prisma.pendaftar.count({ where: { status: 'LULUS' } }),
            prisma.pendaftar.count({ where: { status: 'GUGUR' } })
        ]);
        res.json({
            success: true,
            data: {
                totalPendaftar: total,
                sudahBayar,
                lulus,
                gugur,
                belumBayar: total - sudahBayar - lulus - gugur
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAll, getById, create, updateStatus, getDashboardStats };