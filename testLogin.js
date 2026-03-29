const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function test() {
    const u = await prisma.user.findUnique({
        where: { email: 'superadmin@kampus.ac.id' },
        include: { roles: true }
    });

    if (!u) {
        console.log("NOT FOUND");
        return;
    }

    console.log("Password Hash:", u.password);
    console.log("Status:", u.status);
    console.log("Roles:", u.roles.map(r => r.role));

    const isMatch = await bcrypt.compare('password123', u.password);
    console.log("Password Matches 'password123'?", isMatch);
    
}

test().finally(() => prisma.$disconnect());
