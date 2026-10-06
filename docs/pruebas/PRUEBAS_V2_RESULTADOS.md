# Resultados de `Pruebas_v2.xlsx`

## Fuente y alcance

Se generó `docs/pruebas/Pruebas_v2.xlsx` como copia independiente de `docs/pruebas/Pruebas.xlsx`. El archivo fuente conserva una hoja visible llamada `Pruebas Req Func`, con el título institucional **Resultados de Pruebas de Requerimientos Funcionales**, datos generales, nueve columnas de casos, comentarios e indicadores. El prompt de referencia menciona `Pruebas.xls`, pero ese archivo no existe en el repositorio; el origen disponible es `Pruebas.xlsx`.

La hoja institucional de la versión 2 conserva esa organización visual y registra nueve casos respaldados por evidencia existente. Se mantuvieron vacíos los datos que no estaban disponibles (analista, ejecutor, fechas y tiempos estimados). No se inventaron fechas, tiempos ni resultados manuales.

## Resumen del contenido

| Indicador | Valor |
| --- | ---: |
| Requerimientos registrados | 9 códigos |
| Casos registrados | 9 |
| Pruebas realizadas | 9 |
| Pruebas pendientes | 0 |
| Pruebas exitosas | 9 |
| Pruebas no exitosas | 0 |
| % pruebas realizadas | 100% |
| % pruebas exitosas | 100% |

Los indicadores se calculan con fórmulas en la hoja principal: total mediante `COUNTA`, realizadas/exitosas/no exitosas mediante `COUNTIF`, y porcentajes mediante división con protección contra cero. Excel queda configurado para recalcular al abrir el archivo.

Este 100% corresponde exclusivamente a los nueve casos incorporados en esta versión con evidencia disponible. No representa una métrica global de calidad ni sustituye las métricas del sistema.

## Hoja `Trazabilidad Evidencia`

La segunda hoja diferencia explícitamente los tipos de evidencia:

- PRUEBA AUTOMATIZADA.
- PRUEBA DE INTEGRACIÓN/E2E.
- EVIDENCIA DE BASE DE DATOS.
- EVIDENCIA DE CONCURRENCIA.

La clasificación no convierte una prueba automatizada o PostgreSQL en una prueba funcional manual. Las filas contienen la iteración, resultado, evidencia disponible, defecto, corrección, reprueba y observaciones.

## Casos incorporados

Los casos cubren presupuesto suficiente e insuficiente, flujo de solicitud/reserva/aprobación, pago PAGADO, documento OCR autorizado, E2E sin reintegro, E2E con reintegro, numeración concurrente y controles concurrentes. Se conservaron los identificadores reales disponibles para el E2E principal y sus relaciones:

- Request `9c24940d-4e4b-4bcf-b1ca-c892af67f4c1`.
- Reservation `314ee3f3-ac82-4f65-9ba7-fda785cfd685`.
- Payment `4ffb87de-f5f3-4a0d-af3a-26b203027841`.
- Document `dd0ae3bc-dcad-4517-9241-50e748da23d2`.
- Settlement `44fcaabc-f45b-4705-b569-03334b4500af`, código `LIQ-2026-00008`.

Los identificadores del E2E con reintegro no estaban disponibles en la documentación consultada y por eso no se inventaron.

## Defecto P2034 y reprueba

La numeración concurrente se documenta como ciclo completo:

1. Primera ejecución: **NO EXITOSA**, conflicto PostgreSQL `P2034` bajo `Serializable`.
2. Defecto: conflicto transaccional durante la generación concurrente.
3. Corrección: reintentos acotados únicamente para `P2034`, conservando `Serializable`, `pg_advisory_xact_lock`, `UNIQUE` y validaciones.
4. Reprueba: **EXITOSA**, cinco códigos únicos.
5. Resultado final: **EXITOSA**.

Códigos documentados: `LIQ-2026-00287`, `LIQ-2026-00288`, `LIQ-2026-00289`, `LIQ-2026-00290`, `LIQ-2026-00291`.

## Validaciones realizadas

- El libro generado es un ZIP/XLSX válido (`testzip` sin errores).
- Contiene las hojas `Pruebas Req Func` y `Trazabilidad Evidencia`.
- Las fórmulas no contienen `#REF!` ni divisiones sin protección.
- La hoja principal conserva título, columnas, agrupaciones, estilos y resumen institucional.
- El hash SHA-256 del original antes y después de la generación fue `f78923b8c7506e5851a2e53f8d1600d625acea3cadbef33fa4138564573daa1e`; el original no fue sobrescrito.

## Limitaciones

- No se implementó exportación desde la aplicación hacia Excel; esta entrega genera la versión institucional a partir de evidencia documentada.
- No se importaron automáticamente registros históricos a la base de datos del módulo.
- Las fechas y tiempos estimados se dejaron como `No registrada` porque no había evidencia confiable.
- La prueba de reintegro conserva montos y resultado documentados, pero no IDs que no estaban disponibles.
- La validación estructural fue realizada con el contenedor XLSX; no se dispone de una sesión gráfica de Excel en este entorno.
