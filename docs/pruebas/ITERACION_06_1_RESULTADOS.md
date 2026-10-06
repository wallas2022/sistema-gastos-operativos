# Iteración 06.1 — Resultados

## 1. Análisis de `Pruebas.xls`

El archivo con formato real disponible es `docs/pruebas/Pruebas.xlsx`; no existe un archivo `.xls`. Contiene una hoja `Pruebas Req Func`, un título institucional, cuatro campos generales, una tabla de nueve columnas, comentarios adicionales y un bloque de indicadores. La tabla agrupa varias filas bajo un mismo requerimiento y distingue prueba realizada de prueba exitosa.

## 2. Implementación

Se implementó un módulo persistente para registros de pruebas funcionales, requerimientos, casos, ejecución, observaciones, resultados, cierre y evidencias documentales. Se incorporó una pantalla integrada al router y navegación existentes.

## 3. Entidades y migración

Entidades nuevas:

- `FunctionalTestRecord`
- `FunctionalRequirement`
- `FunctionalTestCase`
- `FunctionalTestEvidence`

Enums: estados de registro, estado de caso y resultado. Se agregaron claves foráneas, índices por empresa/estado, unicidad de requerimiento (`code,name`) y unicidad de evidencia por caso/documento.

Migración ejecutada:

`backend/prisma/migrations/20260912170000_functional_test_records/migration.sql`

No se modificaron datos productivos ni se alteraron módulos financieros existentes.

## 4. Backend

Módulo: `backend/src/modules/functional-tests/`.

Servicios principales: creación/listado/detalle, casos por requerimiento, ejecución, validaciones, resumen, cierre y asociación de `Document` como evidencia.

Endpoints:

```text
POST   /test-records
GET    /test-records
GET    /test-records/:id
PATCH  /test-records/:id
POST   /test-records/:id/cases
PATCH  /test-cases/:id
POST   /test-cases/:id/execute
POST   /test-cases/:id/evidence
POST   /test-records/:id/close
GET    /test-records/:id/summary
```

## 5. Frontend

Se creó `FunctionalTestsPage` y `functional-tests.service.ts`, con listado, indicadores, creación de registro, alta de casos, detalle y ejecución de casos. Ruta: `/pruebas-funcionales`. Se agregó navegación para roles administrativos, gerenciales, finanzas y tesorería.

## 6. Seguridad

Los endpoints requieren `JwtAuthGuard`. El servicio valida empresa y alcance del usuario, rechaza acceso cruzado y verifica que la evidencia documental pertenezca a la empresa del actor. Los registros cerrados no pueden modificarse ordinariamente.

## 7. Evidencia

La evidencia se relaciona con `Document` mediante `FunctionalTestEvidence`; no se creó almacenamiento paralelo. La auditoría de ejecución utiliza `SecurityAudit` con la acción `FUNCTIONAL_TEST_EXECUTED`.

## 8. Pruebas ejecutadas

- Prueba PostgreSQL del nuevo módulo: **1/1 PASS**.
- Regresión backend completa: **149/149 PASS**.
- TypeScript backend: **PASS** (incluido en `npm test` mediante build).
- Build backend: **PASS**.
- Build frontend: **PASS**.
- Pruebas frontend independientes: **NO EJECUTADAS**.
- `prisma validate`: **PASS**.
- Migración aplicada contra PostgreSQL: **PASS**.

La prueba PostgreSQL creó un registro, tres casos para un mismo requerimiento, ejecutó dos casos (una exitosa y una no exitosa), dejó un caso pendiente, comprobó los indicadores `3/2/1/1`, validó aislamiento empresarial y comprobó el bloqueo de edición después del cierre.

## 9. Resultado funcional observado

El resumen calculado desde PostgreSQL fue:

```text
Total: 3
Realizadas: 2
Pendientes: 1
Exitosas: 1
No exitosas: 1
% realizadas: 66.67
% exitosas: 50
```

## 10. Limitaciones

- No existe `Pruebas.xls`; se analizó `Pruebas.xlsx`.
- No se implementó exportación a Excel.
- No se ejecutó una suite funcional independiente del frontend.
- No se incorporaron automáticamente todos los resultados históricos como registros de aplicación; las evidencias previas siguen documentadas en los reportes de Iteración 05/06.
- La pantalla asocia documentos existentes por `documentId`; la carga de archivos continúa reutilizando el módulo documental existente.

## 11. Archivos

Productivos:

- `backend/prisma/schema.prisma`
- `backend/src/app.module.ts`
- `backend/src/modules/functional-tests/functional-tests.module.ts`
- `backend/src/modules/functional-tests/functional-tests.controller.ts`
- `backend/src/modules/functional-tests/functional-tests.service.ts`
- `backend/src/modules/functional-tests/dto/functional-test.dto.ts`
- `frontend/src/router.tsx`
- `frontend/src/navigation/navigation.ts`
- `frontend/src/pages/functional-tests/FunctionalTestsPage.tsx`
- `frontend/src/pages/functional-tests/functional-tests.service.ts`

Testing:

- `backend/test/functional-tests.test.js`

Documentación:

- `docs/pruebas/README.md`
- `docs/pruebas/ITERACION_06_1_RESULTADOS.md`

## 12. Conclusión

La Iteración 06.1 queda **PARTIAL** respecto al alcance total solicitado: el registro persistente, los indicadores, la seguridad, el cierre, la prueba PostgreSQL y la interfaz están implementados y validados, pero la exportación Excel y las pruebas funcionales independientes del frontend no fueron ejecutadas. La ausencia del archivo `.xls` exacto también queda documentada.
