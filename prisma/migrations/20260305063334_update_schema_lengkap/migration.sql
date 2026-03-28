/*
  Warnings:

  - You are about to drop the column `tipesoal` on the `BankSoal` table. All the data in the column will be lost.
  - You are about to drop the column `jabatan` on the `Dosen` table. All the data in the column will be lost.
  - You are about to alter the column `biayaDaftar` on the `Gelombang` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to drop the column `ipk` on the `Mahasiswa` table. All the data in the column will be lost.
  - You are about to alter the column `nominal` on the `PembayaranMaba` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to drop the column `jurusanSekolah` on the `Pendaftar` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `UserRole` table. All the data in the column will be lost.
  - You are about to drop the `Jadwal` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Keuangan` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[krsId,mataKuliahId]` on the table `DetailKRS` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[mahasiswaId,periodeId]` on the table `KRS` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tipeSoal` to the `BankSoal` table without a default value. This is not possible if the table is not empty.
  - Made the column `jawaban` on table `BankSoal` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Jadwal" DROP CONSTRAINT "Jadwal_dosenId_fkey";

-- DropForeignKey
ALTER TABLE "Jadwal" DROP CONSTRAINT "Jadwal_mataKuliahId_fkey";

-- DropForeignKey
ALTER TABLE "KRS" DROP CONSTRAINT "KRS_approvedById_fkey";

-- DropForeignKey
ALTER TABLE "Keuangan" DROP CONSTRAINT "Keuangan_mahasiswaId_fkey";

-- DropForeignKey
ALTER TABLE "Pendaftar" DROP CONSTRAINT "Pendaftar_gelombangId_fkey";

-- DropForeignKey
ALTER TABLE "UserRole" DROP CONSTRAINT "UserRole_userId_fkey";

-- DropIndex
DROP INDEX "UserAfiliasi_email_key";

-- AlterTable
ALTER TABLE "BankSoal" DROP COLUMN "tipesoal",
ADD COLUMN     "tipeSoal" TEXT NOT NULL,
ALTER COLUMN "jawaban" SET NOT NULL;

-- AlterTable
ALTER TABLE "Dosen" DROP COLUMN "jabatan";

-- AlterTable
ALTER TABLE "Gelombang" ALTER COLUMN "biayaDaftar" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "Mahasiswa" DROP COLUMN "ipk",
ADD COLUMN     "jenisKelasId" INTEGER;

-- AlterTable
ALTER TABLE "PembayaranMaba" ALTER COLUMN "nominal" SET DATA TYPE INTEGER,
ALTER COLUMN "tanggal" DROP NOT NULL,
ALTER COLUMN "tanggal" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Pendaftar" DROP COLUMN "jurusanSekolah",
ADD COLUMN     "jenisKelasId" INTEGER,
ADD COLUMN     "nik" TEXT,
ADD COLUMN     "nisn" TEXT,
ALTER COLUMN "telepon" DROP NOT NULL,
ALTER COLUMN "gelombangId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Prodi" ADD COLUMN     "fakultasId" INTEGER,
ADD COLUMN     "isAktif" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "peminatan" TEXT;

-- AlterTable
ALTER TABLE "UserRole" DROP COLUMN "createdAt";

-- DropTable
DROP TABLE "Jadwal";

-- DropTable
DROP TABLE "Keuangan";

-- CreateTable
CREATE TABLE "Fakultas" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "isAktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fakultas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JenisKelas" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "kodeAngka" INTEGER NOT NULL,
    "isAktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JenisKelas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JadwalKuliah" (
    "id" SERIAL NOT NULL,
    "mataKuliahId" INTEGER NOT NULL,
    "dosenId" INTEGER NOT NULL,
    "hari" TEXT NOT NULL,
    "jamMulai" TEXT NOT NULL,
    "jamSelesai" TEXT NOT NULL,
    "ruangan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JadwalKuliah_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Fakultas_kode_key" ON "Fakultas"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "JenisKelas_kodeAngka_key" ON "JenisKelas"("kodeAngka");

-- CreateIndex
CREATE UNIQUE INDEX "DetailKRS_krsId_mataKuliahId_key" ON "DetailKRS"("krsId", "mataKuliahId");

-- CreateIndex
CREATE UNIQUE INDEX "KRS_mahasiswaId_periodeId_key" ON "KRS"("mahasiswaId", "periodeId");

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prodi" ADD CONSTRAINT "Prodi_fakultasId_fkey" FOREIGN KEY ("fakultasId") REFERENCES "Fakultas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mahasiswa" ADD CONSTRAINT "Mahasiswa_jenisKelasId_fkey" FOREIGN KEY ("jenisKelasId") REFERENCES "JenisKelas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JadwalKuliah" ADD CONSTRAINT "JadwalKuliah_mataKuliahId_fkey" FOREIGN KEY ("mataKuliahId") REFERENCES "MataKuliah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JadwalKuliah" ADD CONSTRAINT "JadwalKuliah_dosenId_fkey" FOREIGN KEY ("dosenId") REFERENCES "Dosen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pendaftar" ADD CONSTRAINT "Pendaftar_gelombangId_fkey" FOREIGN KEY ("gelombangId") REFERENCES "Gelombang"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pendaftar" ADD CONSTRAINT "Pendaftar_jenisKelasId_fkey" FOREIGN KEY ("jenisKelasId") REFERENCES "JenisKelas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
