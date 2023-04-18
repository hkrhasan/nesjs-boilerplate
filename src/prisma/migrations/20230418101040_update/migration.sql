/*
  Warnings:

  - The values [CONSUMER,ADMIN_SALES_ONE,CLIENT,MERCHANT] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `salesExecutiveId` on the `users` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('ADMIN', 'USER', 'ADMIN_SALES');
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new"[] USING ("role"::text::"UserRole_new"[]);
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_salesExecutiveId_fkey";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "salesExecutiveId";
