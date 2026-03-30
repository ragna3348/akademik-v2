const prisma = require('../../prisma/client');
const fs = require('fs');

const buildFilePath = (file) => {
    if (!file) return null;
    return '/' + file.path.replace(/\\/g, '/').replace(/^\//, '');
};

const getByPendaftar = async (req, res) => {
    try {
        const data = await prisma.pembayaranMaba.findMany({
            where: { pendaftarId: parseInt(req.params.pendaftarId) },
            include: { pendaftar: true }
        });
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const uploadBukti = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const buktiBayar = buildFilePath(req.files?.buktiBayar?.[0]);

        if (!buktiBayar) {
            return res.status(400).json({ success: false, message: 'Harap upload file bukti pembayaran!' });
        }

        const data = await prisma.pembayaranMaba.update({
            where: { id },
            data: { buktiBayar }
        });

        // Update status pendaftar menjadi BAYAR (Menunggu Verifikasi)
        await prisma.pendaftar.update({
            where: { id: data.pendaftarId },
            data: { status: 'BAYAR' }
        });

        res.json({ success: true, message: 'Bukti pembayaran berhasil diupload! Menunggu verifikasi admin.', data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const konfirmasi = async (req, res) => {
    try {
        const data = await prisma.pembayaranMaba.update({
            where: { id: parseInt(req.params.id) },
            data: { status: 'SUDAH_BAYAR' },
            include: { pendaftar: true }
        });

        // Cek apakah semua pembayaran jenisnya sudah lunas
        const semuaPembayaran = await prisma.pembayaranMaba.findMany({
            where: { pendaftarId: data.pendaftarId }
        });

        const semuaLunas = semuaPembayaran.every(p => p.status === 'SUDAH_BAYAR');

        // Update status pendaftar jadi UJIAN jika semua lunas
        if (semuaLunas) {
            await prisma.pendaftar.update({
                where: { id: data.pendaftarId },
                data: { status: 'UJIAN' }
            });
        }

        res.json({
            success: true,
            message: 'Pembayaran berhasil dikonfirmasi!',
            data,
            semuaLunas
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getByPendaftar, konfirmasi, uploadBukti };