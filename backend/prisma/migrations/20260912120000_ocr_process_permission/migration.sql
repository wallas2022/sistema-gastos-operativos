-- OCR_REVIEW and OCR_CONFIRM already represent correction and confirmation.
INSERT INTO "Permission" ("id", "code", "name", "module", "action", "active", "createdAt", "updatedAt")
VALUES ('security-ocr-process', 'OCR_PROCESS', 'Procesar y reprocesar OCR', 'ocr', 'PROCESS', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;
INSERT INTO "RolePermission" ("id", "roleId", "permissionId", "createdAt")
SELECT md5(r."id" || ':' || p."id"), r."id", p."id", CURRENT_TIMESTAMP
FROM "Role" r CROSS JOIN "Permission" p
WHERE r."code" IN ('ADMIN', 'REVISOR_OCR', 'FINANZAS', 'GERENTE') AND p."code" = 'OCR_PROCESS'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
