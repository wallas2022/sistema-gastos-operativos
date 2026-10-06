# Sprint 6 — Rendición y liquidaciones

Fecha de cierre técnico: 11 de agosto de 2026.

## Resumen

Se implementó el flujo de liquidación de solicitudes desembolsadas. Una liquidación consume únicamente comprobantes confirmados, fiscalmente aprobados o permitidos por política, pertenecientes a la misma solicitud y no utilizados previamente.

## Alcance implementado

- Creación de una liquidación a partir de una solicitud y un desembolso `PAGADO`.
- Código anual correlativo de liquidación.
- Selección y reserva atómica de comprobantes elegibles.
- Conversión monetaria con tasa histórica y snapshot de la tasa utilizada.
- Cálculo de total rendido, devolución validada, diferencia y estado de balance.
- Registro de devoluciones por transferencia, depósito u otro medio autorizado.
- Evidencia obligatoria para devoluciones y hash SHA-256 en auditoría.
- Validación o rechazo de devoluciones por Finanzas.
- Envío, observación, corrección, aprobación, rechazo y cierre.
- Separación de funciones: quien prepara no puede aprobar.
- Auditoría inmutable de las acciones relevantes.
- Indicadores y filtros para el centro de liquidaciones.

## Reglas principales

- Sólo se admite una liquidación por solicitud.
- El desembolso debe pertenecer a la solicitud y estar pagado.
- Un comprobante debe pertenecer a la misma solicitud, estar confirmado, ser elegible y no haber sido usado.
- Facturas rechazadas, Consumidor Final y documentos sin política explícita no son elegibles.
- Un comprobante reservado no puede seleccionarse simultáneamente en otra liquidación.
- Una devolución pendiente o en validación impide enviar la liquidación.
- Una liquidación sólo puede aprobarse si está cuadrada y sin observaciones.
- Una liquidación sólo puede cerrarse después de ser aprobada y permanecer cuadrada.

## Estados

Liquidación:

- `BORRADOR`
- `PENDIENTE_REVISION`
- `OBSERVADA`
- `APROBADA`
- `CERRADA`
- `RECHAZADA`

Balance:

- `PENDIENTE_DEVOLUCION`
- `DEVOLUCION_EN_VALIDACION`
- `CUADRADA`
- `EXCESO_DE_RENDICION`

Devolución:

- `PENDIENTE`
- `EN_VALIDACION`
- `VALIDADA`
- `RECHAZADA`

## Persistencia

La migración `20260811113000_expense_settlements` agrega:

- `ExpenseSettlement`
- `ExpenseSettlementDocument`
- `SettlementRefund`
- `SettlementAudit`
- enums, índices, relaciones y restricciones de unicidad asociadas.

No se modificó una migración histórica.

## Backend y API

El módulo `SettlementsModule` quedó registrado en `AppModule`. Expone operaciones para listar, consultar indicadores, crear, consultar detalle, obtener comprobantes elegibles, agregar o retirar comprobantes, registrar y validar devoluciones, y ejecutar las transiciones del flujo.

## Frontend

Se agregaron:

- centro de liquidaciones con indicadores y filtros;
- creación desde solicitud y desembolso pagado;
- detalle con comprobantes, diferencias y devoluciones;
- acciones de revisión, aprobación y cierre;
- rutas y acceso desde Rendición y conciliación.

## Pruebas y verificación

- Build backend NestJS: aprobado.
- Suite backend completa: 46/46 aprobadas.
- Casos específicos de reglas de liquidación: 15/15 aprobados.
- `prisma validate`: aprobado.
- `git diff --check` sobre archivos del Sprint 6: aprobado.
- Registro de módulo, rutas y menú: verificado.

La prueba de reglas se alineó con el runner nativo `node:test` usado por el proyecto. Esto eliminó la dependencia accidental de globals de Jest dentro de `src` y restauró el build backend.

## Limitación conocida

El build global del frontend continúa bloqueado por ocho errores preexistentes fuera de las tres pantallas nuevas del Sprint 6: uso antiguo de `Button as={Link}` en `ReconciliationPage`, dos selects antiguos de `StatusMonitorPage`, un import del router alterno y declaraciones de `rolldown`. Los archivos nuevos de liquidaciones no aparecen en el diagnóstico de TypeScript.

## Continuidad

El cierre deja preparada la transición hacia conciliación contable, certificados de cierre y reportes financieros. Esos procesos no se implementaron como parte de este sprint.
