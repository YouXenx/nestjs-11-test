/*
  Warnings:

  - The `gender` column on the `user_profiles` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- AlterTable
ALTER TABLE "public"."user_profiles" DROP COLUMN "gender",
ADD COLUMN     "gender" "public"."Gender";

-- DropEnum
DROP TYPE "public"."GenderEnum";
