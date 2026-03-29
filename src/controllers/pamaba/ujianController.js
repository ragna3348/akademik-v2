const prisma = require('../../prisma/client');

// Mulai atau ambil status ujian untuk pendaftar
const getSoalUjian = async (req, res) => {
    try {
        const email = req.user.email;
        const pendaftar = await prisma.pendaftar.findUnique({
            where: { email }
        });

        if (!pendaftar) {
            return res.status(404).json({ success: false, message: 'Pendaftar tidak ditemukan!' });
        }

        if (pendaftar.status === 'SELESAI_UJIAN' || pendaftar.status === 'LULUS' || pendaftar.status === 'GUGUR') {
            return res.status(400).json({ success: false, message: 'Ujian sudah diselesaikan!' });
        }

        let ujian = await prisma.ujianPMB.findUnique({
            where: { pendaftarId: pendaftar.id },
            include: { jawaban: true }
        });

        if (!ujian) {
            // Baru mulai, generate ujian
            ujian = await prisma.ujianPMB.create({
                data: {
                    pendaftarId: pendaftar.id,
                    waktuMulai: new Date(),
                    status: 'BERLANGSUNG'
                },
                include: { jawaban: true }
            });
        }

        const soalBank = await prisma.bankSoal.findMany();
        
        // Hilangkan kunci jawaban dari response untuk keamanan
        const soal = soalBank.map(s => ({
            id: s.id,
            pertanyaan: s.pertanyaan,
            tipeSoal: s.tipeSoal,
            opsiA: s.opsiA,
            opsiB: s.opsiB,
            opsiC: s.opsiC,
            opsiD: s.opsiD,
            kategori: s.kategori
        }));

        res.json({
            success: true,
            data: {
                ujian,
                soal
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const simpanJawaban = async (req, res) => {
    try {
        const { ujianId, soalId, jawaban, raguRagu } = req.body;
        
        const existing = await prisma.jawabanUjian.findUnique({
            where: { ujianId_soalId: { ujianId: parseInt(ujianId), soalId: parseInt(soalId) } }
        });

        if (existing) {
            const updated = await prisma.jawabanUjian.update({
                where: { id: existing.id },
                data: { jawaban, raguRagu: raguRagu || false }
            });
            return res.json({ success: true, data: updated });
        } else {
            const created = await prisma.jawabanUjian.create({
                data: {
                    ujianId: parseInt(ujianId),
                    soalId: parseInt(soalId),
                    jawaban,
                    raguRagu: raguRagu || false
                }
            });
            return res.json({ success: true, data: created });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const akhiriUjian = async (req, res) => {
    try {
        const { ujianId } = req.body;
        
        const ujian = await prisma.ujianPMB.findUnique({
            where: { id: parseInt(ujianId) },
            include: { jawaban: { include: { soal: true } }, pendaftar: true }
        });

        if (!ujian) return res.status(404).json({ success: false, message: 'Ujian tidak ditemukan!' });
        if (ujian.status === 'SELESAI') return res.status(400).json({ success: false, message: 'Ujian sudah diakhiri!' });

        let skor = 0;
        let benar = 0;
        let salah = 0;
        const totalSoal = await prisma.bankSoal.count(); // anggap semua bank soal diujikan
        
        for (const jwb of (ujian.jawaban || [])) {
            if (jwb.jawaban === jwb.soal.jawaban) {
                benar++;
            } else {
                salah++;
            }
        }
        
        skor = (totalSoal > 0) ? (benar / totalSoal) * 100 : 0;

        await prisma.ujianPMB.update({
            where: { id: ujian.id },
            data: { 
                status: 'SELESAI',
                waktuSelesai: new Date(),
                nilai: skor
            }
        });

        await prisma.pendaftar.update({
            where: { id: ujian.pendaftarId },
            data: { status: 'SELESAI_UJIAN' }
        });

        res.json({
            success: true,
            data: {
                nilai: skor,
                benar,
                salah,
                total: totalSoal
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getSoalUjian, simpanJawaban, akhiriUjian };
