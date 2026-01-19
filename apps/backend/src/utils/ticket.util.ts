/**
 * Format sequence number to ticket format
 * Example: (1, 'A') => 'A-001'
 */
export const formatTicketNumber = (sequence: number, code: string): string => {
  const paddedNumber = sequence.toString().padStart(3, '0');
  return `${code.toUpperCase()}-${paddedNumber}`;
};

/**
 * Get start of today (Asia/Jakarta Timezone)
 * Returns a Date object representing 00:00:00 WIB
 */
export const getStartOfToday = () => {
  const now = new Date();

  // 1. Ambil komponen tanggal berdasarkan zona waktu Jakarta
  const jakartaFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour12: false
  });

  const parts = jakartaFormatter.formatToParts(now);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;

  // 2. Buat string ISO dengan offset Jakarta (+07:00)
  // Format: YYYY-MM-DDT00:00:00+07:00
  const jakartaMidnightISO = `${year}-${month}-${day}T00:00:00+07:00`;

  // 3. Kembalikan sebagai objek Date
  return new Date(jakartaMidnightISO);
};
