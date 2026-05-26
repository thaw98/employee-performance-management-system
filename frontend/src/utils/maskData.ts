export const maskNRC = (nrc: string | null | undefined): string => {
  if (!nrc) return '';
  // Mask NRC: e.g. "12/ABCD(N)123456" -> "12/ABCD(N)******"
  const match = nrc.match(/^(\d{1,2}\/[A-Z]+\([A-Z]\))(\d+)$/);
  if (match) {
    const prefix = match[1];
    const numberPart = match[2];
    return `${prefix}${'*'.repeat(numberPart.length)}`;
  }
  // Fallback if format is unexpected
  return nrc.replace(/./g, '*');
};

export const maskPhone = (phone: string | null | undefined): string => {
  if (!phone) return '';
  // Mask Phone: e.g. "09123456789" -> "09******789"
  if (phone.length >= 7) {
    const prefix = phone.substring(0, 2);
    const suffix = phone.substring(phone.length - 3);
    const maskedLen = phone.length - 5;
    return `${prefix}${'*'.repeat(maskedLen)}${suffix}`;
  }
  return phone.replace(/./g, '*');
};
