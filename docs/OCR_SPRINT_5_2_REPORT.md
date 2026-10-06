# Informe técnico — Sprint OCR 5.2

Fecha de cierre: 10 de agosto de 2026.

## Resultado

Se separó el reconocimiento óptico de la interpretación documental. PaddleOCR continúa siendo el único motor OCR y entrega texto y confianza real; el nuevo `DocumentIntelligenceEngine` recibe esos datos y realiza clasificación, segmentación, resolución de plantilla, extracción contextual y validación. No se cambió el flujo de Solicitudes de Gasto ni el contrato consumido por el frontend.

## Arquitectura resultante

```text
Archivo -> OcrProcessor/PaddleOCR -> texto + confianza real
                                  |
                                  v
                    DocumentIntelligenceEngine
                    |-- DocumentClassifier
                    |-- DocumentSegmenter
                    |-- TemplateResolver
                    |-- FieldExtractor
                    `-- RuleValidator
                                  |
                                  v
             contrato OCR existente + auditoría por campo
                                  |
                                  v
                 Backend NestJS -> PostgreSQL -> Frontend
```

Los bloques lógicos soportados son `HEADER`, `ISSUER`, `BUYER`, `DETAIL`, `TAXES`, `FOOTER` y `GENERAL`. La extracción busca alias dentro del bloque esperado, no sobre todo el documento. Esto permite diferenciar NIT de emisor, comprador y certificador. El detalle sólo se analiza dentro de `DETAIL` y excluye encabezados, totales e historiales.

El modelo interno `TemplateDefinition` contiene país, tipo documental, versión, alias y una colección dinámica de `FieldDefinition`. La implementación incluye plantillas GT/genéricas en código; no se agregó interfaz administrativa.

## Cambios realizados

- Motor documental desacoplado y compuesto por cinco servicios especializados.
- Detección de tipo documental, país y moneda mediante evidencia contextual.
- Segmentación lógica basada en encabezados documentales.
- Extracción por alias y bloque, con normalización por tipo de dato.
- Separación contextual de NIT de emisor, comprador y certificador.
- Extracción de líneas limitada al bloque de detalle, excluyendo encabezados e historiales.
- Validación de evidencia mínima y coherencia `subtotal + impuesto = total`.
- `ERROR_OCR` cuando no existe evidencia interpretable; nunca se degrada a revisión pendiente.
- Auditoría persistente por campo: `sourceBlock` y `extractionRule`, junto con valor y confianza ya existentes.
- Plantilla resuelta y mensajes de validación expuestos mediante `extraFields`, conservando el contrato actual.
- Eliminación del parser monolítico `invoice_parser.py` que quedó reemplazado.
- Corrección del comando productivo del backend a `dist/src/main`.

## Archivos modificados

### Microservicio OCR

- `app/main.py`
- `app/schemas.py`
- `app/document_intelligence/__init__.py`
- `app/document_intelligence/models.py`
- `app/document_intelligence/text.py`
- `app/document_intelligence/classifier.py`
- `app/document_intelligence/segmenter.py`
- `app/document_intelligence/templates.py`
- `app/document_intelligence/field_extractor.py`
- `app/document_intelligence/validator.py`
- `app/document_intelligence/engine.py`
- `tests/test_document_intelligence.py`
- Eliminado: `app/services/invoice_parser.py`

### Backend y base de datos

- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260810190000_ocr_field_audit/migration.sql`
- `backend/src/modules/ocr/ocr.service.ts`
- `backend/package.json`

## Problemas encontrados y resueltos

- El parser anterior mezclaba OCR e interpretación en un archivo monolítico de más de 800 líneas.
- Los NIT se buscaban sin suficiente conocimiento del bloque documental.
- La palabra `TOTAL` podía coincidir con `SUBTOTAL`; se corrigió con prioridad de alias y exclusión contextual.
- Encabezados e historiales con números podían convertirse en artículos; ahora se filtran y sólo se procesa `DETAIL`.
- El script `start:prod` apuntaba a una salida inexistente; se alineó con la estructura compilada real.

## Pruebas ejecutadas y resultados

- 5 pruebas del motor documental: aprobadas.
  - clasificación y segmentación;
  - separación de tres NIT;
  - filtrado de detalle;
  - auditoría y confianza real;
  - plantilla/campo dinámico;
  - ausencia de evidencia termina en `ERROR_OCR`.
- Build Docker del OCR: aprobado.
- 19 pruebas del backend, incluido build NestJS: aprobadas.
- Migración Prisma `ocr_field_audit`: aplicada correctamente.
- Contenedor `ocr_service`: operativo y saludable en puerto 8000.
- Backend compilado: operativo en puerto 3000.

## Compatibilidad

Los campos existentes (`documentContext`, `normalizedFields`, `extraFields`, `items` y `totals`) se mantienen. Los dos atributos nuevos de auditoría son opcionales, por lo que el frontend actual puede ignorarlos. No hubo cambios en Solicitudes de Gasto ni pantallas nuevas.

## Pendientes propuestos para Sprint OCR 5.3

- Persistir plantillas y alias versionados en una fuente configurable.
- Crear un corpus anonimizado y pruebas de regresión por proveedor/país.
- Incorporar resolución de columnas y renglones de detalle a partir de coordenadas OCR.
- Afinar reglas de documentos con diseños sin encabezados explícitos.
- Definir métricas de precisión por campo y umbrales por tipo documental.
- Diseñar, sin habilitar todavía, el ciclo de publicación y rollback de plantillas.
