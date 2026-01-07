import { useToast } from '@/hooks/use-toast';
import type { Ticket } from '@/types/queue';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { format } from 'date-fns';

export interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket | null;
}

export const TicketModal = ({ isOpen, onClose, ticket }: TicketModalProps) => {
  const { toast } = useToast();

  const handlePrint = async () => {
    if (!ticket) return;

    try {
      const response = await fetch('http://localhost:4000/print', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketNumber: ticket.number,
          serviceName: ticket.service?.name,
          timestamp: ticket.createdAt,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({ title: 'Sukses', description: 'Tiket sedang dicetak.' });
        setTimeout(onClose, 2000);
      } else {
        throw new Error(result.message || 'Gagal menghubungi printer.');
      }
    } catch (error: any) {
      console.error('Print error:', error);
      window.print(); 
      toast({
        variant: 'warning',
        title: 'Print Server Error',
        description: 'Menggunakan browser print dialog.',
      });
    }
  };

  if (!ticket) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-center print:shadow-none print:border-none">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Tiket Antrian Anda</DialogTitle>
          <DialogDescription>
            Silakan cetak tiket Anda dan tunggu nomor Anda dipanggil.
          </DialogDescription>
        </DialogHeader>
        <div id="printable-ticket" className="py-6 border-y my-4 print:border-none">
          <p className="text-lg font-medium text-muted-foreground">{ticket.service?.name}</p>
          <p className="text-8xl font-extrabold text-primary my-2">{ticket.number}</p>
          <p className="text-sm text-muted-foreground">
            {format(new Date(ticket.createdAt), 'dd MMM yyyy HH:mm')}
          </p>
        </div>
        <DialogFooter className="sm:justify-center flex-col sm:flex-col sm:space-x-0 gap-2 print:hidden">
          <Button type="button" onClick={handlePrint} size="lg">
            <Printer className="mr-2 h-5 w-5" />
            Cetak Tiket
          </Button>
          <Button type="button" onClick={onClose} size="lg" variant="outline">
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
