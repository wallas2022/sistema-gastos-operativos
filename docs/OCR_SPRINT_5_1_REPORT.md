# Informe Sprint OCR 5.1 — Estabilización y Robustecimiento

Fecha de cierre: 2026-08-10

## Alcance

El sprint se limitó al módulo OCR. No se modificó la lógica de solicitudes de gasto, no se añadieron plantillas dinámicas, no se incorporó IA adicional y se mantuvo el contrato consumido por el frontend.

## Cambios realizados

1. Se normalizó la lectura de resultados PaddleOCR 2.x/3.x y estructuras anidadas de PaddleX.
2. Los PDF se procesan página por página: se usa texto nativo cuando existe y OCR visual en cada página escaneada.
3. Se capturan `rec_scores` reales, se convierten a porcentaje y se persisten como confianza promedio y confianza de campos/items derivados.
4. `ERROR_OCR` se conserva en el resultado y en `Document.status`; ya no se convierte en `PENDIENTE_REVISION`.
5. El cliente NestJS usa `AbortController` y `OCR_TIMEOUT_MS`.
6. El endpoint se construye desde `OCR_SERVICE_URL`; se eliminó la URL fija.
7. Dependencias fijadas, librerías del sistema, usuario no privilegiado, healthcheck y modelos OCR incluidos en la imagen Docker.
8. Se eliminaron el cliente OCR duplicado, el procesador copiado, DTOs obsoletos, el DTO con nombre dañado, el script experimental y imports sin uso.
9. Procesar, consultar, corregir, confirmar y editar items exige acceso al documento por propiedad, empresa o permiso global.
10. Se validan MIME, tamaño, resolución y máximo de páginas mediante parámetros configurables.
11. Se incorporaron logs con request ID, ruta, estado, duración, página, reintento y errores.
12. Se persisten duración, páginas totales, páginas OCR, páginas de texto directo, reintentos y versión del motor.

## Problemas encontrados y resueltos

- `requirements.txt` no incluía PaddleOCR, PaddlePaddle, NumPy, Pillow ni PyMuPDF.
- El contenedor inicialmente descargaba modelos en la primera solicitud; ahora se incluyen durante el build.
- PaddlePaddle 3.3.1 fallaba con oneDNN y PP-OCRv6 en Linux. Se configuró la ruta CPU portable con `enable_mkldnn=False` y `FLAGS_use_mkldnn=0`.
- La confianza anterior era heurística/fija. Ahora deriva de `rec_scores`.
- Los PDF escaneados solo procesaban la primera página. Ahora se recorren todas las páginas permitidas.
- Los errores funcionales del OCR respondían HTTP 200 y el backend los marcaba para revisión. Ahora el backend inspecciona `success` y `processStatus`.
- El filtro de permisos se calculaba en el listado de documentos, pero no se aplicaba a `findMany` ni `count`. Se corrigió.
- `confirmDocument` utilizaba `req.user.userId`, aunque la estrategia JWT expone `id`. Se corrigió.

## Métricas persistidas

- `processingDurationMs`
- `pageCount`
- `ocrPageCount`
- `directTextPageCount`
- `retryCount`
- `engineVersion`

Estas columnas se agregaron de forma aditiva mediante la migración `20260810210000_ocr_processing_metrics`.

## Pruebas ejecutadas

- 5 pruebas Python: confianza Paddle, PDF digital multipágina, PDF escaneado multipágina, imagen inválida y límite de resolución.
- 19 pruebas backend: suite existente más URL configurable, timeout, persistencia de métricas y clasificación de estados.
- Build NestJS y generación Prisma exitosos.
- Migración aplicada correctamente contra PostgreSQL local.
- Build Docker completo exitoso con dependencias y modelos incluidos.
- Prueba de caja negra PDF de dos páginas: ambas páginas presentes, `pageCount=2`.
- Prueba de MIME inválido: HTTP 415.
- Prueba PaddleOCR real en contenedor: texto reconocido, confianza real 98.03%, sin reintentos.
- Prueba de permisos: un solicitante recibió HTTP 403 al intentar procesar un documento ajeno.
- Healthchecks: OCR, backend y frontend operativos.
- El build global del frontend continúa bloqueado por errores TypeScript preexistentes en conciliación, trazabilidad y un router alterno; no corresponden al módulo OCR ni fueron modificados por este sprint. La aplicación Vite activa responde HTTP 200 y el contrato OCR no cambió.

## Pendientes propuestos para Sprint OCR 5.2

- Procesamiento asíncrono con cola de trabajos y progreso observable.
- Pruebas de carga y límites de concurrencia/memoria con documentos grandes.
- Panel de métricas agregadas y alertas operativas.
- Estrategia de retención y anonimización de texto OCR en logs y auditorías.
- Cobertura con un corpus versionado de facturas reales por país y calidad de captura.
- Revisión futura de plantillas dinámicas, expresamente fuera del alcance de 5.1.
