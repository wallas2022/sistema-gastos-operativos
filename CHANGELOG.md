# Changelog

## 2026-08-03 — Sprint 4.5

### Dashboard Ejecutivo

- Se agregó `DashboardModule`, `DashboardService` y `DashboardController`.
- Se reemplazó el dashboard estático por `ExecutiveDashboardPage` con datos reales.
- Se incorporaron filtros ejecutivos y consultas de solo lectura.
- Se agregaron KPI de solicitudes, presupuesto, workflow, SLA, políticas y aprobadores.
- Se agregaron agrupaciones por empresa, país, tipo de gasto, centro de costo y cuenta presupuestaria.
- Se agregaron tendencias diarias, semanales y mensuales.
- Se incorporó React Query sobre el provider existente.
- No se agregaron tablas ni migraciones.
- Oracle JD Edwards se mantiene fuera del alcance; Excel continúa como única fuente oficial.

### Verificación

- Backend NestJS compilado correctamente.
- Ocho consultas del dashboard ejecutadas correctamente contra PostgreSQL.
- Filtros combinados verificados.
- Archivos del Sprint 4.5 sin errores TypeScript.
- El build global del frontend conserva errores preexistentes en módulos ajenos al dashboard.
