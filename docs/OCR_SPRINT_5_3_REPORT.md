# Informe técnico — Sprint OCR 5.3

Fecha: 10 de agosto de 2026.

## Resultado ejecutivo

Se implementó la capa funcional, de UX, auditoría y métricas sobre OCR 5.1/5.2 sin modificar PaddleOCR ni los componentes `DocumentClassifier`, `DocumentSegmenter`, `TemplateResolver`, `FieldExtractor`, `RuleValidator` o `DocumentIntelligenceEngine`.

El sistema conserva los contratos FastAPI, NestJS, Prisma, PostgreSQL, React y MinIO. No se modificó la lógica de Solicitudes de Gasto, Workflow, Presupuesto, Políticas ni Dashboard Ejecutivo.

## Arquitectura final

```text
FastAPI / PaddleOCR / Document Intelligence Engine (sin cambios)
                         |
                         v
NestJS OCR Service ---- sincronización de estados
        |                auditoría de correcciones
        |                métricas y validación de tesis
        v
PostgreSQL / Prisma
        |
        +--> Revisión documental React
        +--> Dashboard OCR
        `--> Reportes OCR Excel/PDF
```

## Funcionalidad implementada

### Revisión y confianza

- Campos agrupados en emisor, documento, comprador, información tributaria y otros campos detectados.
- Todos los campos entregados por Document Intelligence permanecen visibles; los no catalogados se muestran en “Otros campos detectados”.
- Confianza individual con semáforo verde `>=95`, amarillo `80–94.99` y rojo `<80`.
- Productos/servicios conservan su editor y confianza individual.

### Auditoría e historial

- Panel desplegable con campo, valor OCR, valor confirmado, bloque, regla, confianza y última modificación.
- Nueva tabla inmutable `OCRFieldCorrection`.
- Cada cambio registra valor OCR, valor anterior, valor final, usuario, fecha y motivo opcional.
- `detectedValue` nunca se sobrescribe.

### Estados

- Documento y `OCRResult.processStatus` se actualizan juntos.
- Flujo efectivo: `CARGADO -> PROCESANDO -> PENDIENTE_REVISION -> CONFIRMADO`.
- Si el documento ya está vinculado, la confirmación termina en `ASOCIADO_SOLICITUD`.
- Los errores terminan en `ERROR_OCR` tanto en documento como en resultado OCR.

### Dashboard y reportes

- Dashboard OCR basado exclusivamente en consultas reales a PostgreSQL.
- Indicadores: documentos, estados, tiempos OCR/revisión, confianza, correcciones y campos detectados/omitidos.
- Gráficas por país, tipo y empresa.
- Reporte OCR con filtros de fecha, empresa, usuario, estado, país y tipo documental a nivel API; la pantalla expone fecha, estado, país y tipo.
- Exportación real Excel y PDF mediante el exportador existente.

### Métricas y tesis

- `OCRResult` almacena inicio de revisión, confirmación, campos detectados, omitidos y número de modificaciones.
- Endpoint `POST /api/ocr/:documentId/validation-runs` registra documento/tipo, resultado esperado, obtenido, correcto/incorrecto, observaciones y ejecutor.
- Nueva tabla `OCRValidationRun` preparada para análisis estadístico posterior.

## Archivos modificados

- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260810223000_ocr_ux_audit_metrics/migration.sql`
- `backend/src/modules/ocr/ocr.service.ts`
- `backend/src/modules/ocr/ocr.controller.ts`
- `backend/src/modules/ocr/dto/update-fields.dto.ts`
- `backend/src/modules/ocr/dto/create-validation-run.dto.ts`
- `backend/src/modules/reports/dto/report-query.dto.ts`
- `backend/src/modules/reports/reports.controller.ts`
- `backend/src/modules/reports/reports.service.ts`
- `backend/test/ocr-service.test.js`
- `frontend/src/modules/documents/pages/DocumentDetailPage.tsx`
- `frontend/src/modules/documents/services/documents.service.ts`
- `frontend/src/modules/ocr/components/OcrReviewPanel.tsx`
- `frontend/src/pages/ocr/OcrAnalyticsPage.tsx`
- `frontend/src/router.tsx`
- `frontend/src/layout/Sidebar.tsx`

No se modificó ningún archivo de `Microservicio-OCR/app/document_intelligence` durante este sprint.

## Migración

`20260810223000_ocr_ux_audit_metrics`:

- agrega `ASOCIADO_SOLICITUD`;
- agrega métricas a `OCRResult`;
- crea `OCRFieldCorrection`;
- crea `OCRValidationRun`;
- calcula el número real de campos ya detectados para resultados históricos.

La migración fue aplicada correctamente sobre PostgreSQL.

## Pruebas y resultados

- Backend NestJS: **19/19 aprobadas**.
- Build backend: **aprobado**.
- Prisma generate: **aprobado**.
- Prisma migrate deploy: **aprobado**.
- Build Docker OCR: **aprobado**.
- Regresión OCR: **10/10 aprobadas** (5 procesador + 5 Document Intelligence).
- Multipágina digital/escaneado: **aprobado mediante regresión automatizada**.
- Dashboard API con datos reales: 8 resultados OCR, 3 agrupaciones de país, 1 de tipo y 2 de empresa.
- Reporte API: 8 registros reales.
- Excel: generado correctamente, 7,721 bytes.
- PDF: generado correctamente, 3,542 bytes.
- Frontend: los archivos OCR 5.3 no presentan errores TypeScript; el build global continúa bloqueado por 8 errores preexistentes en conciliación, monitor de estados y un router alterno, más declaraciones de `rolldown`.

## Validación funcional con documentos existentes

| Documento | Resultado disponible |
|---|---|
| Factura de energía/FEL (`facturaluz.jpeg`) | Confirmada, GT, confianza 99.12%, 1 página |
| Parqueo (`parqueo.jpeg`) | Confirmado, GT, confianza 97.15%, 1 página |
| Facturas FEL adicionales | Detectadas como factura GT en documentos reales existentes |
| PDF `Documento No. 1954770-abril.pdf` | El archivo disponible reportó 1 página y al reprocesarlo terminó coherentemente en `ERROR_OCR` con ambos estados sincronizados |
| Documento multipágina | No existe una muestra multipágina identificable en los datos disponibles; validado sólo mediante las pruebas automatizadas |

## Capturas

No se adjuntan capturas porque el navegador integrado no estuvo disponible en la sesión. No se usaron imágenes fabricadas ni datos simulados. Dashboard, reporte y exportaciones se verificaron contra los endpoints en ejecución.

## Problemas encontrados

- La corrección anterior sobrescribía el valor final sin historial.
- Documento y resultado OCR podían exponer estados distintos.
- Los datos históricos no tenían inicio de revisión, por lo que no se inventaron tiempos retroactivos.
- La pantalla original mostraba todos los campos en una lista plana sin confianza contextual.
- No existe actualmente una muestra real multipágina identificable para validación manual.
- El build global del frontend contiene errores anteriores y ajenos al OCR 5.3.

## Pendientes recomendados para OCR 5.4

- Incorporar una pantalla controlada para administrar ejecuciones de validación de tesis.
- Incorporar filtros de empresa y usuario como selectores catalogados en la pantalla de reportes.
- Construir un corpus real anonimizado que incluya varios PDFs multipágina.
- Definir denominadores de campos esperados por tipo para una métrica de omisión más precisa.
- Agregar auditoría equivalente para altas, modificaciones y eliminaciones de líneas de detalle.
- Corregir la deuda TypeScript global del frontend y ejecutar regresión visual automatizada.
- Capturar evidencia visual cuando el navegador integrado esté disponible.
