/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'CONSUMER', 'ADMIN_SALES_ONE', 'CLIENT', 'MERCHANT');

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isFirstLogin" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "waitForOtp" BOOLEAN NOT NULL DEFAULT false,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "email" TEXT,
    "phone" TEXT,
    "image" TEXT,
    "fcmToken" TEXT,
    "hash" TEXT,
    "hashedRt" TEXT,
    "role" "UserRole"[],
    "referralCode" TEXT,
    "webhookUrl" TEXT,
    "apiKey" TEXT,
    "appSecret" TEXT,
    "referredId" TEXT,
    "salesExecutiveId" INTEGER,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_referralCode_key" ON "users"("referralCode");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_referredId_fkey" FOREIGN KEY ("referredId") REFERENCES "users"("referralCode") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_salesExecutiveId_fkey" FOREIGN KEY ("salesExecutiveId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
