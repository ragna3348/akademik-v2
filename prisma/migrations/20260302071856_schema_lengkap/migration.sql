/*
  Warnings:

  - The `status` column on the `Keuangan` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Mahasiswa` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[kodeNim]` on the table `Prodi` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tahunAngkatan` to the `Mahasiswa` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kodeNim` to the `Prodi` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StatusKRS" AS ENUM ('DRAFT', 'DIAJUKAN', 'DISETUJUI', 'DITOLAK', 'TERLAMBAT', 'PENGECUALIAN');

-- CreateEnum
CREATE TYPE "StatusMahasiswa" AS ENUM ('AKTIF', 'CUTI', 'LULUS', 'DROPOUT', 'CALON');

-- CreateEnum
CREATE TYPE "StatusPendaftar" AS ENUM ('DAFTAR', 'BAYAR', 'LULUS', 'GUGUR');

-- CreateEnum
CREATE TYPE "StatusPembayaran" AS ENUM ('BELUM_BAYAR', 'SUDAH_BAYAR', 'CICILAN');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'PAMABA';

-- AlterTable
ALTER TABLE "Dosen" ADD COLUMN     "foto" TEXT;

-- AlterTable
ALTER TABLE "Keuangan" DROP COLUMN "status",
ADD COLUMN     "status" "StatusPembayaran" NOT NULL DEFAULT 'BELUM_BAYAR';

-- AlterTable
ALTER TABLE "Mahasiswa" ADD COLUMN     "dosenWaliId" INTEGER,
ADD COLUMN     "tahunAngkatan" INTEGER NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "StatusMahasiswa" NOT NULL DEFAULT 'AKTIF';

-- AlterTable
ALTER TABLE "Prodi" ADD COLUMN     "kodeNim" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "UserRole" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeriodeKRS" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "semester" INTEGER NOT NULL,
    "tahunAjaran" TEXT NOT NULL,
    "tanggalBuka" TIMESTAMP(3) NOT NULL,
    "tanggalTutup" TIMESTAMP(3) NOT NULL,
    "isAktif" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeriodeKRS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KRS" (
    "id" SERIAL NOT NULL,
    "mahasiswaId" INTEGER NOT NULL,
    "periodeId" INTEGER NOT NULL,
    "status" "StatusKRS" NOT NULL DEFAULT 'DRAFT',
    "totalSks" INTEGER NOT NULL DEFAULT 0,
    "approvedById" INTEGER,
    "approvedRole" TEXT,
    "approvedAt" TIMESTAMP(3),
    "catatanTolak" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KRS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetailKRS" (
    "id" SERIAL NOT NULL,
    "krsId" INTEGER NOT NULL,
    "mataKuliahId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DetailKRS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gelombang" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "tahun" INTEGER NOT NULL,
    "tanggalBuka" TIMESTAMP(3) NOT NULL,
    "tanggalTutup" TIMESTAMP(3) NOT NULL,
    "biayaDaftar" DOUBLE PRECISION NOT NULL,
    "isAktif" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gelombang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pendaftar" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telepon" TEXT NOT NULL,
    "tempatLahir" TEXT,
    "tanggalLahir" TIMESTAMP(3),
    "jenisKelamin" TEXT,
    "agama" TEXT,
    "alamat" TEXT,
    "foto" TEXT,
    "asalSekolah" TEXT,
    "jurusanSekolah" TEXT,
    "tahunLulus" INTEGER,
    "nilaiRaport" DOUBLE PRECISION,
    "noPendaftaran" TEXT NOT NULL,
    "gelombangId" INTEGER NOT NULL,
    "prodiId" INTEGER NOT NULL,
    "tahunDaftar" INTEGER NOT NULL,
    "status" "StatusPendaftar" NOT NULL DEFAULT 'DAFTAR',
    "afiliasiId" INTEGER,
    "dokumenIjazah" TEXT,
    "dokumenKK" TEXT,
    "dokumenKTP" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pendaftar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PembayaranMaba" (
    "id" SERIAL NOT NULL,
    "pendaftarId" INTEGER NOT NULL,
    "jenis" TEXT NOT NULL,
    "nominal" DOUBLE PRECISION NOT NULL,
    "status" "StatusPembayaran" NOT NULL DEFAULT 'BELUM_BAYAR',
    "keterangan" TEXT,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PembayaranMaba_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAfiliasi" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "email" TEXT,
    "telepon" TEXT,
    "kodeAfiliasi" TEXT NOT NULL,
    "isAktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAfiliasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankSoal" (
    "id" SERIAL NOT NULL,
    "pertanyaan" TEXT NOT NULL,
    "tipesoal" TEXT NOT NULL,
    "opsiA" TEXT,
    "opsiB" TEXT,
    "opsiC" TEXT,
    "opsiD" TEXT,
    "jawaban" TEXT,
    "kategori" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankSoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplatePesan" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "jenis" TEXT NOT NULL,
    "subjek" TEXT,
    "isi" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplatePesan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SettingUmum" (
    "id" SERIAL NOT NULL,
    "kunci" TEXT NOT NULL,
    "nilai" TEXT NOT NULL,
    "keterangan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SettingUmum_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_role_key" ON "UserRole"("userId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "Pendaftar_email_key" ON "Pendaftar"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Pendaftar_noPendaftaran_key" ON "Pendaftar"("noPendaftaran");

-- CreateIndex
CREATE UNIQUE INDEX "UserAfiliasi_email_key" ON "UserAfiliasi"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserAfiliasi_kodeAfiliasi_key" ON "UserAfiliasi"("kodeAfiliasi");

-- CreateIndex
CREATE UNIQUE INDEX "SettingUmum_kunci_key" ON "SettingUmum"("kunci");

-- CreateIndex
CREATE UNIQUE INDEX "Prodi_kodeNim_key" ON "Prodi"("kodeNim");

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mahasiswa" ADD CONSTRAINT "Mahasiswa_dosenWaliId_fkey" FOREIGN KEY ("dosenWaliId") REFERENCES "Dosen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KRS" ADD CONSTRAINT "KRS_mahasiswaId_fkey" FOREIGN KEY ("mahasiswaId") REFERENCES "Mahasiswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KRS" ADD CONSTRAINT "KRS_periodeId_fkey" FOREIGN KEY ("periodeId") REFERENCES "PeriodeKRS"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KRS" ADD CONSTRAINT "KRS_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "Dosen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetailKRS" ADD CONSTRAINT "DetailKRS_krsId_fkey" FOREIGN KEY ("krsId") REFERENCES "KRS"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetailKRS" ADD CONSTRAINT "DetailKRS_mataKuliahId_fkey" FOREIGN KEY ("mataKuliahId") REFERENCES "MataKuliah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pendaftar" ADD CONSTRAINT "Pendaftar_gelombangId_fkey" FOREIGN KEY ("gelombangId") REFERENCES "Gelombang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pendaftar" ADD CONSTRAINT "Pendaftar_prodiId_fkey" FOREIGN KEY ("prodiId") REFERENCES "Prodi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pendaftar" ADD CONSTRAINT "Pendaftar_afiliasiId_fkey" FOREIGN KEY ("afiliasiId") REFERENCES "UserAfiliasi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PembayaranMaba" ADD CONSTRAINT "PembayaranMaba_pendaftarId_fkey" FOREIGN KEY ("pendaftarId") REFERENCES "Pendaftar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
