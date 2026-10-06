# Sistema web para la gestión y control presupuestario de gastos operativos empresariales

## Manuales vigentes

La instalacion desde un clon nuevo, el inventario de versiones y el mantenimiento estan documentados en [Manual tecnico](docs/manuales/Manual_tecnico_Sistema_Gastos_Operativos.md). Consulte esa guia para la configuracion actual; algunas notas historicas inferiores no reflejan los cambios recientes.

El [Manual de usuario](docs/manuales/Manual_de_usuario_Sistema_Gastos_Operativos.docx) y el [Manual tecnico en Word](docs/manuales/Manual_tecnico_Sistema_Gastos_Operativos.docx) se conservan en docs/manuales. Todos los manuales nuevos deben guardarse en esa carpeta.


Proyecto académico y funcional orientado a la digitalización, control y trazabilidad de gastos operativos empresariales.

## Arquitectura

El sistema está compuesto por:

- Frontend web con React, TypeScript, Vite y Chakra UI.
- Backend API modular con NestJS y Prisma ORM.
- Base de datos PostgreSQL.
- Almacenamiento de documentos compatible con S3 mediante MinIO.
- Microservicio OCR independiente con FastAPI y PaddleOCR.
- Autenticación JWT y control de acceso mediante roles y permisos.

El contexto técnico detallado se encuentra en [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md).

## Requisitos locales

- Docker Desktop.
- Node.js y npm.
- Python 3.11, disponible en Windows mediante el launcher `py`.
- PowerShell.

Todos los comandos de esta guía parten de la raíz del repositorio:

```powershell
cd "E:\WR\Walter_Rosales\Proyectos\Sistema gastos operativos\stack"
```

## 1. Levantar la infraestructura Docker

El Compose actual inicia PostgreSQL, MinIO y pgAdmin:

```powershell
docker compose -f ".\dockers\server dockers\docker-compose.yml" up -d
```

Verificar el estado:

```powershell
docker compose -f ".\dockers\server dockers\docker-compose.yml" ps
```

Servicios disponibles:

| Servicio | Dirección | Credenciales locales |
|---|---|---|
| PostgreSQL | `localhost:5432` | `postgres / postgres` |
| MinIO API | `http://localhost:9000` | `minioadmin / minioadmin` |
| MinIO Console | `http://localhost:9001` | `minioadmin / minioadmin` |
| pgAdmin | `http://localhost:5050` | `admin@local.com / admin123` |

### Crear el bucket de documentos

1. Abrir `http://localhost:9001`.
2. Iniciar sesión con las credenciales de MinIO.
3. Crear el bucket configurado en `backend/.env`, normalmente `documents`.

La carga de documentos fallará si el bucket no existe.

## 2. Preparar PostgreSQL y Prisma

```powershell
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

Para desarrollo de nuevas migraciones puede utilizarse:

```powershell
npx prisma migrate dev
```

Debe utilizarse `migrate deploy` para aplicar migraciones existentes o `migrate dev` durante el desarrollo de migraciones, no ambos simultáneamente.

La conexión local esperada es:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ocr_db
```

## 3. Levantar el microservicio OCR

Abrir una terminal nueva:

```powershell
cd "E:\WR\Walter_Rosales\Proyectos\Sistema gastos operativos\stack\Microservicio-OCR"
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
py -m pip install --upgrade pip
pip install -r requirements.txt
```

El código utiliza dependencias que todavía no están declaradas en `requirements.txt`. Para ejecutar el OCR localmente también deben instalarse:

```powershell
pip install paddlepaddle paddleocr numpy pillow pymupdf
```

Iniciar FastAPI:

```powershell
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Si PowerShell no permite activar el entorno virtual:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Verificación:

- Salud: `http://localhost:8000/health`
- Swagger: `http://localhost:8000/docs`

Respuesta esperada:

```json
{"ok": true}
```

El Dockerfile OCR todavía no es reproducible porque `requirements.txt` no contiene todas las librerías utilizadas. Para pruebas actuales se recomienda el entorno virtual local.

## 4. Levantar el backend NestJS

Abrir otra terminal:

```powershell
cd "E:\WR\Walter_Rosales\Proyectos\Sistema gastos operativos\stack\backend"
npm install
npm run start:dev
```

La API queda disponible en:

```text
http://localhost:3000/api
```

### Variables del backend

`backend/.env` debe contener valores equivalentes a:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ocr_db
JWT_SECRET=<secreto-local>
JWT_EXPIRES_IN=8h
OCR_SERVICE_URL=http://localhost:8000
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_BUCKET=documents
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
```

El cliente OCR utiliza actualmente `http://localhost:8000/process` de forma directa, por lo que el microservicio debe estar ejecutándose en el puerto `8000` cuando ambos servicios corren localmente.

Aunque existe un `HealthModule`, actualmente no está registrado en `AppModule`; `/api/health` no debe utilizarse todavía como prueba del backend.

### Probar el login desde PowerShell

```powershell
$body = @{
  email    = "admin@demo.com"
  password = "Demo12345*"
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3000/api/auth/login" `
  -ContentType "application/json" `
  -Body $body
```

## 5. Levantar el frontend React

Abrir otra terminal:

```powershell
cd "E:\WR\Walter_Rosales\Proyectos\Sistema gastos operativos\stack\frontend"
npm install
npm run dev
```

Vite normalmente publica la aplicación en:

```text
http://localhost:5173
```

Aunque existe `VITE_API_URL`, el cliente Axios usa actualmente esta dirección fija:

```text
http://localhost:3000/api
```

Por esa razón, el backend debe ejecutarse en el puerto `3000`.

## 6. Usuarios locales del seed

El seed crea los siguientes usuarios:

- `admin@demo.com`
- `finanzas@demo.com`
- `tesoreria@demo.com`
- `revisor.ocr@demo.com`
- `gerente@demo.com`
- `solicitante@demo.com`
- `solicitante2@demo.com`

Contraseña local común:

```text
Demo12345*
```

Estas credenciales son únicamente para el ambiente local de desarrollo.

## 7. Orden recomendado de inicio

Utilizar cuatro terminales:

```text
Terminal 1: Docker Compose — PostgreSQL, MinIO y pgAdmin
Terminal 2: Microservicio OCR — puerto 8000
Terminal 3: Backend NestJS — puerto 3000
Terminal 4: Frontend Vite — puerto 5173
```

Secuencia recomendada:

1. Iniciar Docker Desktop.
2. Levantar PostgreSQL, MinIO y pgAdmin.
3. Crear el bucket `documents` en MinIO.
4. Aplicar migraciones y ejecutar el seed.
5. Iniciar el microservicio OCR.
6. Iniciar el backend.
7. Iniciar el frontend.
8. Iniciar sesión y ejecutar las pruebas funcionales.

## 8. Prueba funcional rápida

1. Iniciar sesión.
2. Consultar usuarios, roles, permisos y matriz de acceso.
3. Abrir el módulo de solicitudes de gasto.
4. Crear una solicitud y verificar la serie documental.
5. Enviar la solicitud a autorización.
6. Aprobar, rechazar u observar desde trazabilidad.
7. Cargar una imagen JPG/PNG en Documentos OCR.
8. Procesar el documento.
9. Revisar y corregir los campos extraídos.
10. Confirmar el documento.
11. Consultar el monitor de estados y la bitácora.

## 9. Apagar el ambiente

Detener el frontend, backend y OCR con `Ctrl+C` en sus terminales.

Detener la infraestructura:

```powershell
cd "E:\WR\Walter_Rosales\Proyectos\Sistema gastos operativos\stack"
docker compose -f ".\dockers\server dockers\docker-compose.yml" down
```

Este comando conserva PostgreSQL y los documentos de MinIO. No debe utilizarse `down -v` si se quieren conservar los volúmenes y sus datos.

## 10. Dashboard Ejecutivo

La ruta principal `/` muestra indicadores reales para Administración, Gerencia y Finanzas. Requiere iniciar sesión con un usuario cuyo rol sea `ADMIN`, `GERENTE` o `FINANZAS`.

El dashboard consulta solicitudes, presupuesto, workflow, SLA, políticas y aprobaciones mediante endpoints `GET /api/dashboard/*`. No crea ni modifica información. Los filtros disponibles son empresa, país, fechas, estado, prioridad, tipo de gasto, centro de costo y solicitante.

Cuando una dimensión no contiene registros, la interfaz muestra valores en cero o colecciones vacías; no utiliza datos demostrativos. Para observar indicadores presupuestarios primero debe existir una versión activa importada desde el archivo Excel oficial.
