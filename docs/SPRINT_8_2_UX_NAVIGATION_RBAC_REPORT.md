# Sprint 8.2 – UX, Navegación, Menú Dinámico y Accesibilidad

## Objetivo

Mejorar navegación, permisos visuales, responsive, accesibilidad y preferencias sin modificar lógica de negocio.

## Estado inicial

Existían `MainLayout`, `Sidebar`, `Header`, React Router, `RoleProtectedRoute`, una página 404 y RBAC almacenado en el usuario autenticado. El Sidebar era estático, siempre expandido, sólo visible en escritorio y mostraba todas las opciones. No había breadcrumbs, 403, última ruta ni persistencia del menú.

## Auditoría realizada

Se revisaron layout, router, JWT/RBAC, roles, permisos, protección de rutas, Chakra UI, Dashboard, notificaciones, Redux y servicios de pendientes. Redux sólo gestiona reportes. Los permisos granulares existentes corresponden a Seguridad; las demás restricciones comprobadas son por roles en rutas/controladores.

## Cambios implementados

- Configuración central de navegación filtrada con roles y permisos existentes.
- Sidebar expandible/colapsable sin recarga, con preferencia `sidebarExpanded` y grupos persistidos en `localStorage`.
- Navegación móvil tipo Drawer con overlay, cierre, Escape y adaptación del contenido.
- Estados activos de grupo e hijo, tooltips nativos, `aria-label`, `aria-expanded` y foco visible.
- Página 403 y protección visual central; `RoleProtectedRoute` muestra 403.
- Breadcrumbs derivados de la configuración de rutas.
- Última ruta autorizada persistida y restaurada después del login únicamente si continúa permitida.
- Menú de perfil conectado con Seguridad de Sprint 8.1.
- Contadores reales mediante endpoints existentes para aprobaciones, OCR, liquidaciones, devoluciones y desembolsos, consultados sólo por roles autorizados.

## Componentes modificados

`MainLayout`, `Sidebar`, `Header`, `RoleProtectedRoute`, `LoginPage`, router y configuración TypeScript. Se agregaron `navigation.ts`, `Breadcrumbs` y `ForbiddenPage`.

## Rutas afectadas

Las rutas existentes no cambiaron. Se centralizó su exposición visual y se agregó respuesta 403 para rutas conocidas sin autorización. La ruta comodín continúa mostrando 404.

## Permisos verificados

Se contemplan ADMIN, GERENTE, FINANZAS, TESORERIA, REVISOR_OCR y SOLICITANTE. Seguridad usa `SECURITY_USERS_READ`, `SECURITY_ROLES_READ`, `SECURITY_PERMISSIONS_READ` y `SECURITY_MATRIX_READ`. No se crearon permisos.

## Pruebas realizadas

- Build frontend y backend.
- Regresión backend.
- Pruebas estructurales de los seis roles, permisos, colapso, persistencia, responsive, Escape, foco, breadcrumbs, 403 y 404.
- Prisma validate. Prisma generate no correspondió porque Sprint 8.2 no modifica el schema.

## Resultados

La navegación se filtra sin llamadas repetidas para permisos; los contadores se actualizan cada 60 segundos y toleran fallos individuales. El contenido mantiene `minW=0` y `overflowX=hidden`.

## Problemas encontrados

Sólo Seguridad posee permisos granulares persistidos. Para otros módulos se conservaron exclusivamente restricciones por rol ya presentes en el código.

## Problemas preexistentes

El bundle principal supera 500 kB y Vite advierte sobre code splitting. Varias páginas históricas aún implementan sus propios estados de carga/error y no existe un Toast global único.

## Trabajo pendiente

No se mostraron contadores para módulos sin endpoint equivalente. La carga diferida general queda pendiente porque implicaría una refactorización amplia fuera del alcance.
