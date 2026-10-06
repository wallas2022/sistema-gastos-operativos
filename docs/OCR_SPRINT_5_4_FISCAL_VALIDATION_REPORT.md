# Sprint OCR 5.4 — Validación fiscal, comprobantes y maestro de empresa

Fecha de cierre: 10 de agosto de 2026.

## 1. Resumen

Se agregó validación fiscal para facturas y autorización por política para documentos no factura. La implementación extiende `Company`, `OCRResult`, el catálogo de políticas y la pantalla de revisión existentes. No se creó otro motor de políticas ni otra pantalla de revisión.

## 2. Problema resuelto

El sistema reconocía documentos y permitía revisarlos, pero no verificaba a quién estaba emitida una factura, no distinguía Consumidor Final, no contrastaba el NIT receptor con la empresa y no decidía si un comprobante no fiscal estaba autorizado.

## 3. Modelo de empresa

`Company` ahora contiene:

- `name`: nombre histórico, conservado por compatibilidad.
- `legalName`: razón social.
- `tradeName`: nombre comercial.
- `taxId`: NIT fiscal normalizado y único.
- `countryId` y `active`: país y estado existentes.

Los registros históricos fueron rellenados con `legalName=name` y `tradeName=name`. El NIT no fue inventado ni rellenado automáticamente: debe configurarse en `/configuracion/empresas-fiscales` o mediante el catálogo existente.

La empresa se resuelve primero desde `Document.expenseRequest.company`; si el documento aún no está asociado, se usa `Document.user.company`. Este segundo caso es la estructura mínima previa al Sprint 6.

## 4. Tipos de comprobante

Se incorporó el enum `DocumentVoucherType`: `FACTURA`, `RECIBO`, `COMPROBANTE_DE_PAGO`, `NOTA_DE_CREDITO`, `NOTA_DE_DEBITO` y `OTRO`.

`detectedVoucherType` conserva el tipo original y `finalVoucherType` conserva el tipo vigente tras revisión. La corrección manual usa el campo auditado `document_type`, por lo que registra valor OCR, valor anterior, nuevo valor, usuario, fecha y motivo.

## 5. Reglas fiscales

Para `FACTURA`:

- CF/C/F/Consumidor Final: rechazo con `FACTURA_CONSUMIDOR_FINAL`.
- NIT ausente: `VALIDACION_FISCAL_PENDIENTE_REVISION`.
- empresa sin NIT configurado: pendiente con `NIT_EMPRESA_NO_CONFIGURADO`.
- NIT distinto: rechazo con `NIT_RECEPTOR_NO_COINCIDE`.
- NIT coincidente y confianza insuficiente: pendiente.
- NIT coincidente y confianza suficiente: `VALIDACION_FISCAL_APROBADA`.

El umbral de NIT es configurable con `OCR_FISCAL_NIT_MIN_CONFIDENCE`. El valor predeterminado es 80%, alineado con el límite rojo ya existente en el semáforo de Sprint 5.3; no cambia el cálculo de confianza.

## 6. Integración con Policy Engine

Se agregó `DOCUMENT_TYPE` a `PolicyField` y `documentType` a `PolicyEvaluationInput`. `StandardPolicyConditionEvaluator` evalúa el nuevo campo usando los mismos operadores existentes.

Los documentos no factura llaman a `PolicyEngineService.evaluate()`. Sólo una regla vigente, aplicable, de campo `DOCUMENT_TYPE` y resultado `OK` autoriza el comprobante. Otras políticas `OK` no pueden autorizarlo accidentalmente.

- Con política: `DOCUMENTO_PERMITIDO_POR_POLITICA`.
- Sin política explícita: `DOCUMENTO_NO_PERMITIDO`.

## 7. Flujo de validación

```text
Documento -> OCR -> tipo
  FACTURA -> validación fiscal -> CF / NIT ausente / NIT diferente / NIT válido
  NO FACTURA -> PolicyEngineService.evaluate -> política DOCUMENT_TYPE OK / no aplicable
```

La validación se ejecuta al procesar, después de corregir campos/tipo, al confirmar y mediante `POST /api/ocr/:documentId/validate-compliance`.

## 8. Estados

Se mantienen los estados documentales de Sprint 5.3. La decisión fiscal se almacena separadamente en `DocumentComplianceResult`, evitando mezclar el estado técnico OCR con la aceptación fiscal.

## 9. Auditoría

`OCRComplianceDecision` registra de forma inmutable:

- documento y tipo;
- empresa;
- NIT esperado/encontrado;
- receptor, tipo y confianza;
- regla fiscal;
- política aplicada;
- resultado y motivo;
- usuario/proceso y fecha.

El historial 5.3 `OCRFieldCorrection` continúa almacenando las correcciones manuales, incluido el cambio de tipo.
Para impedir pérdida por cascada, un documento confirmado o con correcciones auditadas ya no puede reprocesarse; debe conservarse su evidencia original.

## 10. Cambios de base de datos

- Tres enums nuevos: tipo de comprobante, tipo de receptor y resultado de cumplimiento.
- `DOCUMENT_TYPE` agregado al enum de políticas.
- Campos fiscales en `Company`.
- Estado fiscal y elegibilidad en `OCRResult`.
- Nueva tabla inmutable `OCRComplianceDecision`.

## 11. Cambios backend

- Nuevo `DocumentComplianceService`.
- `OcrService` dispara validación sin modificar el OCR.
- `PolicyEngineService` devuelve el campo evaluado para identificar con precisión la regla autorizante.
- Catálogo Company acepta razón social, nombre comercial y NIT.
- Configuración validada del umbral fiscal.
- Endpoint de reevaluación fiscal.

## 12. Cambios frontend

- Panel fiscal/política agregado a `DocumentDetailPage`.
- Muestra NIT esperado/encontrado, receptor, confianza, resultado, política, elegibilidad y auditoría.
- El tipo documental es corregible desde la misma revisión y exige el motivo opcional ya existente.
- Nuevo maestro fiscal de empresas.
- `DOCUMENT_TYPE` disponible en el catálogo visual de campos de política.

## 13. Pruebas

- 12 casos fiscales/política obligatorios: aprobados.
- Suite backend completa: 31/31 aprobadas.
- Regresión OCR 5.1/5.2: 10/10 aprobadas.
- Build backend NestJS: aprobado.
- Build Docker OCR: aprobado.
- Prisma generate: aprobado.
- Migración: aplicada correctamente.
- Verificación API del catálogo: 3 empresas y campos fiscales presentes.
- Validación real: factura detectada con receptor NIT `12521337`; quedó pendiente porque la empresa no tiene NIT configurado, sin inventar datos.

## 14. Resultados

Todos los casos requeridos producen el resultado esperado. Una política aplicada conserva id, código y nombre. Los documentos rechazados nunca se marcan elegibles; los permitidos sólo son elegibles después de revisión/confirmación y si no fueron utilizados.

## 15. Migración

`20260811003000_ocr_fiscal_validation`, aplicada después de las 18 migraciones anteriores. No se modificó ninguna migración histórica.

## 16. Limitaciones

- Las empresas existentes necesitan que un administrador capture su NIT real.
- No existe integración directa con SAT, por restricción del sprint.
- El build global frontend sigue bloqueado únicamente por errores preexistentes en conciliación, monitor de estados, router alterno y declaraciones de `rolldown`; los archivos 5.4 no presentan errores.
- La elegibilidad está preparada, pero no existe todavía una liquidación que consuma o marque el comprobante.

## 17. Preparación para Sprint 6

`OCRResult.eligibleForSettlement` responde si el comprobante puede utilizarse y `usedInSettlement` reserva el control de uso único. La condición actual exige revisión confirmada y resultado fiscal aprobado o autorización explícita por política.

No se implementaron liquidaciones, pagos, conciliaciones, transferencias, depósitos, cierre ni certificación.

## 18. Continuidad de Sprint 5.3

OCR, revisión agrupada, semáforos, historial, dashboard, reportes, exportaciones, métricas y estados siguen operativos. La regresión comprobó 9 resultados reales en métricas y el contenedor OCR quedó saludable.

## Archivos modificados

- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260811003000_ocr_fiscal_validation/migration.sql`
- `backend/.env.example`
- `backend/src/config/configuration.ts`
- `backend/src/config/env.validation.ts`
- `backend/src/catalog/dto/company.dto.ts`
- `backend/src/catalog/catalog.service.ts`
- `backend/src/modules/policies/engine/policy-engine.types.ts`
- `backend/src/modules/policies/engine/policy-engine.service.ts`
- `backend/src/modules/policies/engine/standard-policy-condition.evaluator.ts`
- `backend/src/modules/policies/policies.service.ts`
- `backend/src/modules/ocr/document-compliance.service.ts`
- `backend/src/modules/ocr/ocr.module.ts`
- `backend/src/modules/ocr/ocr.service.ts`
- `backend/src/modules/ocr/ocr.controller.ts`
- `backend/test/ocr-fiscal-validation.test.js`
- `frontend/src/services/catalogs.service.ts`
- `frontend/src/services/policies.service.ts`
- `frontend/src/pages/planning/PoliciesRulesPage.tsx`
- `frontend/src/pages/governance/FiscalCompaniesPage.tsx`
- `frontend/src/modules/documents/services/documents.service.ts`
- `frontend/src/modules/documents/pages/DocumentDetailPage.tsx`
- `frontend/src/modules/ocr/components/OcrReviewPanel.tsx`
- `frontend/src/modules/ocr/components/FiscalDecisionPanel.tsx`
- `frontend/src/router.tsx`
- `frontend/src/layout/Sidebar.tsx`
