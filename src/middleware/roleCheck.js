module.exports = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.roles) {
            return res.status(403).json({
                success: false,
                message: 'Akses ditolak!'
            });
        }

        // Cek apakah user punya salah satu role yang diizinkan
        const hasRole = req.user.roles.some(role =>
            allowedRoles.includes(role)
        );

        if (!hasRole) {
            return res.status(403).json({
                success: false,
                message: `Akses ditolak! Role yang diizinkan: ${allowedRoles.join(', ')}`
            });
        }

        next();
    };
};