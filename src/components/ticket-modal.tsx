'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Ticket, Printer } from 'lucide-react';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketNumber: string;
}

const TicketModal: React.FC<TicketModalProps> = ({
  isOpen,
  onClose,
  ticketNumber,
}) => {
  const handlePrint = () => {
    // In a real app, this would trigger a print action.
    // For this demo, we'll just log to the console.
    console.log(`Printing ticket: ${ticketNumber}`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] text-center p-8">
        <DialogHeader className="text-center flex flex-col items-center">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <Ticket className="h-12 w-12 text-primary" />
          </div>
          <DialogTitle className="text-3xl font-bold">
            Nomor Antrian Anda
          </DialogTitle>
          <DialogDescription className="text-base">
            Harap simpan nomor antrian Anda.
          </DialogDescription>
        </DialogHeader>
        <div className="my-8">
          <p className="text-7xl font-extrabold text-primary tracking-wider">
            {ticketNumber}
          </p>
        </div>
        <p className="text-muted-foreground">
          Terima kasih telah menunggu. Anda akan segera kami panggil.
        </p>
        <DialogFooter className="sm:justify-center mt-6">
          <Button type="button" size="lg" onClick={handlePrint} className="w-full sm:w-auto">
            <Printer className="mr-2 h-4 w-4" />
            Cetak Tiket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TicketModal;
