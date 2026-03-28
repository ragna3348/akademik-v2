const prisma = require('../prisma/client');

/**
 * Generate nomor pendaftaran anti race-condition.
 * Format: PMB-TAHUN-GELOMBANG-NOMOR_URUT
 * Contoh: PMB-2025-1-001
 */
const generateNoPendaftaran = async (tahun, gelombangId, retries = 5) => {
    const prefix = `PMB-${tahun}-${gelombangId}-`;

    for (let attempt = 0; attempt < retries; attempt++) {
        // Ambil nomor pendaftaran terakhir untuk gelombang/tahun ini
        const last = await prisma.pendaftar.findFirst({
            where: {
                noPendaftaran: { startsWith: prefix }
            },
            orderBy: { noPendaftaran: 'desc' }
        });

        let nomorUrut = 1;
        if (last) {
            const lastNum = parseInt(last.noPendaftaran.split('-').pop());
            nomorUrut = isNaN(lastNum) ? 1 : lastNum + 1;
        }

        const noPendaftaran = `${prefix}${String(nomorUrut).padStart(3, '0')}`;

        // Validasi unik
        const exists = await prisma.pendaftar.findUnique({ where: { noPendaftaran } });
        if (!exists) return noPendaftaran;
    }

    throw new Error('Gagal generate nomor pendaftaran. Coba lagi.');
};

module.exports = { generateNoPendaftaran };