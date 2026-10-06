# PROMPT 01.1 - Cierre de seguridad residual

Fecha: 2026-09-12. Estado del repositorio: **COMPLETO, validado en pruebas**.

## A. Resumen

Se cerraron brechas de alcance por empresa, autorizaci?n previa sobre recursos, separaci?n de acciones OCR y exposici?n de usuarios. Se reutilizaron los permisos y utilidades del Prompt 01. No se reconstruyeron autenticaci?n, roles ni workflow; no se cambiaron estados, f?rmulas presupuestarias ni modalidades de pago, y no se agreg? una relaci?n OCR ? Solicitud.

`companyId` del cliente ahora es un filtro que debe coincidir con el alcance autenticado. `ADMIN`, `EXPENSE_REQUEST_VIEW_ALL` y `OCR_VIEW_ALL` conservan sus capacidades globales expl?citas en sus respectivos m?dulos. Un usuario con alcance de empresa no puede convertirlo en acceso global omitiendo su empresa o enviando otra.

## B. Auditor?a

Inventario global: **161 endpoints backend**, incluidos **90 con par?metros en la ruta**. El inventario completo est? en [SECURITY_01_1_ENDPOINT_INVENTORY.json](SECURITY_01_1_ENDPOINT_INVENTORY.json). Se revis? adem?s `POST /process` del microservicio OCR.

Los problemas son **familias de hallazgos** identificadas en C, no cantidades de rutas. Las ?reas se superponen y sus cifras no deben sumarse.

| ?rea | Endpoints revisados | Problemas | Corregidos |
| --- | ---: | ---: | ---: |
| Reportes | 15 | 2 | 2 |
| Exportaciones | 1 | 2 | 2 |
| OCR | 10 | 3 | 3 |
| Documentos | 7 | 3 | 3 |
| Trazabilidad | 17 | 3 | 3 |
| M?tricas | 9 | 4 | 4 |
| IDOR/BOLA | 90 | 9 | 9 |

Detalle de conteo:
- Reportes: 7 rutas de reportes/ filtros y 8 de dashboard. Hallazgos F01-F02.
- Exportaciones: una ruta parametrizada para 6 reportes ? 2 formatos, Excel y PDF. No existen endpoints CSV. Hallazgos F01-F02.
- OCR: 9 rutas backend y un endpoint de procesamiento interno. Hallazgos F03-F05.
- Documentos: 4 rutas Documents y 3 rutas de elegibilidad/selecci?n en liquidaciones. Hallazgos F06-F07 y F17.
- Trazabilidad: 10 rutas propias, 4 lecturas de aprobaciones y 3 rutas SLA. Hallazgos F08-F10.
- M?tricas: 7 consultas dashboard, m?tricas OCR e indicadores de liquidaciones. Hallazgos F01-F02, F05 y F11.
- IDOR/BOLA: 90 rutas parametrizadas, incluyendo par?metros funcionales como formato; revisi?n prioritaria de solicitudes, pagos, liquidaciones, documentos, OCR, presupuesto, aprobaciones, usuarios e historiales. Hallazgos F06, F09-F15 y F17.

### Inventario OCR y permiso efectivo

Cada acci?n sobre un documento exige adem?s su alcance de lectura autorizado.

| Endpoint | Lectura | Escritura | Permiso |
| --- | --- | --- | --- |
| GET /ocr/analytics/metrics | S? | No | OCR_VIEW_OWN / OCR_VIEW_COMPANY / OCR_VIEW_ALL |
| GET /ocr/:documentId/result | S? | No | OCR_VIEW_OWN / OCR_VIEW_COMPANY / OCR_VIEW_ALL |
| POST /ocr/:documentId | No | S? | OCR_PROCESS; tambi?n cubre reprocesamiento |
| PUT /ocr/:documentId/fields | No | S? | OCR_REVIEW |
| PUT /ocr/:documentId/total | No | S? | OCR_REVIEW |
| PUT /ocr/:documentId/items | No | S? | OCR_REVIEW |
| POST /ocr/:documentId/confirm | No | S? | OCR_CONFIRM |
| POST /ocr/:documentId/validation-runs | No | S? | OCR_REVIEW |
| POST /ocr/:documentId/validate-compliance | No | S? | OCR_REVIEW |
| POST /process, interno | No | Procesamiento | Clave interna del backend, verificada antes del handler |

La descarga se realiza exclusivamente por `GET /documents/:id/file`. La autorizaci?n ocurre antes de `getFileBuffer`. No se encontraron endpoints que generen URLs presignadas ni descargas alternativas por clave MinIO. El SDK S3 recupera el archivo con sus credenciales de servidor; `storagePath` no es una URL p?blica generada por la aplicaci?n.

## C. Cambios

Las rutas de archivos siguientes son relativas a la ra?z del repositorio.

| Hallazgo | Problema y soluci?n | Archivos principales |
| --- | --- | --- |
| F01 | Reportes/dashboard aceptaban alcance del cliente; ahora derivan empresa autenticada y filtran tambi?n cat?logos y versiones. Exportaci?n invoca los mismos m?todos autorizados. | backend/src/modules/auth/permissions.util.ts; reports/{reports.controller,reports.service,reports.repository}.ts; dashboard/{dashboard.controller,dashboard.service}.ts |
| F02 | Faltaba comprobar el permiso persistido REPORTS_VIEW; se exige en consultas, cat?logos y exportaciones, manteniendo guards de roles. | reports/reports.service.ts; dashboard/dashboard.service.ts |
| F03 | Acciones OCR intercambiaban permisos y roles de lectura pod?an escribir; cada operaci?n exige su permiso. Validaci?n fiscal deja de autorizarse como lectura. | ocr/ocr.service.ts; prisma/seed.ts |
| F04 | El endpoint OCR interno procesaba sin autenticaci?n; clave compartida y comparaci?n constante, rechazo sin configuraci?n; puerto publicado solo en loopback. | Microservicio-OCR/app/{main,security}.py; ocr/ocr.client.ts; dockers/server dockers/docker-compose.yml; archivos .env.example |
| F05 | M?tricas OCR globales sin alcance; todos los agregados, correcciones, pa?ses, tipos y tiempos usan el mismo conjunto documental autorizado. | ocr/{ocr.controller,ocr.service}.ts |
| F06 | Empresa ausente pod?a producir un filtro documental abierto; el alcance OCR falla cerrado. | auth/permissions.util.ts; documents/documents.service.ts |
| F07 | Comprobantes financieros depend?an del cargador; ahora el acceso leg?timo sigue la solicitud/liquidaci?n y su empresa. Upload exige OCR_UPLOAD existente. | documents/documents.service.ts |
| F08 | Relaciones completas de usuarios pod?an exponer passwordHash; se sustituyeron por select de campos necesarios. Se minimizaron tambi?n consultas internas OCR/reportes. | approval/{approval-flow,approval-engine}.service.ts; workflow/sla.service.ts; settlements/settlements.service.ts; policies/policies.service.ts; ocr/document-compliance.service.ts; reports/reports.service.ts |
| F09 | Trazabilidad y acciones por ID ignoraban el recurso original; heredan alcance propio/equipo/empresa/global de solicitudes antes de consultar o modificar. | traceability/traceability.service.ts; auth/permissions.util.ts |
| F10 | Lecturas, reasignaciones y bandejas de aprobaci?n/SLA pod?an superar la empresa actual; se valida la entidad y se filtran asignaciones hist?ricas. | approval/approval-flow.service.ts; workflow/sla.service.ts |
| F11 | Liquidaciones/devoluciones pod?an modificarse antes de comprobar empresa y sus indicadores/listados estaban abiertos; se autoriza antes de cualquier efecto. | settlements/settlements.service.ts |
| F12 | Finanzas/Tesorer?a pod?an consultar cuentas de usuarios de otra empresa; filtro de empresa sobre el titular. | banking/banking.service.ts |
| F13 | Pagos admit?an alcance amplio cuando faltaba companyId; se elimina esa excepci?n y se protege tambi?n el acceso del propietario tras un cambio de empresa. | expense-request-payments/expense-request-payments.service.ts |
| F14 | Lecturas presupuestarias y evaluaci?n por requestId sin autorizaci?n; alcance empresarial, control del detalle financiero y verificaci?n de solicitud previa al motor. | budget/{budget.controller,budget-query.service}.ts |
| F15 | Alcances propios/equipo y escritura de solicitudes pod?an superar la empresa; se reutiliza un alcance de solicitud consistente y se valida la empresa del DTO. | expense-requests/expense-requests.service.ts; auth/permissions.util.ts |
| F16 | Acciones OCR visibles sin permiso, herencia de rutas desconocidas y log de token; controles visuales por acci?n, rutas declaradas y eliminaci?n del log. | frontend/src/navigation/navigation.ts; modules/documents/pages/{DocumentsPage,DocumentDetailPage}.tsx; shared/components/DocumentCard.tsx; shared/services/ProtectedRoute.tsx |
| F17 | Empresa fiscal extra?da pod?a usarse como autorizaci?n para seleccionar documentos; elegibilidad/selecci?n ahora intersecta las reglas fiscales existentes con el acceso documental real. | settlements/settlements.service.ts |

Salvo los prefijos expl?citos de frontend y Microservicio-OCR, los nombres abreviados de servicios en esta tabla pertenecen a `backend/src/modules/`.

### B?squeda global de usuarios

Se buscaron `user: true`, relaciones equivalentes de aprobador, delegado, creador y preparador, `passwordHash`, consultas de usuarios y objetos devueltos. La ?nica inclusi?n completa `user: true` que permanece en `backend/src` est? en recuperaci?n de contrase?a: se necesita para verificar la contrase?a anterior y nunca se devuelve al cliente. Las lecturas completas restantes de usuarios para autenticaci?n, comprobaci?n de existencia o resoluci?n interna no se serializan. Las respuestas de seguridad, flujos, documentos y liquidaciones usan proyecciones seguras. Las pruebas recorren respuestas anidadas y rechazan la clave `passwordHash` y el hash centinela de los usuarios de prueba.

## D. Migraciones

Una migraci?n de datos, sin cambios al modelo Prisma:

`backend/prisma/migrations/20260912120000_ocr_process_permission/migration.sql`

Se consultaron Permission y RolePermission reales: ya exist?an OCR_REVIEW, OCR_CONFIRM, OCR_UPLOAD y permisos de lectura. Solo faltaba OCR_PROCESS. La migraci?n crea ese permiso y lo asigna a ADMIN, REVISOR_OCR, FINANZAS y GERENTE, que ya dispon?an del procesamiento por la excepci?n de roles anterior. No asigna procesamiento a SOLICITANTE ni AUDITOR. Seed actualizado. Correcci?n reutiliza OCR_REVIEW; no se crearon OCR_CORRECT u OCR_EDIT duplicados.

Se aplicaron correctamente las **26 migraciones** desde una base vac?a aislada. Se comprob? la idempotencia de la nueva migraci?n y sus asignaciones. No se aplicaron migraciones a bases existentes ajenas al contenedor de pruebas.

## E. Pruebas

| Verificaci?n | Resultado |
| --- | --- |
| Suite backend anterior | 86/86 |
| Suite backend final, npm test | 106/106; 20 pruebas nuevas |
| PostgreSQL real, security-hardening.integration.js | 60/60, incluyendo el caso contenedor y 59 subcasos |
| Navegaci?n frontend | 10/10; 3 pruebas funcionales nuevas |
| OCR unittest en contenedor sin red | 9/9; 4 nuevas de autenticaci?n/middleware |
| Interpretaci?n documental OCR, funciones existentes | 5/5 |
| TypeScript backend --noEmit --incremental false | Pasa |
| TypeScript frontend --noEmit | Pasa |
| Build backend | Pasa |
| Build frontend, tsc -b y Vite | Pasa |

Total reportado por estos ejecutores: **190 verificaciones/casos, cero fallos finales**. No se sum? nuevamente la suite anterior de 86. El contador PostgreSQL incluye su prueba contenedora.

Las empresas A y B contienen usuarios persistidos, solicitudes, pagos, liquidaciones, documentos con resultados/correcciones OCR, flujos, cuentas bancarias y partidas presupuestarias. El contexto autenticado se obtiene mediante JwtStrategy contra estos usuarios y roles persistidos. La matriz permite A?A y B?B, rechaza A?B y B?A, verifica efectos previos a escritura, exportaciones y conservaci?n de permisos globales. Tambi?n prueba documentos cargados por un administrador sin empresa, identificaci?n fiscal que no concede acceso y asignaciones hist?ricas a otra empresa.

La integraci?n utiliza consultas Prisma/PostgreSQL reales. El almacenamiento usa un doble controlado para probar que una denegaci?n no llega a MinIO; no se realiz? una descarga E2E contra MinIO. Excel y PDF s? generan bytes mediante los exportadores reales. El middleware OCR se ejercit? en el contenedor con las dependencias del microservicio, antes de entrar al handler.

La primera preparaci?n de integraci?n encontr? una regla SLA ya creada por las migraciones; se corrigi? con preparaci?n repetible y una base de prueba dedicada. Los errores TypeScript transitorios fueron corregidos. No quedan fallos atribuibles a estos cambios. Vite conserva avisos de tama?o del bundle y tiempos de plugins, sin error de build.

Comandos principales, desde la ra?z:

```powershell
npm --prefix backend test
node backend/node_modules/typescript/bin/tsc -p backend/tsconfig.json --noEmit --incremental false
node frontend/node_modules/typescript/bin/tsc -p frontend/tsconfig.json --noEmit
npm --prefix frontend run build
node --test frontend/test/navigation-rbac.test.cjs
# SECURITY_TEST_DATABASE_URL debe apuntar a la base desechable security_hardening en loopback.
node --test backend/test/security-hardening.integration.js
```

El test de integraci?n rechaza otras bases y limpia sus tablas de datos de prueba al comenzar. No debe ejecutarse sobre una base con datos que se deseen conservar.

## F. Seguridad

- **passwordHash:** sin exposiciones conocidas en las respuestas revisadas; verificaci?n recursiva de resultados reales.
- **IDOR/BOLA:** controles de recurso previos a lectura, descarga y escritura, incluyendo caminos alternativos e identificadores relacionados.
- **Empresas:** alcance derivado del usuario, ausencia de empresa denegada salvo permiso global expl?cito; identificadores funcionales se intersectan con ese alcance.
- **Documentos:** permisos de carga, lectura y descarga; relaci?n con proceso para comprobantes; no se generan URLs presignadas.
- **OCR:** lectura, procesamiento, correcci?n y confirmaci?n separados; fiscal validation y m?tricas protegidas; endpoint interno autenticado.
- **Pagos:** consulta, bandeja y registro sujetos a empresa/rol; cuentas bancarias restringidas al titular autorizado.
- **Liquidaciones:** acceso empresarial y al recurso antes de efectos; indicadores, devoluciones y selecci?n documental protegidos.
- **Trazabilidad:** misma frontera que solicitudes y flujos; proyecciones de usuarios seguras.
- **Reportes:** REPORTS_VIEW y alcance empresarial, incluyendo cat?logos, dashboard y OCR.
- **Exportaciones:** invocan la misma consulta autorizada; validaci?n con ambos formatos reales.

## G. Riesgos y l?mites restantes

No quedan brechas conocidas abiertas dentro del c?digo auditado. La activaci?n en un entorno existente requiere aplicar la nueva migraci?n, configurar el mismo secreto `OCR_INTERNAL_API_KEY` en backend y OCR, y desplegar/reiniciar ambos con estos cambios. La clave real no se incluye en el repositorio. Compose exige configurarla; sin ella el procesamiento falla cerrado. Las pruebas no equivalen a un despliegue sobre el entorno existente ni a una prueba E2E de MinIO.

Los permisos globales expl?citos se conservaron intencionalmente; sus titulares pueden seguir consultando m?ltiples empresas. La fiscalizaci?n documental conserva las reglas existentes y no se usa para conceder acceso a documentos. El aviso de tama?o del frontend es de rendimiento, no un fallo de compilaci?n.

## H. Estado

**COMPLETO en c?digo, auditor?a y pruebas del Prompt 01.1.** El despliegue sobre el entorno existente no forma parte de lo ejecutado.

## I. Decisi?n

**S?: el Prompt 01 puede cerrarse a nivel de implementaci?n y pruebas, y se puede continuar con el Prompt 02.** Antes de usar este cierre como garant?a sobre un entorno desplegado, se deben activar la migraci?n y la configuraci?n indicadas en G. No se ejecut? el Prompt 02.
