# Registro de pruebas funcionales

## Referencia institucional

El repositorio contiene `Pruebas.xlsx` (el prompt menciona `Pruebas.xls`). El libro tiene una hoja visible llamada **Pruebas Req Func** y el título **Resultados de Pruebas de Requerimientos Funcionales**.

La estructura analizada conserva:

- Datos generales: Proyecto, Analista Encargado del proyecto, Pruebas realizadas por, Fecha de Inicio de Pruebas.
- Tabla de casos: No. Requerimiento, Pruebas a Realizar, Criterio de Aceptación, Tiempo Estimado, Fecha de prueba, Prueba realizada, Resultado Obtenido, Observaciones y Prueba Exitosa.
- Requerimientos agrupados: el código aparece en la primera fila y las filas siguientes continúan el mismo requerimiento.
- Comentarios Adicionales.
- Indicadores: Número de pruebas, Pruebas Realizadas, Pruebas por Realizar, Pruebas Exitosas, Pruebas No Exitosas, porcentaje realizadas y porcentaje exitosas.

## Modelo persistente

El módulo usa `FunctionalTestRecord`, `FunctionalRequirement`, `FunctionalTestCase` y `FunctionalTestEvidence`. Un registro contiene muchos casos; varios casos pueden referirse al mismo requerimiento. La evidencia reutiliza `Document` y su almacenamiento existente.

## API

- `POST /test-records` crea un registro.
- `GET /test-records` lista registros con indicadores calculados.
- `GET /test-records/:id` consulta el detalle.
- `PATCH /test-records/:id` edita datos generales mientras no esté cerrado.
- `POST /test-records/:id/cases` agrega un caso y crea/reutiliza el requerimiento.
- `PATCH /test-cases/:id` actualiza un caso.
- `POST /test-cases/:id/execute` registra ejecución, resultado, observaciones, actor y fecha.
- `POST /test-cases/:id/evidence` asocia un `documentId` existente como evidencia.
- `POST /test-records/:id/close` cierra el registro cuando no hay casos pendientes.
- `GET /test-records/:id/summary` devuelve totales y porcentajes auditables.

Todos los endpoints requieren JWT.

## Estados y consistencia

Registro: `BORRADOR`, `EN_EJECUCION`, `CERRADO`.

Caso: `PENDIENTE`, `EN_PROCESO`, `REALIZADA`, `NO_REALIZADA`.

Resultado: `EXITOSA`, `NO_EXITOSA`, `NO_APLICA`.

Una prueba no puede producir resultado sin ejecución. Una prueba realizada requiere resultado. Una prueba no exitosa requiere observación. Un registro cerrado no admite casos nuevos ni modificaciones ordinarias.

## Indicadores

- Total: número de casos.
- Realizadas: casos con estado `REALIZADA`.
- Pendientes: total menos realizadas.
- Exitosas: casos con resultado `EXITOSA`.
- No exitosas: casos con resultado `NO_EXITOSA`.
- `% realizadas`: realizadas / total × 100.
- `% exitosas`: exitosas / realizadas × 100; si no hay realizadas, el valor es 0.

Los porcentajes se calculan en backend a partir de filas persistidas y se redondean a dos decimales.

## Evidencia

La aplicación no crea almacenamiento paralelo. Se asocia un documento existente mediante `FunctionalTestEvidence`, conservando nombre, tipo, tamaño, referencia, hash cuando exista, usuario y fecha en `Document`/MinIO.

## Uso

1. Abrir **Pruebas funcionales** desde la navegación.
2. Crear el registro general.
3. Agregar uno o más casos, agrupándolos por código/nombre de requerimiento.
4. Ejecutar cada caso como exitosa, no exitosa o no aplica.
5. Registrar observaciones en los casos no exitosos.
6. Asociar documentos de evidencia desde el endpoint de evidencia.
7. Consultar el detalle y el resumen.
8. Cerrar el registro cuando todos los casos tengan ejecución.

## Exportación

No se implementó exportación Excel en esta iteración. El libro institucional queda como referencia y futura representación; la fuente de verdad es el registro persistente de la aplicación.

## Libro institucional actualizado

- `Pruebas.xlsx` es el archivo institucional original y permanece intacto.
- `Pruebas_v2.xlsx` es una copia independiente con nueve casos respaldados por evidencia disponible y la hoja adicional `Trazabilidad Evidencia`.
- La hoja institucional conserva el formato original y sus indicadores mediante fórmulas. La hoja de trazabilidad clasifica cada caso como prueba automatizada, integración/E2E, evidencia PostgreSQL o concurrencia, evitando confundir esos niveles con una prueba funcional manual.
- Los datos no disponibles (fechas, tiempos o IDs históricos) se dejan vacíos o se indican como no registrados.

## Matriz para el Capítulo V

`Pruebas_v3.xlsx` amplía el registro con 35 casos (cinco por cada iteración 01–07) y conserva los estados basados en evidencia. Incluye las hojas `Matriz de pruebas`, `Cobertura por iteración` y `Trazabilidad de pruebas`. Los casos sin evidencia suficiente permanecen como `PENDIENTE`; el libro no convierte pruebas automatizadas o PostgreSQL en pruebas funcionales manuales.
