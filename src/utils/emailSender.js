const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const kirimOTP = async (email, otp, nama) => {
    const mailOptions = {
        from: `"Sistem Akademik" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Kode Verifikasi Pendaftaran',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
                <div style="background: #1e40af; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0;">🎓 Sistem Akademik</h1>
                </div>
                <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #1e293b;">Halo, ${nama}!</h2>
                    <p style="color: #475569;">Terima kasih telah mendaftar. Gunakan kode OTP berikut untuk verifikasi email Anda:</p>
                    <div style="background: #1e40af; color: white; font-size: 36px; font-weight: bold; text-align: center; padding: 20px; border-radius: 10px; letter-spacing: 8px; margin: 20px 0;">
                        ${otp}
                    </div>
                    <p style="color: #94a3b8; font-size: 12px;">Kode ini berlaku selama <strong>10 menit</strong>. Jangan berikan kode ini kepada siapapun!</p>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                    <p style="color: #94a3b8; font-size: 11px; text-align: center;">
                        © 2024 Sistem Informasi Akademik
                    </p>
                </div>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
};

const kirimEmail = async (to, subject, html) => {
    await transporter.sendMail({
        from: `"Sistem Akademik" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html
    });
};

module.exports = { kirimOTP, kirimEmail }; 