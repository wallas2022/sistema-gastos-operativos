# Sprint 7 — Cuentas bancarias, desembolsos y devoluciones

Fecha de cierre técnico: 11 de agosto de 2026.

## Resultado

Se implementó el módulo de cuentas bancarias del solicitante, el registro manual de desembolsos por Tesorería sobre la API existente y el ciclo de devoluciones con evidencia y validación de Tesorería.

## Cuentas bancarias

- Varias cuentas por solicitante.
- Banco administrable, tipo, número normalizado, titular, moneda, estado y cuenta predeterminada.
- Reutilización del catálogo `Currency`.
- Prevención de duplicados.
- Una sola cuenta predeterminada por usuario y moneda mediante transacción.
- Las cuentas utilizadas por desembolsos históricos no pueden eliminarse; se desactivan.
- Auditoría de alta, modificación y desactivación.

## Desembolsos

- Se conservó `POST /api/expense-request-payments`; no se creó otra lógica de pagos.
- La pantalla de Tesorería muestra solicitudes `APROBADA` sin pagos `PAGADO`.
- Cuenta destino activa, perteneciente al solicitante y filtrada por moneda.
- Validación defensiva en backend de solicitud, pago y cuenta en la misma moneda.
- Comprobante PDF/JPG/PNG obligatorio en MinIO y documento asociado a la solicitud.
- Registro de usuario, referencia, cuenta, evidencia y hash SHA-256 en la trazabilidad.

## Devoluciones

- Registro por el solicitante desde el detalle de su liquidación.
- Sólo transferencia o depósito.
- Fecha, banco, referencia, monto, observaciones y documento obligatorios.
- Evidencia almacenada en MinIO por el sistema documental existente.
- Bandeja de Tesorería para aprobar, rechazar o solicitar corrección.
- Estados nuevos: `DEVOLUCION_REGISTRADA`, `DEVOLUCION_EN_REVISION`, `DEVOLUCION_VALIDADA`, `DEVOLUCION_RECHAZADA` y `CORRECCION_SOLICITADA`.
- Sólo devoluciones validadas participan en el balance.
- Una devolución pendiente mantiene `DEVOLUCION_EN_VALIDACION` e impide el cierre.

## Integración y seguridad

- Backend NestJS y Prisma existentes.
- MinIO mediante `StorageService` existente.
- Guard JWT y roles existentes.
- Auditoría de cuenta, trazabilidad de solicitud y auditoría inmutable de liquidación.
- Flujo de aprobación y políticas del Sprint 6 conservados para liquidaciones.

## Pantallas

- `/mis-cuentas-bancarias`
- `/configuracion/bancos` (Administrador)
- `/tesoreria/desembolsos`
- `/tesoreria/devoluciones`
- Formulario de devolución actualizado en el detalle de liquidación.

## Base de datos

Migración `20260811150000_sprint7_banking_disbursements_refunds`, aplicada correctamente como migración 21.

## Verificación

- Backend build: aprobado.
- Backend tests: 55/55 aprobados.
- Casos nuevos Sprint 7: 9/9 aprobados.
- Frontend TypeScript + Vite build: aprobado.
- Prisma validate: aprobado.
- Migración: aplicada correctamente.

El build frontend global quedó en verde; también se corrigieron los ocho bloqueos heredados informados al cierre del Sprint 6.
