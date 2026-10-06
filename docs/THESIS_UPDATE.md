# Actualización de tesis — Sprint 4.5

## Sprint y módulo

Sprint 4.5 — Dashboard Ejecutivo. Ampliación del módulo de Gestión y Control Presupuestario para la explotación ejecutiva de información existente.

## Capítulos modificados

- Capítulo III — Marco Metodológico: requerimiento de Gestión y Control Presupuestario, arquitectura general, casos de uso y fase de construcción RUP.
- Capítulo IV — Desarrollo metodológico: ampliación de la Interacción V, sin crear una nueva interacción ni renumerar las existentes.
- No se modificaron portada, índice, marco teórico, factibilidades, cronograma ni referencias.

## Requerimiento funcional afectado

`RF-05 Gestión y Control Presupuestario`. Se agregó `CU-PRE-006 Consultar Dashboard Ejecutivo` y `RNF-PRE-002`, manteniendo un único requerimiento funcional para el módulo principal.

## Reglas nuevas

- Los indicadores se obtienen exclusivamente de registros existentes.
- El dashboard solo ejecuta consultas de lectura.
- No se almacenan copias de KPI ni datos agregados.
- No se ejecutan nuevamente Policy Engine, Approval Engine o Budget Engine.
- Los indicadores SLA reutilizan `SlaService`.
- El acceso se limita a Administración, Gerencia y Finanzas.
- Las dimensiones sin información muestran cero o colecciones vacías.
- Excel permanece como única fuente presupuestaria oficial.
- Oracle JD Edwards queda fuera del alcance del Trabajo de Graduación.

## Casos de uso modificados

- Caso de uso general: consulta de información ejecutiva.
- `CU-PRE-006`: consultar indicadores, aplicar filtros y actualizar resultados.
- Interacción V: reglas, secuencia normal, manual técnico, manual de usuario y evidencias.

## Diagramas afectados

- Diagrama 3.1 — Arquitectura general: incorporar `ExecutiveDashboardPage`, React Query, `DashboardController` y `DashboardService`.
- Diagrama 3.7 — Caso de uso general: agregar “Consultar Dashboard Ejecutivo”.
- Diagrama de componentes de la Interacción V.
- Diagrama de flujo de consulta y filtrado ejecutivo.

## Modelo de datos

No se crearon ni modificaron modelos, tablas o migraciones. El dashboard consulta `ExpenseRequest`, `ExpenseRequestValidation`, `ApprovalFlow`, `ApprovalStep`, `SlaRule`, `BudgetVersion`, `BudgetLine`, `BudgetReservation`, `Company`, `Country` y `User`.

## Capturas sugeridas

- Vista completa del Dashboard Ejecutivo.
- Filtros ejecutivos desplegados.
- KPI de solicitudes y presupuesto.
- Semáforos SLA.
- Resultados de políticas.
- Tabla por aprobador.
- Consumo por empresa y país.
- Top 10 por tipo, centro de costo y cuenta.
- Tendencia mensual.
- Estado vacío sin datos simulados.

## Impacto arquitectónico

Se añadió una capa transversal de lectura. `DashboardService` concentra agregaciones en backend y reutiliza `SlaService`; el frontend consume siete grupos de indicadores y un catálogo de filtros mediante React Query y Axios. No se modificaron los servicios de dominio existentes.

## Justificación técnica

Centralizar los cálculos en backend mantiene consistencia entre usuarios, evita duplicar lógica en React y permite aplicar los mismos filtros sobre relaciones presupuestarias, solicitudes, políticas y aprobaciones. La ausencia de persistencia agregada garantiza que los indicadores representen el estado vigente de la base de datos.

## Evidencias y estado

- Backend compilado correctamente.
- Ocho consultas ejecutadas contra PostgreSQL.
- Filtros combinados verificados.
- Archivos del sprint sin errores TypeScript.
- Tesis generada como `Proyecto-de-Graduación-Walter-Rene-Rosales-v05.docx`; `v04` permanece intacta.
- Auditoría estructural: 7 secciones, 45 tablas, 51 imágenes y 52 recursos multimedia conservados.
- El render visual no pudo completarse por ausencia de LibreOffice; se requiere revisión final en Microsoft Word y actualización del índice antes de entrega académica.
