const prisma = require('../prisma/client');

const generateNIM = async (prodiId, tahunDaftar, jenisKelasId) => {
    const prodi = await prisma.prodi.findUnique({ where: { id: prodiId } });
    const jenisKelas = jenisKelasId
        ? await prisma.jenisKelas.findUnique({ where: { id: jenisKelasId } })
        : null;

    const kodeProdi = prodi.kodeNim;
    const tahun = String(tahunDaftar);
    const kodeKelas = jenisKelas ? String(jenisKelas.kodeAngka) : '0';
    const prefix = `${kodeProdi}${tahun}`;

    const lastMhs = await prisma.mahasiswa.findFirst({
        where: { nim: { startsWith: prefix } },
        orderBy: { nim: 'desc' }
    });

    let nomorUrut = 1;
    if (lastMhs) nomorUrut = parseInt(lastMhs.nim.slice(-3)) + 1;

    return `${kodeProdi}${tahun}${kodeKelas}${String(nomorUrut).padStart(3, '0')}`;
};

module.exports = { generateNIM };