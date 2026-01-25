-- CreateEnum
CREATE TYPE "CounterStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BREAK');

-- AlterTable
ALTER TABLE "Counter" ADD COLUMN     "status" "CounterStatus" NOT NULL DEFAULT 'INACTIVE';
