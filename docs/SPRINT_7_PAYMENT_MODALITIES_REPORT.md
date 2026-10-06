# Sprint 7 ampliado — Modalidades de pago y ejecución financiera

## Arquitectura anterior

`ExpenseRequestPayment` representaba exclusivamente un desembolso al solicitante. El servicio exigía siempre una `ApplicantBankAccount`, validaba la igualdad de moneda solicitud–pago–cuenta, almacenaba evidencia en MinIO y dejaba el pago en `PAGADO`. `ExpenseSettlement` utilizaba esa operación pagada como base de la liquidación.

## Problema identificado

La obligatoriedad de la cuenta del solicitante impedía registrar pagos realizados directamente a proveedores, prestadores de servicios u otros beneficiarios autorizados. La solicitud tampoco declaraba su modalidad de ejecución financiera.

## Arquitectura nueva

Se evolucionó el modelo existente sin crear un segundo backend:

```text
ExpenseRequest
 ├─ paymentModality
 ├─ ExpenseRequestPayment (DESEMBOLSO_SOLICITANTE o PAGO_DIRECTO)
 └─ ExpenseSettlement
     ├─ ExpenseSettlementDocument → Document OCR
     └─ SettlementRefund
```

La liquidación continúa vinculando funcionalmente solicitud, operación financiera, OCR, devolución, conciliación, certificación y cierre.

## Modalidades

- `REEMBOLSO`: desembolso al solicitante con cuenta obligatoria.
- `ANTICIPO_VIATICOS`: desembolso al solicitante con posterior liquidación.
- `PAGO_PROVEEDOR`: pago directo con proveedor identificado.
- `PAGO_SERVICIO`: pago directo con prestador identificado.
- `PAGO_DIRECTO`: pago a otro beneficiario autorizado e identificado.

## Reglas implementadas

- Solo se paga una solicitud `APROBADA`.
- Un pago `PAGADO` previo bloquea duplicidad.
- Reembolso y viáticos requieren cuenta activa del solicitante.
- En desembolso: moneda de solicitud = pago = cuenta.
- En pago directo: moneda de solicitud = pago.
- El pago directo exige beneficiario; la identificación fiscal se conserva cuando corresponde.
- Todo pago exige monto, referencia y comprobante PDF/JPG/PNG.
- La evidencia se almacena en MinIO; PostgreSQL conserva metadatos y relación.
- La traza distingue `DESEMBOLSO_REGISTRADO` y `PAGO_DIRECTO_REGISTRADO`.
- Una operación directa `PAGADA` puede ser base de la misma liquidación existente.
- No se genera devolución por el solo hecho de tratarse de un pago directo.

## Cambios backend

- `ExpenseRequest` conserva modalidad y beneficiario previsto.
- `ExpenseRequestPayment` conserva tipo de operación y beneficiario efectivo.
- `ExpenseRequestPaymentsService` aplica reglas condicionales sin duplicar lógica.
- El mensaje de liquidación se generalizó de desembolso a ejecución financiera pagada.
- `banking-rules.ts` centraliza clasificación y compatibilidad monetaria.

## Cambios frontend

- Nueva selección de modalidad en la solicitud.
- Beneficiario e identificación fiscal aparecen solo para modalidades directas.
- `/tesoreria/desembolsos` se conserva por compatibilidad y ahora presenta una bandeja de ejecución financiera.
- La bandeja muestra solicitud, solicitante, empresa, modalidad, beneficiario, monto, estado y acción.
- El formulario alterna entre cuenta del solicitante y datos del beneficiario.

## Prisma y migración

- Enums: `PaymentModality`, `FinancialOperationType`.
- Columnas nuevas en `ExpenseRequest` y `ExpenseRequestPayment`.
- Migración: `20260811233000_payment_modalities_direct_payments`.
- Los pagos históricos reciben `DESEMBOLSO_SOLICITANTE` y el solicitante como beneficiario mediante migración de datos.

## Endpoints

Se reutilizaron sin duplicación:

- `GET /api/expense-request-payments/pending`: bandeja de solicitudes aprobadas sin pago.
- `POST /api/expense-request-payments`: registra desembolso o pago directo según modalidad.
- `GET /api/expense-request-payments/expense-request/:id`: operaciones de una solicitud.
- `GET /api/expense-request-payments/expense-request/:id/summary`: resumen pagado.

## Estados utilizados

Se conservaron `PENDIENTE`, `EN_PROCESO`, `PAGADO`, `RECHAZADO` y `ANULADO`. El registro manual confirmado utiliza `PAGADO`; no se agregaron estados equivalentes.

## Pruebas

La nueva suite `payment-modalities.test.js` ejecuta 12 casos: reembolso correcto/moneda incorrecta, anticipo, proveedor sin cuenta del solicitante, moneda directa incorrecta, servicio, beneficiario directo, evidencia obligatoria, solicitud no aprobada, duplicidad, liquidación posterior y evento de auditoría.

Resultado real de regresión: **83 pruebas aprobadas, 0 fallidas**.

## Validaciones técnicas

- Prisma validate: aprobado.
- Prisma generate: aprobado después de reiniciar controladamente el backend que bloqueaba el motor nativo.
- Migración: aplicada correctamente a PostgreSQL.
- Build backend: aprobado.
- Build frontend: aprobado.
- Advertencia no bloqueante: bundle frontend superior a 500 kB.

## Compatibilidad

Se mantienen cuentas bancarias, bancos, devoluciones, liquidaciones, OCR, MinIO, RBAC, auditoría, Approval Engine y Policy Engine. No se creó relación OCR → Solicitud para justificar el gasto ni un modelo financiero paralelo.

## Limitaciones

- No existe catálogo maestro de proveedores; el beneficiario se registra en la solicitud y operación.
- El registro implementado confirma directamente como `PAGADO`; edición, corrección y reenvío de pagos no cuentan todavía con pantallas/endpoints propios.
- La ruta conserva el nombre histórico `/tesoreria/desembolsos` aunque la pantalla ya incluye pagos directos.
