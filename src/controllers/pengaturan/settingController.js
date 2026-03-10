const prisma = require('../../prisma/client');
const path = require('path');
const fs = require('fs');

const getAll = async (req, res) => {
    try {
        const data = await prisma.settingUmum.findMany({ orderBy: { kunci: 'asc' } });
        // Ubah ke format object { kunci: nilai }
        const settings = Object.fromEntries(data.map(s => [s.kunci, s.nilai]));
        res.json({ success: true, data: settings, raw: data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const update = async (req, res) => {
    try {
        const settings = req.body; // { kunci: nilai, ... }

        const updates = Object.entries(settings).map(([kunci, nilai]) =>
            prisma.settingUmum.upsert({
                where: { kunci },
                update: { nilai: String(nilai) },
                create: { kunci, nilai: String(nilai) }
            })
        );

        await Promise.all(updates);
        res.json({ success: true, message: 'Pengaturan berhasil disimpan!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const uploadLogo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'File logo tidak ditemukan!' });
        }

        const logoPath = `/uploads/logo/${req.file.filename}`;

        // Hapus logo lama jika ada
        const existing = await prisma.settingUmum.findUnique({ where: { kunci: 'logo' } });
        if (existing?.nilai) {
            const oldPath = path.join(__dirname, '../../../public', existing.nilai);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }

        await prisma.settingUmum.upsert({
            where: { kunci: 'logo' },
            update: { nilai: logoPath },
            create: { kunci: 'logo', nilai: logoPath }
        });

        res.json({ success: true, message: 'Logo berhasil diupload!', data: { path: logoPath } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAll, update, uploadLogo };