# Diagnóstico y corrección de autorización del aprobador asignado

Fecha: 2026-10-07. Tiempos de base de datos expresados en UTC. Alcance exclusivo: aprobaciones de solicitudes de gasto. Evidencias relativas: [carpeta](aprobaciones/2026-10-07/).

## 1. Causa raíz y clasificación

El rechazo inicial era correcto según la condición de permisos existente: Gerente Demo estaba asignado, activo y en la empresa correcta, pero su rol GERENTE no heredaba EXPENSE_REQUEST_APPROVE. No existía una discrepancia de identidad ni un token obsoleto. El motor permitía generar esa asignación sin comprobar la capacidad efectiva de decidir y la interfaz ofrecía la acción sin consultar la autorización del backend. Clasificación: configuración de permisos/datos para el 403 original y código para la inconsistencia entre asignación, presentación y autorización. No se eliminó el permiso obligatorio ni se autorizó por rol solamente.

El diagnóstico inicial fue de lectura antes de modificar código o permisos. [Evidencia inicial sanitizada](aprobaciones/2026-10-07/approval-diagnostico-20261007.json).

## 2. Usuario y permisos encontrados

| Campo | Valor inicial |
|---|---|
| Usuario | Gerente Demo / gerente@demo.com |
| user ID | 831858c1-1431-4606-8089-d7e37a516926 |
| Rol heredado y efectivo JWT | GERENTE |
| role ID | b1455a2e-4db7-4b51-be74-3ee60ba60bd3 |
| UserRole ID | b3a8e013-0b99-42c7-88a3-9d1dd080c9ae |
| Empresa | Servicios Compartidos S.A. / SSC-GT |
| company ID | 9c98ac59-8550-4fbf-b36a-880b50b53788 |
| Estado | active=true, blocked=false, credentialVersion=0 |
| manager ID | ad7dc8d8-4e18-4b70-8511-aa83ae44f0d4 |
| Centro / puesto | GER-001 / Gerente de Área |

Permisos efectivos iniciales, todos heredados por rol activo: EXPENSE_REQUEST_VIEW_ALL, EXPENSE_REQUEST_OBSERVE, LIQUIDATION_APPROVE, LIQUIDATION_VIEW_ALL, OCR_VIEW_ALL, REPORTS_VIEW, TRACEABILITY_VIEW, OCR_PROCESS. No hay modelo de permisos directos por usuario; la relación utilizada es UserRole → RolePermission → Permission. Se filtran roles y permisos inactivos. AuthService calcula permisos al ingresar y JwtStrategy relee el usuario y sus relaciones en cada petición, validando estado y versión de credenciales.

## 3. Solicitud y asignación

| Campo | Valor antes de decidir |
|---|---|
| Código / solicitud ID | SSCGT-SOL-2026-0005 / a1305a6e-a192-4935-8e05-76028986b287 |
| Solicitante | Walter Solicitante / d1fc42d4-97d2-4bf6-9688-9c49fbe0b1d9 |
| Empresa | 9c98ac59-8550-4fbf-b36a-880b50b53788 |
| Estado solicitud | PENDIENTE_APROBACION |
| Creación solicitud | 2026-10-06T22:47:49.560Z |
| Flow ID / tipo | c2446bdb-bcb1-4fde-9a6d-c25db2e058a6 / EXPENSE_REQUEST |
| Estado flujo / nivel activo | EN_REVISION / 1 |
| Creación y generación flujo | 2026-10-06T22:48:04.421Z |
| Step ID | e8585df7-45c9-478b-9be8-743991b041e2 |
| Orden / rol / estado / requerido | 1 / GERENTE / ASIGNADA / true |
| assignedUserId | 831858c1-1431-4606-8089-d7e37a516926 |
| assignedAt | 2026-10-06T22:48:04.420Z |
| Regla origen | POL-004 / 976d2f87-ead8-430a-803d-7103c6dbe9e0 |

POL-004, PAGO SIMPLE, activa, global, AMOUNT LESS_THAN 9999 y APPROVAL_REQUIRED. Su definición PolicyApprovalStep d6ef6c49-e759-465c-b1ca-2274b7e3300d configura explícitamente approverUserId del Gerente Demo y roleId GERENTE. La identidad asignada coincide exactamente con el usuario autenticado; no se obtiene del managerId en este caso.

## 4. Endpoint y condición exacta

POST /api/approval-flows/c2446bdb-bcb1-4fde-9a6d-c25db2e058a6/approve.

ApprovalController.approve, protegido con JwtAuthGuard, obtiene el flujo y llama ApprovalDecisionService.decideByRequest → approve → ApprovalFlowService.approve. La configuración de políticas resuelve el aprobador; los métodos del servicio validan empresa, nivel actual, asignación, autoridad y estados. No existe un guard de permiso adicional que explique otro rechazo.

Condición conservada en ApprovalFlowService:

```typescript
if (user.role !== 'ADMIN' &&
    !hasPermission(user, 'EXPENSE_REQUEST_APPROVE') &&
    !hasPermission(user, 'AUTHORIZATION_APPROVE')) {
  throw new ForbiddenException('No tiene autoridad para aprobar este flujo.');
}
```

Los tres operandos resultaban verdaderos para Gerente Demo. Se reprodujo el 403 sin modificar la solicitud. LIQUIDATION_APPROVE no satisface la autorización de solicitudes.

## 5. Regla y permiso correcto

EXPENSE_REQUEST_APPROVE, ID 3ad55bc9-16c0-4e30-948c-61d3c6f9effc, activo, acción APPROVE, módulo Solicitudes de gasto, es el permiso canónico del catálogo y del módulo. AUTHORIZATION_APPROVE no existe en el catálogo operativo; se conserva la alternativa de compatibilidad existente en código para evitar alterar otros contratos, pero no se creó ni concedió.

La regla combina identidad autenticada y válida, empresa, nivel activo, assignedUserId, rol configurado, permiso, estados decidibles y orden de niveles obligatorios. Se mantiene la excepción ADMIN preexistente de rol/permisos/empresa; no se elimina la validación de asignación, autoaprobación, estado u orden. Para usuarios no administradores, VIEW_ALL no otorga autoridad para decidir solicitudes de otra empresa.

## 6. Corrección aplicada

Configuración: se añadió exclusivamente el vínculo GERENTE → EXPENSE_REQUEST_APPROVE mediante el endpoint existente de seguridad POST /api/security/roles/b1455a2e-4db7-4b51-be74-3ee60ba60bd3/permissions/3ad55bc9-16c0-4e30-948c-61d3c6f9effc, protegido por JWT y SECURITY_ASSIGNMENTS_WRITE. Configurado por administrador 5f5aa335-527e-43ac-94ce-b43467028672. RolePermission creado: f63a9aaf-c75d-421c-9bce-734f48de748a, 2026-10-07T15:58:21.893Z. Los ocho permisos anteriores permanecen; ahora son nueve. Esta configuración reside en la base operativa y no se simula mediante un cambio de seed o migración.

Código: el motor comprueba la elegibilidad efectiva antes de asignar solicitudes; el backend entrega decisionAuthorization mediante las mismas validaciones usadas para decidir; el frontend muestra esa razón y habilita acciones según ese resultado. El POST siempre vuelve a validar, sin confiar en el cliente. Se refuerzan estado de solicitud, orden activo y aislamiento de empresa para decisiones. Se conserva el control concurrente mediante actualización condicional y la transición posterior del PUSH 01. La resolución de liquidaciones no adquiere el nuevo requisito de permiso de solicitudes.

## 7. Archivos modificados

Aplicación:

- backend/src/modules/approval/approval-engine.service.ts
- backend/src/modules/approval/approval-flow.service.ts
- frontend/src/pages/approvals/ApprovalsPage.tsx
- frontend/src/services/approvalFlows.service.ts

Pruebas:

- backend/test/approval-authorization.test.js (nuevo)
- backend/test/approval-pending.fixture.cjs (permiso canónico y guard de base QA)
- frontend/e2e/approval-assigned-authority.cjs (nuevo)

Este informe y sus evidencias completan la documentación. No se incluyen cambios a OCR, comprobantes, monedas, dependencias ni configuración Docker.

## 8. Pruebas específicas agregadas

La suite usa PostgreSQL y actores autenticados por JwtStrategy. Rechaza bases cuyo nombre no coincida con aprobaciones_*qa_ para proteger la base operativa.

| Caso | Evidencia de resultado |
|---|---|
| 1. Asignado, permiso correcto, nivel activo | Aprobación exitosa |
| 2. Otro gerente con mismo rol y permiso | Rechazado por no estar asignado |
| 3. Asignado sin permiso | Rechazado |
| 4. Segundo nivel antes de tiempo | Rechazado; aceptado después del primero |
| 5. Solicitud ya aprobada | Nueva aprobación rechazada |
| 6. Dos decisiones simultáneas | Exactamente una resuelve; una rechazada; un registro de aprobación |
| 7. Asignado de otra empresa, incluso con VIEW_ALL | Rechazado |

También se prueban estado terminal de solicitud, rol incorrecto y nivel obligatorio anterior incompleto. Cuatro pruebas del motor verifican permiso canónico, rechazo antes de persistir por falta de permiso, usuario bloqueado/rol incorrecto y conservación de asignación de liquidaciones. [Log específico](aprobaciones/2026-10-07/approval-authorization-tests-final.txt).

## 9. Regresión y compilaciones

| Validación | Resultado |
|---|---|
| Backend completo | 171 aprobadas, 0 fallidas, 0 omitidas (158 anteriores + 13 nuevas contabilizadas por runner) |
| Suites específicas approval | 22 aprobadas |
| Frontend | 10 aprobadas |
| TypeScript backend y build backend | Correctos |
| TypeScript frontend incluido en build y build frontend | Correctos |
| Playwright PUSH 01 | Aprobar, rechazar, comentario obligatorio, segundo nivel, duplicado, no asignado y actualización correctos; sin errores JS |
| Playwright asignación/autorización | Solicitud nueva y solicitud operativa original aprobadas |

Logs completos en la carpeta de evidencia: approval-auth-regression-final.txt, approval-auth-backend-build-final.txt, approval-auth-frontend-build-final.txt y approval-auth-frontend-tests-final.txt. El build frontend conserva el aviso de tamaño de bundle superior a 500 kB; no es un error de compilación ni se actualizaron dependencias.

Reproducción: compilar con npm run typecheck y npm run build en backend; npm run build en frontend; ejecutar node --test backend/test/*.test.js con las variables de bases QA requeridas por las suites. Para la nueva suite definir APPROVAL_AUTH_TEST_DATABASE_URL con una base dedicada aprobaciones_auth_qa_20261007. El E2E requiere PLAYWRIGHT_MODULE, APPROVAL_AUTH_API, APPROVAL_AUTH_WEB, APPROVAL_AUTH_TEMPLATE (JSON diagnóstico sanitizado), APPROVAL_AUTH_OUTPUT y credenciales de demo disponibles en el ambiente. APPROVAL_AUTH_BEFORE_ONLY verifica ausencia de permiso; APPROVAL_AUTH_EXISTING_ONLY decide la solicitud del template. El recorrido completo crea y envía una solicitud desde la interfaz en QA.

## 10. Recorrido funcional real en navegador

Se ejecutó con Playwright sobre la aplicación real; es un recorrido de interfaz automatizado, no una sesión manual humana.

En QA se creó por formulario SSCGT-SOL-2026-0006, ID 10e7919e-7d8c-428c-9b89-af1fe615088b; se envió a autorización, generando flujo 55e9dd1a-c96f-435f-a2b4-cf8e92cee700 y nivel 2af83bb2-ad72-4e46-ac5e-3f9818ac5d77. Gerente Demo quedó ASIGNADA, inició sesión, abrió el detalle y aprobó. Solicitud, flujo y nivel terminaron APROBADA; contador 5 → 4, tarjeta retirada y registro a las 2026-10-07T15:35:09.526Z. [Capturas y resultado QA](aprobaciones/2026-10-07/qa-nueva/resultado.json).

En la base operativa se verificó primero que el backend devolvía allowed=false y la interfaz deshabilitaba Aprobar por falta de permiso. Tras configurar el único permiso canónico, Gerente Demo aprobó la solicitud original SSCGT-SOL-2026-0005 desde la interfaz, respuesta HTTP 201. [Resultado navegador](aprobaciones/2026-10-07/operativa/resultado.json).

## 11. Evidencia operativa final

- Solicitud, flujo y nivel: APROBADA; currentStepOrder=null.
- assignedUserId y decidedByUserId: 831858c1-1431-4606-8089-d7e37a516926.
- Decisión nivel: 2026-10-07T15:58:25.941Z; cierre flujo: 2026-10-07T15:58:25.954Z.
- Un solo evento SOLICITUD_APROBADA, ID 4b5c903b-15f3-4d43-a382-c71e8175dc7a, Gerente Demo, 2026-10-07T15:58:25.980Z, PENDIENTE_APROBACION → APROBADA.
- Pendientes 1 → 0; tarjeta desaparece. [Captura final](aprobaciones/2026-10-07/operativa/01-reportada-resultado.png).
- POL-004 contiene un solo nivel; no corresponde generar un segundo en esta solicitud. La transición al segundo se verificó en las pruebas específicas y PUSH 01.
- Reserva presupuestaria EXECUTED como efecto normal de aprobación; no se generó un pago en este recorrido.
- Los otros 445 flujos y sus niveles permanecen idénticos: SHA-256 antes/después c27f828dca487ff547c5c0b538e740ddae12ac82966424a14d21d73ec72c4f8b. [Verificación DB](aprobaciones/2026-10-07/approval-operational-after-20261007.json).

## 12. Seguridad y límites de evidencia

Los siete casos obligatorios pasaron. Un rol GERENTE o un permiso por sí solo no permite aprobar una solicitud ajena. El frontend reutiliza el resultado de validación del servidor y el servidor revalida en cada decisión. Se preservan asignación, autoaprobación, estados, orden, empresa y resolución concurrente. Las pruebas de regresión y comparación de 445 flujos respaldan que no se alteró un flujo no relacionado; no equivalen a una auditoría exhaustiva de toda la aplicación.

## 13. Entrega previa a publicación

El requisito operativo previo al commit queda demostrado con SSCGT-SOL-2026-0005 y la evidencia adjunta. La corrección incluye código necesario para evitar asignaciones no autorizadas y alinear interfaz/servidor; no es un commit inventado para representar únicamente el permiso. Mensaje previsto: fix(aprobaciones): corregir autorizacion del aprobador asignado. Publicación mediante checkout aislado porque el índice del directorio original no permite escritura; se seleccionan exclusivamente los siete archivos de aprobaciones y esta documentación.