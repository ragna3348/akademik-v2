const prisma = require('../prisma/client');

const generateNoPendaftaran = async (tahun, gelombangId) => {
    // Format: PMB-TAHUN-GELOMBANG-NOMOR_URUT
    // Contoh: PMB-2025-1-001

    const count = await prisma.pendaftar.count({
        where: {
            gelombangId,
            tahunDaftar: tahun
        }
    });

    const nomorUrut = String(count + 1).padStart(3, '0');
    return `PMB-${tahun}-${gelombangId}-${nomorUrut}`;
};

module.exports = { generateNoPendaftaran };