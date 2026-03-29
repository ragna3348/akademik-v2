const nodemailer = require('nodemailer');

async function test() {
    try {
        console.log("Mencoba login GMAIL...");
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'ragna3348@gmail.com',
                pass: 'czcx pbee wbep sxtq'
            }
        });
        
        await transporter.verify();
        console.log("Berhasil verifikasi login!");
        
        console.log("Mencapai tahap kirim...");
        await transporter.sendMail({
            from: "ragna3348@gmail.com",
            to: "ragna3348@gmail.com",
            subject: "Test Send OTP",
            text: "Testing dari server."
        });
        console.log("Email test terkirim!");
    } catch(err){
        console.error("Gagal mengirim email:", err.message);
    }
}
test();
