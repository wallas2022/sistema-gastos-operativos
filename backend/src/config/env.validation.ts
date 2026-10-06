export function validateEnv(config: Record<string, unknown>) {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'OCR_SERVICE_URL',
    'S3_ENDPOINT',
    'S3_REGION',
    'S3_BUCKET',
    'S3_ACCESS_KEY',
    'S3_SECRET_KEY',
  ];

  for (const key of required) {
    if (!config[key]) {
      throw new Error(`Missing environment variable: ${key}`);
    }
  }

  const timeout = Number(config.OCR_TIMEOUT_MS ?? 120000);
  if (!Number.isFinite(timeout) || timeout <= 0) {
    throw new Error('OCR_TIMEOUT_MS must be a positive number');
  }
  const fiscalConfidence = Number(config.OCR_FISCAL_NIT_MIN_CONFIDENCE ?? 80);
  if (!Number.isFinite(fiscalConfidence) || fiscalConfidence < 0 || fiscalConfidence > 100) throw new Error('OCR_FISCAL_NIT_MIN_CONFIDENCE must be between 0 and 100');

  return config;
}
