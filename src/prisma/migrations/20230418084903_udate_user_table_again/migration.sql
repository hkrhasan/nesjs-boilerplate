/*
  Warnings:

  - A unique constraint covering the columns `[userName]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "frsitName" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "userName" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_userName_key" ON "users"("userName");
