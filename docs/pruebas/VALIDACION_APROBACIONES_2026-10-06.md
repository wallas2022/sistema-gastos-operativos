# Validación de la corrección de aprobaciones

Fecha: 6 de octubre de 2026.

## Defecto y causa

`GET /api/approval-flows/pending/me` incluía pasos de solicitudes y de liquidaciones. El pendiente observado del Gerente Demo pertenecía a `EXPENSE_SETTLEMENT` y tenía `expenseRequestId = null`. El contador lo sumaba; la pantalla de solicitudes lo descartaba por carecer de `flow.expenseRequest`. Las acciones de esta bandeja resuelven solicitudes, por lo que ese pendiente tampoco correspondía a su contrato.

## Cambios

- La bandeja devuelve únicamente flujos `EXPENSE_REQUEST` con solicitud asociada, asignados al usuario y en su nivel actual. Conserva la restricción de empresa y los estados procesables.
- El contrato TypeScript de `PendingApproval` exige el resumen y el ID de la solicitud y no presume que el endpoint de pendientes devuelva todos los pasos del flujo.
- La recarga de pendientes sincroniza inmediatamente el contador de aprobaciones del menú con el de la bandeja.
- La paginación se ajusta cuando disminuyen los resultados. Se impiden ejecuciones repetidas mientras se procesa una acción.
- El rechazo usa una actualización condicional, igual que aprobar, para impedir que una decisión concurrente sobrescriba otra.
- Los errores de la decisión aparecen dentro del diálogo. No se permite cerrarlo mientras se procesa la operación.

No se modificaron fuentes de OCR, liquidaciones, pagos, presupuesto, dependencias, archivos de bloqueo ni configuración Docker. El único cambio en el layout compartido es el listener del contador de aprobaciones.

## Archivos de implementación y pruebas

1. `backend/src/modules/approval/approval-flow.service.ts`
2. `frontend/src/services/approvalFlows.service.ts`
3. `frontend/src/pages/approvals/ApprovalsPage.tsx`
4. `frontend/src/layout/MainLayout.tsx`
5. `backend/test/approval-pending.test.js`
6. `backend/test/approval-pending.fixture.cjs`
7. `frontend/e2e/approvals-pending.cjs`

## Entorno y resultados

Se utilizó una copia de PostgreSQL llamada `aprobaciones_qa_20261006` y almacenamiento temporal independiente. Las decisiones y los fixtures del navegador se ejecutaron exclusivamente sobre esa copia. Se conservaron las versiones de los lockfiles.

| Comprobación | Resultado |
|---|---|
| Backend: `npm run typecheck` | Aprobado |
| Backend: `npm run build` | Aprobado |
| Backend: todos los `test/*.test.js`, incluidos E2E PostgreSQL | 158 aprobadas; 0 fallidas; 0 omitidas |
| Nuevas pruebas de aprobaciones, incluidas en las 158 | 9 aprobadas |
| Frontend: `npm run build` | Aprobado |
| Frontend: `node --test test/*.cjs` | 10 aprobadas |
| Integración existente de tasas | Creación, actualización y dos auditorías verificadas en QA |
| Recorrido en navegador real con Playwright | Aprobado; sin errores JavaScript |
| `git diff --check` de esta corrección | Aprobado |

La compilación frontend conserva la advertencia preexistente de tamaño del bundle. No se introdujeron cambios de rendimiento fuera del alcance.

Las suites ejecutadas cubren también reglas de OCR, pagos, presupuesto, seguridad y liquidaciones; no se detectaron regresiones en esas pruebas. Esto no equivale a certificar manualmente cada pantalla de los demás módulos. La matriz adicional `security-hardening.integration.js`, que exige y trunca una base específica `security_hardening`, no se ejecutó en esta corrección.

## Evidencia funcional

El recorrido se realizó sobre la aplicación real, mediante acciones de navegador automatizadas y comprobaciones de la API y el estado persistido. No fue una sesión manual humana ni una interfaz simulada.

| Caso | Resultado observado |
|---|---|
| Bandeja inicial | 3 pendientes, 3 tarjetas y contador del menú 3 |
| Filtro sin coincidencias y limpieza | Oculta/restaura tarjetas; conserva el total de pendientes |
| Aprobar solicitud de un nivel | Solicitud y flujo `APROBADA`; tarjeta retirada; contador 2 |
| Rechazar sin comentario | Error visible en el diálogo; solicitud sin cambios |
| Rechazar con motivo | Solicitud y flujo `RECHAZADA`; motivo registrado; contador 1 |
| Primer nivel de una solicitud de dos niveles | Flujo `EN_REVISION`, solicitud `PENDIENTE_APROBACION`; siguiente nivel asignado; contador del primer aprobador 0 |
| Segundo nivel | Gerente autorizado ve 1 tarjeta; aprobación final deja flujo/solicitud `APROBADA` y contador 0 |
| Recarga posterior | Los pendientes resueltos no reaparecen |
| Decisión repetida sobre flujo terminado | Rechazada por backend |
| Decisión de un usuario no asignado al nivel activo | HTTP 403 |
| Pendiente original de liquidación | Conserva `EN_REVISION`, paso `ASIGNADA` y relación original; queda fuera de esta bandeja de solicitudes |

- [Bandeja inicial](aprobaciones/2026-10-06/01-pendientes.png).
- [Resultado de aprobación](aprobaciones/2026-10-06/aprobar-resultado.png).
- [Resultado de rechazo](aprobaciones/2026-10-06/rechazar-resultado.png).
- [Bandeja del segundo aprobador](aprobaciones/2026-10-06/02-segundo-nivel.png).
- [Resultado final](aprobaciones/2026-10-06/niveles-resultado.png).
- [Estados y eventos comprobados](aprobaciones/2026-10-06/resultado.json).
- [Salida de la suite backend](aprobaciones/2026-10-06/backend-tests.txt).

## Requisito de autorización

El Gerente Demo de la base operativa carece de `EXPENSE_REQUEST_APPROVE` y `AUTHORIZATION_APPROVE`. Una asignación no reemplaza estos permisos: las decisiones responden 403 sin ellos. La prueba comprobó ese rechazo y configuró `AUTHORIZATION_APPROVE` solamente en QA. Para habilitar un aprobador real, el administrador debe conceder el permiso correspondiente usando el módulo de seguridad existente; también deben coincidir asignación, empresa y autoridad del nivel. No se relajaron los controles ni se otorgaron permisos en la base operativa.

## Repetición del recorrido

1. Crear una copia de PostgreSQL cuyo nombre comience con `aprobaciones_qa_`.
2. Compilar e iniciar el backend con `DATABASE_URL` de esa copia y almacenamiento de pruebas independiente.
3. Ejecutar `node test/approval-pending.fixture.cjs` desde backend. El fixture rechaza otras bases, configura el gerente de QA, retira fixtures previos y genera `/tmp/aprobaciones-fixtures.json`.
4. Iniciar frontend con el código corregido.
5. Ejecutar `node frontend/e2e/approvals-pending.cjs` en un entorno con Playwright disponible, indicando `PLAYWRIGHT_MODULE` si hace falta.
6. Definir `APPROVAL_QA_API` con la URL de la API de QA, `APPROVAL_QA_FIXTURES` con el JSON generado, `APPROVAL_QA_WEB` con la URL del frontend y `APPROVAL_QA_OUTPUT` con la carpeta de capturas. El runner redirige las peticiones del cliente a la API QA.

El fixture usa usuarios de demostración; `APPROVAL_QA_PASSWORD` permite indicar su contraseña de QA. No debe ejecutarse contra una base operativa.

## Publicación

Mensaje previsto: `fix(aprobaciones): corregir flujo de solicitudes pendientes`.
La publicación se prepara sobre `main` en el clon temporal previamente utilizado, debido a la restricción de escritura del índice Git del directorio original. Se incluyen exclusivamente los archivos de esta corrección y su evidencia.