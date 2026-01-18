-- CreateTable
CREATE TABLE "ServiceDailyStat" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "quotaSnapshot" INTEGER NOT NULL,
    "totalTickets" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceDailyStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServiceDailyStat_date_serviceId_key" ON "ServiceDailyStat"("date", "serviceId");

-- AddForeignKey
ALTER TABLE "ServiceDailyStat" ADD CONSTRAINT "ServiceDailyStat_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
