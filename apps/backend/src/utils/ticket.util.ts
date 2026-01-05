/**
 * Format sequence number to ticket format
 * Example: (1, 'A') => 'A-001'
 */
export const formatTicketNumber = (sequence: number, code: string): string => {
  const paddedNumber = sequence.toString().padStart(3, '0');
  return `${code.toUpperCase()}-${paddedNumber}`;
};

/**
 * Get start of today (for filtering tickets by day)
 */
export const getStartOfToday = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
};
