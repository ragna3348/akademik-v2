const prisma = require('../prisma/client');

/**
 * Auto-cleanup stale accounts:
 * 1. User with PENDAFTAR role, no Pendaftar record, created > 7 days ago → delete
 * 2. User with PENDAFTAR role, has Pendaftar record with status DAFTAR/BAYAR, created > 2 months ago → delete
 */
const cleanupStaleAccounts = async () => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    try {
        // 1. Find PENDAFTAR users who haven't completed registration (no Pendaftar record) — 7 days
        const stalePendaftarUsers = await prisma.user.findMany({
            where: {
                createdAt: { lt: sevenDaysAgo },
                roles: { some: { role: 'PENDAFTAR' } }
            },
            include: { roles: true }
        });

        let deletedIncomplete = 0;
        for (const user of stalePendaftarUsers) {
            const pendaftar = await prisma.pendaftar.findUnique({ where: { email: user.email } });
            if (!pendaftar) {
                // No pendaftar record = never completed form → delete
                await prisma.user.delete({ where: { id: user.id } });
                deletedIncomplete++;
            }
        }

        // 2. Find PENDAFTAR users with status DAFTAR (belum bayar/ujian) — 2 months
        const staleRegisteredUsers = await prisma.user.findMany({
            where: {
                createdAt: { lt: twoMonthsAgo },
                roles: { some: { role: 'PENDAFTAR' } }
            },
            include: { roles: true }
        });

        let deletedUnpaid = 0;
        for (const user of staleRegisteredUsers) {
            const pendaftar = await prisma.pendaftar.findUnique({ where: { email: user.email } });
            if (pendaftar && ['DAFTAR', 'BAYAR'].includes(pendaftar.status)) {
                // Has pendaftar but never paid/completed → delete both
                await prisma.pendaftar.delete({ where: { id: pendaftar.id } });
                await prisma.user.delete({ where: { id: user.id } });
                deletedUnpaid++;
            }
        }

        if (deletedIncomplete > 0 || deletedUnpaid > 0) {
            console.log(`[CLEANUP] ${new Date().toISOString()} — Deleted ${deletedIncomplete} incomplete accounts (7d), ${deletedUnpaid} unpaid accounts (2mo)`);
        }

        return { deletedIncomplete, deletedUnpaid };
    } catch (error) {
        console.error('[CLEANUP ERROR]', error.message);
        return { error: error.message };
    }
};

module.exports = { cleanupStaleAccounts };
