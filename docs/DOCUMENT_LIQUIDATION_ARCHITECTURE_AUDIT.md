# Auditoría de arquitectura — Centro Documental y Liquidaciones

Fecha: 11 de agosto de 2026.

## Fuente de verdad revisada

La auditoría contrastó `schema.prisma`, migraciones, servicios, controladores, DTO, frontend, pruebas y reportes de los Sprints OCR 5.3/5.4, Liquidaciones 6 y Tesorería 7. El código y el esquema prevalecieron sobre la documentación histórica.

## Arquitectura final

```text
Company
  ├─ ExpenseRequest
  │    ├─ ExpenseRequestPayment
  │    └─ ExpenseSettlement
  │          ├─ ExpenseSettlementDocument ── Document ── OCRResult
  │          ├─ SettlementRefund
  │          ├─ SettlementAudit
  │          └─ certificación separada
  └─ OCRResult.fiscalCompanyId
```

- `Document` puede existir sin `ExpenseRequest`.
- `OCRResult.fiscalCompanyId` se identifica exclusivamente por el NIT receptor y el Maestro Fiscal.
- `ExpenseSettlementDocument` es el vínculo funcional entre comprobante y rendición.
- `Document.expenseRequestId` se conserva nullable sólo por compatibilidad, asociaciones históricas y evidencias técnicas de desembolso/devolución.
- Nuevas asociaciones directas de documentos OCR a solicitudes se rechazan.
- La selección en liquidación exige empresa fiscal idéntica a la empresa de la solicitud.
- `ExpenseSettlementDocument.documentId @unique` es la restricción persistente de uso único; `OCRResult.usedInSettlement` se conserva como reserva atómica compatible.

## Validaciones de incorporación

Antes de agregar un comprobante a una liquidación se exige:

- OCR existente y finalizado;
- documento revisado y confirmado;
- empresa fiscal identificada;
- coincidencia de empresa fiscal con la solicitud;
- resultado fiscal aprobado o documento permitido por Policy Engine;
- total y moneda confirmados;
- ausencia de otra relación `ExpenseSettlementDocument`;
- liquidación en estado mutable.

## Finanzas

- El desembolso continúa perteneciendo a `ExpenseRequest` y la liquidación referencia el mismo `ExpenseRequestPayment` sin duplicarlo.
- El balance se calcula como desembolso menos documentos válidos menos devoluciones validadas.
- Una devolución pendiente produce `DEVOLUCION_EN_VALIDACION` y no permite cuadrar.
- Banco y observaciones de devolución quedan persistidos.
- `CERRADA` y `CERTIFICADA` permanecen separados: el cierre usa `SettlementStatus`; la certificación usa `SettlementCertificationStatus`.

## Migración y datos históricos

La migración `20260811183000_settlement_document_architecture` es aditiva. No elimina columnas, documentos, auditorías ni relaciones históricas. Agrega los datos normalizados de devolución y certificación. Al momento de la auditoría existían 18 documentos, una asociación técnica directa, una liquidación sin comprobantes, un desembolso y ninguna devolución; no había inconsistencias de uso único que reparar.

## API

- Canónica: `GET /api/settlements/:id/eligible-documents`.
- Compatibilidad: `GET /api/settlements/eligible/:requestId` delega a la misma lógica.
- Incorporación: `POST /api/settlements/:id/documents`.
- Certificación: `POST /api/settlements/:id/certify`.

No se creó un segundo motor OCR, de políticas, desembolsos o liquidaciones.
