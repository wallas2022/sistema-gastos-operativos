# Resultados de `Pruebas_v3.xlsx`

## Fuente

La versión se generó a partir de `docs/pruebas/Pruebas_v2.xlsx`, conservando el libro institucional original `Pruebas.xlsx` sin sobrescribirlo. El archivo mantiene la hoja `Pruebas Req Func` y la hoja `Trazabilidad Evidencia`; se añadieron `Matriz de pruebas`, `Cobertura por iteración` y `Trazabilidad de pruebas`.

## Cobertura por iteración

Se documentaron siete iteraciones (01–07), con cinco casos por iteración. Los nueve casos de `Pruebas_v2.xlsx` no tenían una columna de iteración y por eso se conservaron en la hoja institucional, pero no se asignaron artificialmente a una iteración:

| Iteración | Casos previos clasificados | Agregados en v3 | Total | Aprobadas | Fallidas | Pendientes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 01 | 0 | 5 | 5 | 5 | 0 | 0 |
| 02 | 0 | 5 | 5 | 5 | 0 | 0 |
| 03 | 0 | 5 | 5 | 4 | 0 | 1 |
| 04 | 0 | 5 | 5 | 4 | 0 | 1 |
| 05 | 0 | 5 | 5 | 5 | 0 | 0 |
| 06 | 0 | 5 | 5 | 5 | 0 | 0 |
| 07 | 0 | 5 | 5 | 3 | 0 | 2 |

La matriz detallada contiene 35 casos. Los nueve casos previos permanecen conservados en la hoja institucional; los 35 casos de la matriz fueron clasificados por iteración. Los estados `APROBADO` se refieren a evidencia automatizada, de integración, PostgreSQL o documentada; no se presentan automáticamente como pruebas funcionales manuales. Los casos sin evidencia ejecutada suficiente están marcados `PENDIENTE`.

## Casos pendientes

- Iteración 03: comportamiento de documento sin NIT identificado, documentado como flujo alternativo pero sin evidencia independiente localizada.
- Iteración 04: observación y corrección/resubmisión, documentada funcionalmente pero sin prueba automatizada independiente localizada.
- Iteración 07: prueba dedicada del servicio de reporte presupuestario y evidencia específica de bitácora de eventos.

## Evidencia crítica para el Capítulo V

La matriz conserva y relaciona:

- control presupuestario suficiente e insuficiente;
- solicitud, reserva y aprobación;
- pago `PAGADO`;
- OCR y asociación documental;
- E2E sin reintegro;
- E2E con reintegro;
- diferencia pendiente y rechazo de cierre;
- concurrencia de reintegro, cierre, certificación y documentos;
- numeración concurrente con el ciclo P2034 → corrección → reprueba.

La numeración concurrente conserva los códigos reales `LIQ-2026-00287` a `LIQ-2026-00291` y registra el conflicto inicial `P2034` como resultado no exitoso antes de la corrección.

## Indicadores y trazabilidad

`Cobertura por iteración` calcula con fórmulas el total, aprobadas, fallidas, pendientes y cumplimiento del mínimo de cinco casos. `Trazabilidad de pruebas` relaciona objetivo específico, funcionalidad, iteración, caso, estado y evidencia. `Matriz de pruebas` incluye ID, módulo, objetivo, precondiciones, datos, pasos, resultado esperado/obtenido, estado y evidencia.

## Validación del archivo

- El paquete XLSX pasó la validación ZIP sin errores.
- Se verificaron cinco hojas y 35 filas de la matriz.
- Se verificaron fórmulas de cobertura y ausencia de `#REF!`.
- `Pruebas_v2.xlsx` permanece como fuente inmediata y `Pruebas.xlsx` permanece sin modificación.
- No se agregaron fechas, tiempos, capturas ni IDs no disponibles.

## Limitaciones

Los casos pendientes requieren ejecución posterior y no deben contabilizarse como aprobados en el capítulo de resultados. Las pruebas automatizadas, PostgreSQL, E2E y concurrencia están clasificadas como evidencia técnica según la fuente disponible. No se cargaron registros históricos en la base de datos ni se generaron capturas de interfaz que no existieran.

