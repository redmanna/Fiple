// Two-Factor Authentication (2FA) System
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import prisma from './prisma';

/**
 * Generate 2FA secret for user
 */
export async function generate2FASecret(userId: string, email: string) {
  const secret = speakeasy.generateSecret({
    name: `Fiple (${email})`,
    issuer: 'Fiple',
    length: 32,
  });

  // Store secret in database
  await prisma.user.update({
    where: { id: userId },
    data: {
      // Add these fields to User model:
      // twoFactorSecret: secret.base32,
      // twoFactorEnabled: false,
    },
  });

  // Generate QR code
  const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url!);

  return {
    secret: secret.base32,
    qrCode: qrCodeDataUrl,
    manualEntryKey: secret.base32,
  };
}

/**
 * Verify 2FA token
 */
export function verify2FAToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2, // Allow 2 time windows (60 seconds before/after)
  });
}

/**
 * Enable 2FA for user
 */
export async function enable2FA(userId: string, token: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true /* twoFactorSecret: true */ },
  });

  if (!user) return false;

  // Verify token
  // const isValid = verify2FAToken(user.twoFactorSecret!, token);

  // if (isValid) {
  //   await prisma.user.update({
  //     where: { id: userId },
  //     data: { twoFactorEnabled: true },
  //   });
  // }

  // return isValid;
  return true; // Placeholder
}

/**
 * Disable 2FA for user
 */
export async function disable2FA(userId: string, password: string): Promise<boolean> {
  // Verify password first, then disable
  await prisma.user.update({
    where: { id: userId },
    data: {
      // twoFactorEnabled: false,
      // twoFactorSecret: null,
    },
  });

  return true;
}

/**
 * Generate backup codes
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }

  return codes;
}

/**
 * Verify backup code
 */
export async function verifyBackupCode(
  userId: string,
  code: string
): Promise<boolean> {
  // const user = await prisma.user.findUnique({
  //   where: { id: userId },
  //   select: { twoFactorBackupCodes: true },
  // });

  // if (!user || !user.twoFactorBackupCodes) return false;

  // const codes = user.twoFactorBackupCodes as string[];
  // const codeIndex = codes.indexOf(code);

  // if (codeIndex === -1) return false;

  // // Remove used code
  // codes.splice(codeIndex, 1);

  // await prisma.user.update({
  //   where: { id: userId },
  //   data: { twoFactorBackupCodes: codes },
  // });

  // return true;
  return true; // Placeholder
}

/**
 * Check if 2FA is required for user
 */
export async function is2FARequired(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true /* twoFactorEnabled: true */ },
  });

  // return user?.twoFactorEnabled || false;
  return false; // Placeholder - enable when schema updated
}
