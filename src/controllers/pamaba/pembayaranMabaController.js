const prisma = require('../../prisma/client');

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

const konfirmasi = async (req, res) => {
    try {
        const data = await prisma.pembayaranMaba.update({
            where: { id: parseInt(req.params.id) },
            data: { status: 'SUDAH_BAYAR' },
            include: { pendaftar: true }
        });

        // Cek apakah semua pembayaran lunas
        const semuaPembayaran = await prisma.pembayaranMaba.findMany({
            where: { pendaftarId: data.pendaftarId }
        });

        const semuaLunas = semuaPembayaran.every(p => p.status === 'SUDAH_BAYAR');

        // Update status pendaftar jadi BAYAR jika semua lunas
        if (semuaLunas) {
            await prisma.pendaftar.update({
                where: { id: data.pendaftarId },
                data: { status: 'BAYAR' }
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

module.exports = { getByPendaftar, konfirmasi };