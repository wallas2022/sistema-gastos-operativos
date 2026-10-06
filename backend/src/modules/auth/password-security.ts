import { BadRequestException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';

export function validatePasswordPolicy(password: string, minimumLength = 10, requireComplexity = true) {
  if (password.length < minimumLength) throw new BadRequestException(`La contraseña debe tener al menos ${minimumLength} caracteres.`);
  if (requireComplexity && (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password))) {
    throw new BadRequestException('La contraseña debe incluir mayúscula, minúscula, número y carácter especial.');
  }
}

export function createResetToken() { return randomBytes(32).toString('hex'); }
export function hashResetToken(token: string) { return createHash('sha256').update(token).digest('hex'); }
