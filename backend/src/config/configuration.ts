export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  storage: {
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION,
    bucket: process.env.S3_BUCKET,
    accessKey: process.env.S3_ACCESS_KEY,
    secretKey: process.env.S3_SECRET_KEY,
  },
  ocr: {
    baseUrl: process.env.OCR_SERVICE_URL,
    timeoutMs: parseInt(process.env.OCR_TIMEOUT_MS || '120000', 10),
    maxFileSizeBytes: parseInt(process.env.OCR_MAX_FILE_SIZE_MB || '20', 10) * 1024 * 1024,
    allowedMimeTypes: (process.env.OCR_ALLOWED_MIME_TYPES ||
      'application/pdf,image/jpeg,image/png,image/webp,image/tiff,text/plain')
      .split(',').map((value) => value.trim().toLowerCase()).filter(Boolean),
    fiscalNitMinConfidence: parseFloat(process.env.OCR_FISCAL_NIT_MIN_CONFIDENCE || '80'),
  },
  password: {
    minimumLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '10', 10),
    requireComplexity: process.env.PASSWORD_REQUIRE_COMPLEXITY !== 'false',
    resetTokenMinutes: parseInt(process.env.PASSWORD_RESET_TOKEN_MINUTES || '60', 10),
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  },
});
