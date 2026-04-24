# Sistema web para la gestión y control presupuestario de gastos operativos empresariales

Proyecto académico y funcional orientado a la digitalización, control y trazabilidad de gastos operativos empresariales.

## Módulos principales

- Frontend web con React y Chakra UI.
- Backend API con NestJS.
- Base de datos PostgreSQL con Prisma ORM.
- Microservicio OCR con FastAPI y PaddleOCR.
- Extracción estructurada de facturas FEL de Guatemala.
- Flujo de carga, procesamiento, revisión y confirmación de documentos.

## Arquitectura general

El sistema utiliza una arquitectura modular basada en:

- Frontend React.
- Backend NestJS.
- Microservicio OCR independiente.
- PostgreSQL.
- Object Storage compatible con S3/MinIO.
- Autenticación JWT.

## Flujo OCR

1. El usuario carga una imagen de factura.
2. El backend almacena el documento.
3. El usuario procesa el OCR.
4. El backend envía la imagen al microservicio OCR.
5. El microservicio extrae texto y campos estructurados.
6. El backend guarda el resultado.
7. El usuario revisa y confirma el documento.

## Tecnologías

- React
- Chakra UI v3
- NestJS
- Prisma ORM
- PostgreSQL
- FastAPI
- PaddleOCR
- Docker
- MinIO / S3
