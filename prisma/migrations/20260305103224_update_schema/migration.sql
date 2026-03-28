/*
  Warnings:

  - You are about to drop the column `nip` on the `Dosen` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[nidn]` on the table `Dosen` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `nidn` to the `Dosen` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "DetailKRS" DROP CONSTRAINT "DetailKRS_krsId_fkey";

-- DropForeignKey
ALTER TABLE "Dosen" DROP CONSTRAINT "Dosen_prodiId_fkey";

-- DropForeignKey
ALTER TABLE "JadwalKuliah" DROP CONSTRAINT "JadwalKuliah_dosenId_fkey";

-- DropIndex
DROP INDEX "Dosen_nip_key";

-- AlterTable
ALTER TABLE "Dosen" DROP COLUMN "nip",
ADD COLUMN     "isAktif" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "jabatan" TEXT,
ADD COLUMN     "nidn" TEXT NOT NULL,
ADD COLUMN     "pendidikanTerakhir" TEXT,
ALTER COLUMN "prodiId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "JadwalKuliah" ADD COLUMN     "semester" INTEGER,
ADD COLUMN     "tahunAjaran" TEXT,
ALTER COLUMN "dosenId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "MataKuliah" ADD COLUMN     "deskripsi" TEXT,
ADD COLUMN     "isAktif" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "jenis" TEXT NOT NULL DEFAULT 'WAJIB';

-- CreateIndex
CREATE UNIQUE INDEX "Dosen_nidn_key" ON "Dosen"("nidn");

-- AddForeignKey
ALTER TABLE "Dosen" ADD CONSTRAINT "Dosen_prodiId_fkey" FOREIGN KEY ("prodiId") REFERENCES "Prodi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetailKRS" ADD CONSTRAINT "DetailKRS_krsId_fkey" FOREIGN KEY ("krsId") REFERENCES "KRS"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JadwalKuliah" ADD CONSTRAINT "JadwalKuliah_dosenId_fkey" FOREIGN KEY ("dosenId") REFERENCES "Dosen"("id") ON DELETE SET NULL ON UPDATE CASCADE;
