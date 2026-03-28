-- CreateEnum
CREATE TYPE "StatusKeuangan" AS ENUM ('belum_bayar', 'sudah_bayar');

-- CreateTable
CREATE TABLE "Keuangan" (
    "id" SERIAL NOT NULL,
    "mahasiswaId" INTEGER NOT NULL,
    "jenis" TEXT NOT NULL,
    "nominal" DOUBLE PRECISION NOT NULL,
    "status" "StatusKeuangan" NOT NULL DEFAULT 'belum_bayar',
    "keterangan" TEXT,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Keuangan_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Keuangan" ADD CONSTRAINT "Keuangan_mahasiswaId_fkey" FOREIGN KEY ("mahasiswaId") REFERENCES "Mahasiswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
