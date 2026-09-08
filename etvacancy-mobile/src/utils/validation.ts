export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validatePhone(phone: string): boolean {
  const clean = phone.replace(/[\s\-()]/g, '');
  return /^\+?[1-9]\d{7,14}$/.test(clean);
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function formatPhoneNumber(phone: string, countryCode = '+251'): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.startsWith('251')) return `+${clean.slice(0, 3)} ${clean.slice(3, 5)} ${clean.slice(5, 8)} ${clean.slice(8)}`;
  if (clean.startsWith('0')) return `${countryCode} ${clean.slice(1, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
  if (clean.startsWith(countryCode.replace('+', ''))) {
    return `+${clean.slice(0, 3)} ${clean.slice(3, 5)} ${clean.slice(5, 8)} ${clean.slice(8)}`;
  }
  return phone;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const visible = local.length > 3 ? local.slice(0, 2) : local.slice(0, 1);
  return `${visible}${'*'.repeat(Math.max(2, local.length - visible.length))}@${domain}`;
}

export function maskPhone(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.length < 7) return phone;
  return clean.slice(0, 3) + '****' + clean.slice(-3);
}
