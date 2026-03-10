const prisma = require('../../prisma/client');
const { kirimEmail } = require('../../utils/emailSender');

// GET /akademik/krs — list semua KRS
const getAll = async (req, res) => {
    try {
        const { status, periodeId, prodiId } = req.query;

        const where = {};
        if (status) where.status = status;
        if (periodeId) where.periodeId = parseInt(periodeId);
        if (prodiId) where.mahasiswa = { prodiId: parseInt(prodiId) };

        const data = await prisma.kRS.findMany({
            where,
            include: {
                mahasiswa: { include: { prodi: true, jenisKelas: true } },
                periode: true,
                detailKRS: { include: { mataKuliah: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ success: true, total: data.length, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /akademik/krs/periode — list periode KRS
const getPeriode = async (req, res) => {
    try {
        const data = await prisma.periodeKRS.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /akademik/krs/periode — buat periode baru
const createPeriode = async (req, res) => {
    try {
        const { nama, tahunAjaran, semester, tanggalBuka, tanggalTutup } = req.body;
        if (!nama || !tahunAjaran || !tanggalBuka || !tanggalTutup) {
            return res.status(400).json({ success: false, message: 'Semua field harus diisi!' });
        }

        // Nonaktifkan periode lain dulu jika ini aktif
        const data = await prisma.periodeKRS.create({
            data: {
                nama,
                tahunAjaran,
                semester: parseInt(semester),
                tanggalBuka: new Date(tanggalBuka),
                tanggalTutup: new Date(tanggalTutup),
                isAktif: false
            }
        });

        res.status(201).json({ success: true, message: 'Periode berhasil dibuat!', data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /akademik/krs/periode/:id/aktifkan
const aktifkanPeriode = async (req, res) => {
    try {
        // Nonaktifkan semua dulu
        await prisma.periodeKRS.updateMany({ data: { isAktif: false } });

        const data = await prisma.periodeKRS.update({
            where: { id: parseInt(req.params.id) },
            data: { isAktif: true }
        });

        res.json({ success: true, message: 'Periode berhasil diaktifkan!', data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /akademik/krs/periode/:id
const deletePeriode = async (req, res) => {
    try {
        await prisma.periodeKRS.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ success: true, message: 'Periode berhasil dihapus!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /akademik/krs/:id/setujui
const setujui = async (req, res) => {
    try {
        const krs = await prisma.kRS.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                mahasiswa: true,
                periode: true,
                detailKRS: { include: { mataKuliah: true } }
            }
        });

        if (!krs) return res.status(404).json({ success: false, message: 'KRS tidak ditemukan!' });

        const updated = await prisma.kRS.update({
            where: { id: krs.id },
            data: { status: 'DISETUJUI', catatanTolak: null }
        });

        // Kirim email notifikasi
        try {
            const daftarMK = krs.detailKRS.map(d =>
                `<tr><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;">${d.mataKuliah?.nama}</td><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${d.mataKuliah?.sks} SKS</td></tr>`
            ).join('');

            await kirimEmail(
                krs.mahasiswa.email,
                '✅ KRS Anda Telah Disetujui',
                `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
                    <div style="background:#4f46e5;padding:24px;border-radius:8px 8px 0 0;">
                        <h2 style="color:white;margin:0;">🎓 Persetujuan KRS</h2>
                    </div>
                    <div style="background:#fff;border:1px solid #e0e0e0;padding:32px;border-radius:0 0 8px 8px;">
                        <p style="color:#333;">Yth. <strong>${krs.mahasiswa.nama}</strong>,</p>
                        <p style="color:#333;">KRS Anda untuk periode <strong>${krs.periode?.nama}</strong> telah <strong style="color:#16a34a;">DISETUJUI</strong>.</p>
                        <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">
                            <thead><tr style="background:#f3f4f6;">
                                <th style="padding:8px 12px;text-align:left;">Mata Kuliah</th>
                                <th style="padding:8px 12px;text-align:center;">SKS</th>
                            </tr></thead>
                            <tbody>${daftarMK}</tbody>
                            <tfoot><tr style="background:#eff6ff;">
                                <td style="padding:8px 12px;font-weight:bold;">Total</td>
                                <td style="padding:8px 12px;text-align:center;font-weight:bold;">${krs.totalSks} SKS</td>
                            </tr></tfoot>
                        </table>
                        <p style="color:#6b7280;font-size:13px;border-top:1px solid #e5e7eb;padding-top:16px;">
                            Email ini dikirim otomatis oleh sistem akademik.
                        </p>
                    </div>
                </div>
                `
            );
        } catch (e) { console.error('Gagal kirim email:', e); }

        res.json({ success: true, message: 'KRS berhasil disetujui!', data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /akademik/krs/:id/tolak
const tolak = async (req, res) => {
    try {
        const { catatan } = req.body;

        const krs = await prisma.kRS.findUnique({
            where: { id: parseInt(req.params.id) },
            include: { mahasiswa: true, periode: true }
        });

        if (!krs) return res.status(404).json({ success: false, message: 'KRS tidak ditemukan!' });

        const updated = await prisma.kRS.update({
            where: { id: krs.id },
            data: { status: 'DITOLAK', catatanTolak: catatan || null }
        });

        // Kirim email notifikasi
        try {
            await kirimEmail(
                krs.mahasiswa.email,
                '❌ KRS Anda Ditolak',
                `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
                    <div style="background:#dc2626;padding:24px;border-radius:8px 8px 0 0;">
                        <h2 style="color:white;margin:0;">🎓 Persetujuan KRS</h2>
                    </div>
                    <div style="background:#fff;border:1px solid #e0e0e0;padding:32px;border-radius:0 0 8px 8px;">
                        <p style="color:#333;">Yth. <strong>${krs.mahasiswa.nama}</strong>,</p>
                        <p style="color:#333;">KRS Anda untuk periode <strong>${krs.periode?.nama}</strong> telah <strong style="color:#dc2626;">DITOLAK</strong>.</p>
                        ${catatan ? `
                        <div style="background:#fef2f2;border:1px solid #fecaca;padding:16px;border-radius:8px;margin:16px 0;">
                            <p style="margin:0;color:#991b1b;"><strong>Catatan:</strong> ${catatan}</p>
                        </div>` : ''}
                        <p style="color:#333;">Silakan ajukan ulang KRS Anda dengan perbaikan yang diperlukan melalui portal mahasiswa.</p>
                        <p style="color:#6b7280;font-size:13px;border-top:1px solid #e5e7eb;padding-top:16px;">
                            Email ini dikirim otomatis oleh sistem akademik.
                        </p>
                    </div>
                </div>
                `
            );
        } catch (e) { console.error('Gagal kirim email:', e); }

        res.json({ success: true, message: 'KRS berhasil ditolak!', data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /akademik/krs/:id/setujui-massal
const setujuiMassal = async (req, res) => {
    try {
        const { krsIds } = req.body;
        if (!krsIds || krsIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Pilih minimal 1 KRS!' });
        }

        await prisma.kRS.updateMany({
            where: { id: { in: krsIds.map(Number) }, status: 'DIAJUKAN' },
            data: { status: 'DISETUJUI', catatanTolak: null }
        });

        res.json({ success: true, message: `${krsIds.length} KRS berhasil disetujui!` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAll, getPeriode, createPeriode, aktifkanPeriode, deletePeriode, setujui, tolak, setujuiMassal };