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

  return config;
}