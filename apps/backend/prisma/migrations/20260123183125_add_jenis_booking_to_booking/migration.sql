-- CreateEnum
CREATE TYPE "BookingType" AS ENUM ('ONLINE', 'OFFLINE');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "jenisBooking" "BookingType" NOT NULL DEFAULT 'ONLINE';
