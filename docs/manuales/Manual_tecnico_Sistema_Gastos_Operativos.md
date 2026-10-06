# Manual técnico del Sistema de Gastos Operativos
Revisión técnica 6 de octubre de 2026

## 01 Alcance y control de la versión

Este manual permite instalar, operar y mantener el Sistema de Gastos Operativos desde el repositorio clonado. Está dirigido a desarrolladores, administradores de infraestructura y responsables de soporte. La ruta de instalación principal es Windows con PowerShell y servicios de datos en Docker Desktop; se incluye una alternativa OCR en contenedor.

Fecha de revisión técnica: 6 de octubre de 2026. El inventario corresponde a package.json, package-lock.json, requirements.txt y al código local de la carpeta stack. La raíz Git es stack, no su carpeta superior. El remoto es https://github.com/wallas2022/sistema-gastos-operativos.git y el commit base de la revisión es 98ba25f10e97f0160535b4ca6b02337e47c08392.

Al inicio de la revisión, numerosos módulos, pruebas y 19 migraciones nuevas estaban sin publicar. Un clon del commit base no reproduce la aplicación local completa. Para instalar la versión documentada debe usarse la revisión que publique estos cambios y ambos manuales. Registrar siempre el hash instalado; no asumir que main permanece idéntica.

| Concepto | Cómo se interpreta |
| --- | --- |
| Versión declarada | Rango de package.json; por ejemplo ^19.2.0 permite versiones compatibles posteriores. |
| Versión bloqueada | Resolución exacta de package-lock.json; es la que reproduce npm ci. |
| Candidata compatible | Versión que satisface el rango declarado según consulta del registro. |
| Última publicada | Dist-tag latest de npm o versión de PyPI; no implica compatibilidad ni estabilidad. |
| Actualización recomendada | Cambio propuesto sujeto a pruebas; este manual no actualiza dependencias. |

Las verificaciones de compilación y pruebas usan ambientes existentes. No equivalen a una certificación de instalación limpia en todos los sistemas operativos. Las diferencias de documentación histórica se resuelven tomando como referencia el código actual.

## 02 Arquitectura y flujo de datos

El backend es un monolito modular NestJS. FastAPI constituye el servicio OCR separado. El navegador no debe acceder directamente a PostgreSQL, MinIO ni al procesamiento OCR: la API valida identidad, permisos, estado del expediente y empresa antes de ejecutar la operación.

~~~powershell
Navegador React
  | HTTP y JWT Bearer
  v
NestJS API /api
  |-- Prisma ---------> PostgreSQL
  |-- AWS SDK S3 -----> MinIO
  |-- multipart HTTP -> FastAPI OCR
                         |-- PaddleOCR y PaddlePaddle
                         |-- PyMuPDF para PDF
                         |-- Pillow y NumPy para imágenes
~~~

| Capa | Responsabilidad y persistencia |
| --- | --- |
| Frontend | Navegación, formularios y reportes. Axios obtiene el JWT de localStorage. |
| Backend | Reglas de gasto, aprobación, presupuesto, pagos, liquidación y seguridad. Datos persistidos mediante Prisma. |
| PostgreSQL | Identidades, catálogos, expedientes, importes, OCR, saldos y auditoría. |
| MinIO | Archivos originales y evidencias. PostgreSQL conserva la clave del objeto. |
| OCR | Extrae e interpreta texto y devuelve campos y métricas. No mantiene una base de datos propia. |
| pgAdmin | Herramienta administrativa opcional; no participa en el flujo funcional. |

Flujo documental: el backend almacena el archivo en MinIO y sus metadatos en PostgreSQL; recupera los bytes y llama POST /process; guarda el resultado OCR, las correcciones y la confirmación. El documento sólo puede integrar una liquidación cuando cumple los controles fiscales, de moneda, empresa y uso previo.

Flujo financiero: solicitud y presupuesto → aprobación asignada → registro de pago → rendición documental → devolución y validación cuando aplica → revisión → cierre y certificación. Registrar un pago conserva evidencia de un movimiento realizado; no inicia una transferencia bancaria.

## 03 Estructura del repositorio y módulos

~~~powershell
raíz del clon
  backend/
    src/                 módulos NestJS
    prisma/              schema seed y migraciones
    test/                pruebas Node
  frontend/
    src/                 aplicación React
    test/                pruebas de navegación
  Microservicio-OCR/
    app/                 FastAPI y extracción
    tests/               pruebas OCR
    Dockerfile
  dockers/server dockers/docker-compose.yml
  docs/manuales/         manuales finales
~~~

| Área | Componentes principales |
| --- | --- |
| Identidad | Auth, Users, Security, roles, permisos y cambios de contraseña. |
| Gastos | ExpenseRequests, ExpenseRequestPayments, catálogos y Banking. |
| Control | Policies, Approval y Workflow con eventos, notificaciones y SLA. |
| Presupuesto | Budget, importaciones, reservas, períodos y ExchangeRates. |
| Documentos | Documents, Storage, Ocr y validación fiscal por empresa. |
| Seguimiento | Settlements, Dashboard, Reports, Traceability y FunctionalTests. |

AppModule registra estos módulos, pero no importa HealthModule. Por esa razón /api/health no es una comprobación de disponibilidad válida en esta versión. FastAPI sí ofrece /health y /docs.

PROJECT_CONTEXT.md y partes del README contienen descripciones históricas. Por ejemplo, ahora sí existen Redux Toolkit y React Query en las dependencias, el cliente OCR utiliza OCR_SERVICE_URL y requirements.txt ya declara las librerías de extracción. La sola instalación de una biblioteca no demuestra que todas sus capacidades estén integradas.

## 04 Requisitos y herramientas del equipo

| Herramienta | Base para instalación y mantenimiento |
| --- | --- |
| Git | Cliente reciente. Acceso HTTPS al repositorio y autenticación para publicar. |
| Docker Desktop | Linux containers y backend WSL2 en Windows. Docker Compose v2: comando docker compose. |
| Node.js | Base reproducida: 22.23.2 en los contenedores actuales. Objetivo de mantenimiento: última revisión probada de Node 24 LTS. |
| npm | Usar la versión compatible con Node elegida y registrar su versión; lockfileVersion 3. |
| Python | 3.11 para reproducir el Dockerfile y los paquetes OCR actuales. Elegirlo explícitamente mediante py -3.11. |
| Recursos | Recomendación inicial: 4 CPU, 8 GB RAM y 15 GB libres; 16 GB RAM mejora pruebas OCR. Ajustar con mediciones, no es un mínimo certificado. |
| Red | Acceso a GitHub, npm, PyPI, imágenes Docker y repositorios de modelos Paddle durante instalación. |

~~~powershell
git --version
docker version
docker compose version
node --version
npm --version
py -0p
py -3.11 --version
~~~

Vite 8 requiere Node 20.19 o 22.12 como pisos técnicos, pero una versión mínima puede haber llegado a fin de soporte. Node 25.6.0 detectado en el equipo no pertenece a una línea LTS y la línea 25 figura fuera de soporte. Sustituirlo por una línea LTS soportada después de verificar el build [1, 2].

Python 3.11 recibe mantenimiento de seguridad hasta octubre de 2027 según el calendario oficial. Mantenerlo para reproducibilidad mientras se prueba una migración independiente del OCR a Python 3.12 o superior con ruedas compatibles de Paddle [3].

No usar una instalación global de Nest CLI como requisito. npm run usa el ejecutable local instalado en backend/node_modules. En Windows, no reutilizar node_modules copiados desde Linux o desde otra versión de Node.

## 05 Puertos redes y variantes de despliegue

| Servicio | Puerto o dirección | Alcance actual |
| --- | --- | --- |
| Frontend Vite | http://localhost:5173 | Proceso local; no existe servicio Compose de frontend. |
| API NestJS | http://localhost:3000/api | Proceso local; no existe Dockerfile de backend. |
| FastAPI OCR | http://127.0.0.1:8000 | Local o servicio Compose ocr; elegir sólo uno. |
| PostgreSQL | localhost:5432 / ocr_db | Compose postgres. |
| MinIO API | http://localhost:9000 | Compose minio; endpoint S3 para backend. |
| MinIO Console | http://localhost:9001 | Consola para crear bucket. |
| pgAdmin | http://localhost:5050 | Administración opcional. |

La opción A usa PostgreSQL, MinIO y pgAdmin en Docker; frontend, backend y OCR como procesos locales. La opción B reemplaza sólo el proceso OCR por el servicio Docker ocr. Ejecutar docker compose up sin lista de servicios también intenta construir OCR.

El cliente Axios tiene baseURL fija http://localhost:3000/api. VITE_API_URL existe como ejemplo, pero no se utiliza en ese archivo. Por ello, abrir el frontend desde otro equipo dirige las llamadas hacia el localhost de ese equipo. Para despliegue remoto primero debe hacerse configurable la URL o usar una ruta relativa detrás de un proxy.

Si posteriormente se incorpora backend a Compose, dentro del contenedor localhost identifica al propio contenedor. Usar postgres:5432, minio:9000 y ocr:8000 en la red de Compose. host.docker.internal se reserva para acceder al host desde Docker Desktop; no sustituye los nombres de servicio.

El Compose publica PostgreSQL, MinIO y pgAdmin en todas las interfaces del host; OCR se liga a 127.0.0.1. Para pruebas locales conviene restringir también los demás puertos. No exponer los accesos de demostración en un servidor público.

## 06 Clonar y fijar la revisión de instalación

Abra PowerShell en la carpeta donde almacenará el proyecto. En el equipo actual stack es la raíz del repositorio. En un clon nuevo se puede elegir otro nombre: no debe introducirse un segundo stack dentro del clon.

~~~powershell
git clone https://github.com/wallas2022/sistema-gastos-operativos.git stack
Set-Location .\stack
$RepoRoot = (Get-Location).Path
git remote -v
git branch --show-current
git rev-parse HEAD
git status --short
~~~

Resultado esperado: existen backend/package-lock.json, frontend/package-lock.json, Microservicio-OCR/requirements.txt, el Compose, 27 carpetas de migración y los módulos descritos. Compruebe que el commit clonado incluya la actualización local publicada junto con este manual.

~~~powershell
Test-Path .\backend\package-lock.json
Test-Path .\frontend\package-lock.json
Test-Path .\backend\src\modules\settlements
(Get-ChildItem .\backend\prisma\migrations -Directory).Count
~~~

Para una instalación aprobada utilice un hash o tag de release, no una rama cambiante. Ejemplo: git checkout --detach <HASH_APROBADO>. El marcador debe sustituirse por una revisión existente. Antes de actualizar un clon de trabajo revise git status; conserve sus cambios y no use reset --hard para resolver divergencias.

La actualización de un clon limpio de main se realiza mediante git pull --ff-only. Si falla por divergencia, examine el historial y prepare una integración revisada. No forzar el push. Registre commit, fecha, Node, npm, Python y digests de imágenes en el acta de instalación.

## 07 Preparar archivos de entorno y secretos

Ejecute estos pasos sólo en un clon nuevo sin configuración propia. Los archivos .env reales están excluidos de Git. backend/.env.example contiene únicamente parte de las variables necesarias; hay que completarlo con conexión, JWT y S3.

~~~powershell
Copy-Item .\.env.example .\.env
Copy-Item .\backend\.env.example .\backend\.env
Copy-Item .\frontend\.env.example .\frontend\.env
Copy-Item .\Microservicio-OCR\.env.example `
  .\Microservicio-OCR\.env
~~~

Genere dos secretos distintos. El JWT pertenece a backend y la clave OCR debe coincidir en backend, el archivo raíz utilizado por Compose y el ambiente del OCR. No mostrar estos valores en capturas ni adjuntarlos a tickets.

~~~powershell
function New-LocalSecret {
  $bytes = New-Object byte[] 32
  $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
  $rng.GetBytes($bytes)
  $rng.Dispose()
  [Convert]::ToBase64String($bytes)
}
$jwtSecret = New-LocalSecret
$ocrSecret = New-LocalSecret
~~~

Edite los archivos de configuración utilizando los valores generados. No copiar literalmente <JWT_GENERADO> ni <OCR_GENERADO>: son marcadores. Los ejemplos del siguiente apartado son para desarrollo local. Compose usa --env-file .env de forma explícita; las variables exportadas en la terminal tienen precedencia [4].

El servicio OCR lee os.getenv, no carga automáticamente su archivo .env. En ejecución local use uvicorn --env-file .env o exporte las variables en la terminal. Colocar el archivo en la carpeta por sí solo no habilita la clave.

## 08 Configuración completa del backend

Contenido de referencia para backend/.env. Sustituya los marcadores por los secretos generados. Las credenciales de infraestructura sólo corresponden al Compose local existente.

~~~powershell
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ocr_db
JWT_SECRET=<JWT_GENERADO>
JWT_EXPIRES_IN=8h
OCR_SERVICE_URL=http://127.0.0.1:8000
OCR_INTERNAL_API_KEY=<OCR_GENERADO>
OCR_TIMEOUT_MS=120000
OCR_FISCAL_NIT_MIN_CONFIDENCE=80
OCR_MAX_FILE_SIZE_MB=20
OCR_ALLOWED_MIME_TYPES=application/pdf,image/jpeg,image/png,image/webp,image/tiff,text/plain
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_BUCKET=documents
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
PASSWORD_MIN_LENGTH=10
PASSWORD_REQUIRE_COMPLEXITY=true
PASSWORD_RESET_TOKEN_MINUTES=60
FRONTEND_URL=http://localhost:5173
~~~

| Grupo | Uso y verificación |
| --- | --- |
| DATABASE_URL | Prisma carga el datasource PostgreSQL. Caracteres especiales de contraseñas necesitan codificación URL. |
| JWT | La estrategia verifica firma y caducidad. Cambiar JWT_SECRET invalida tokens anteriores. |
| S3 | StorageService usa estas claves directamente y forcePathStyle para MinIO. |
| OCR | Configura URL, timeout, tipos, tamaño y confianza fiscal. La clave se envía en x-ocr-api-key. |
| Contraseña | Política y enlace de recuperación; EmailService actual sólo registra el mensaje, no envía correo real. |

Existe validateEnv en src/config/env.validation.ts, pero AppModule no lo conecta mediante validate. Debe revisarse la configuración completa antes de iniciar; la existencia del validador no asegura validación temprana.

## 09 Configuración OCR y frontend

En el archivo raíz .env utilice OCR_INTERNAL_API_KEY=<OCR_GENERADO>. Compose exige un valor no vacío incluso si únicamente se inicia la infraestructura, porque valida el modelo completo antes de seleccionar servicios.

Microservicio-OCR/.env contiene la misma clave y los límites siguientes. Mantenga los límites de backend y OCR coherentes para no aceptar cargas que después serán rechazadas.

~~~powershell
OCR_INTERNAL_API_KEY=<OCR_GENERADO>
OCR_MAX_FILE_SIZE_MB=20
OCR_MAX_IMAGE_PIXELS=40000000
OCR_MAX_IMAGE_SIDE=3000
OCR_RETRY_IMAGE_SIDE=2200
OCR_MAX_PDF_PAGES=25
OCR_PDF_RENDER_DPI=200
OCR_ALLOWED_MIME_TYPES=application/pdf,image/jpeg,image/png,image/webp,image/tiff,text/plain
FLAGS_use_mkldnn=0
PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK=True
~~~

| Control | Efecto |
| --- | --- |
| Tamaño | Límite de archivo 20 MB en ambas capas. |
| Imagen | Máximo 40 millones de píxeles; reescala el lado mayor para controlar recursos. |
| Reintento | Utiliza un tamaño menor de imagen ante fallos previstos. |
| PDF | Hasta 25 páginas y rasterización a 200 DPI cuando necesita OCR. |
| Clave ausente | POST /process devuelve 503; clave incorrecta o faltante devuelve 401. |
| Salud | GET /health no exige clave y responde ok true; no demuestra que el modelo ya esté cargado. |

frontend/.env puede conservar VITE_API_URL=http://localhost:3000/api, pero actualmente el código ignora esa variable. Las variables VITE se incorporan al bundle y son públicas: nunca almacenar JWT_SECRET, claves S3 ni OCR_INTERNAL_API_KEY allí.

## 10 Iniciar PostgreSQL MinIO y pgAdmin

Compruebe que Docker Desktop está iniciado y que los puertos 5432, 9000, 9001 y 5050 están disponibles. El Compose contiene nombres fijos ocr_postgres, ocr_minio y ocr_pgadmin: otro proyecto que use los mismos nombres puede provocar conflicto.

~~~powershell
Set-Location $RepoRoot
$Compose = ".\dockers\server dockers\docker-compose.yml"
docker compose --env-file .env -f $Compose config --quiet
docker compose --env-file .env -f $Compose `
  up -d postgres minio pgadmin
docker compose --env-file .env -f $Compose ps
docker exec ocr_postgres pg_isready -U postgres -d ocr_db
Invoke-RestMethod http://localhost:9000/minio/health/live
~~~

Resultado esperado: PostgreSQL acepta conexiones y los contenedores están en ejecución. restart no sustituye un healthcheck. El Compose no declara comprobaciones de salud para PostgreSQL, MinIO ni pgAdmin, por lo que el estado Up no certifica disponibilidad.

| Servicio | Credenciales de desarrollo existentes |
| --- | --- |
| PostgreSQL | Base ocr_db, usuario postgres, contraseña postgres. |
| MinIO | Usuario minioadmin, contraseña minioadmin. |
| pgAdmin | Correo admin@local.com, contraseña admin123. |

Abra http://localhost:9001, inicie sesión y cree el bucket documents con acceso privado. Si S3_BUCKET tiene otro nombre, use exactamente ese nombre. La aplicación no crea el bucket automáticamente. Una carga exitosa debe producir un objeto y metadatos en PostgreSQL.

MinIO Community aparece archivado en su repositorio oficial. El tag latest no garantiza distribución mantenida ni que un pull nuevo sea posible. Para una instalación repetible se necesita una imagen aprobada y disponible por digest o un proveedor S3 mantenido; probar carga y lectura antes de aceptar la instalación [5].

## 11 Instalar backend y aplicar migraciones

Abra una terminal en backend y use npm ci. Este comando reproduce el lock, reemplaza node_modules y falla si el manifiesto no concuerda con el lock. No ejecutar npm install como sustitución silenciosa de un error de sincronización [6].

~~~powershell
Set-Location "$RepoRoot\backend"
npm ci
npx prisma generate
npx prisma validate
npx prisma migrate status
npx prisma migrate deploy
npx prisma migrate status
~~~

generate crea el cliente según schema.prisma; validate revisa el esquema; migrate deploy aplica las migraciones pendientes existentes. El estado final debe mostrar la base actualizada. La revisión local tiene 27 carpetas de migración, incluidas las incorporaciones de presupuesto, pagos, liquidaciones, seguridad OCR y pruebas funcionales.

No usar prisma migrate dev para instalar una versión publicada: ese comando pertenece al desarrollo de nuevas migraciones. Tampoco usar db push como reemplazo del historial ni aceptar un reset sobre una base con datos.

### Semilla de desarrollo

~~~powershell
npx prisma db seed
~~~

Ejecute el seed sólo en una base nueva destinada a demostración o pruebas. Crea catálogos, roles y cuentas de ejemplo mediante upserts; puede actualizar registros existentes y restablecer datos de acceso. No es un procedimiento de alta de usuarios productivos.

El esquema utiliza prisma-client-js y Prisma 6.7.0. prisma y @prisma/client deben mantener la misma versión al actualizarse. Antes de cualquier despliegue con migraciones, obtenga y pruebe un respaldo de PostgreSQL y conserve los archivos del release anterior.

## 12 Instalar y arrancar OCR local

Esta variante reproduce Python 3.11 sin activar el entorno virtual de PowerShell. Todos los comandos utilizan el ejecutable de .venv, evitando instalar paquetes en el Python global del equipo.

~~~powershell
Set-Location "$RepoRoot\Microservicio-OCR"
py -3.11 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m pip check
.\.venv\Scripts\python.exe -m uvicorn app.main:app `
  --host 127.0.0.1 --port 8000 --reload --env-file .env
~~~

requirements.txt ahora declara FastAPI, Uvicorn, python-multipart, Pydantic, PaddleOCR, PaddlePaddle, NumPy, Pillow y PyMuPDF con versiones exactas. No instalar adicionalmente paddleocr o numpy sin versión: cambiaría el ambiente que se intenta reproducir.

El primer procesamiento de imágenes puede descargar modelos y consumir varios minutos. Una respuesta de salud positiva sólo demuestra que FastAPI responde. Para aceptar OCR debe procesarse un documento de prueba y revisarse processStatus, texto, total, moneda, campos fiscales y logs.

Algunas versiones de Paddle requieren ruedas específicas según sistema operativo, arquitectura y Python. Si pip no encuentra una distribución compatible, comprobar esos tres factores y la guía oficial de Paddle; no instalar un archivo wheel de otra versión Python.

El código desactiva MKLDNN y los clasificadores de orientación en la inicialización del OCR. No aumentar workers sin medir memoria, tiempos y concurrencia: cada proceso puede cargar su propia instancia del modelo. --reload es una opción de desarrollo.

## 13 Construir y arrancar OCR en Docker

Use esta alternativa cuando el equipo no tiene Python compatible o necesita reproducir el ambiente Linux del Dockerfile. Antes de iniciar detenga el proceso OCR local con Ctrl+C: no pueden compartir el puerto 8000.

~~~powershell
Set-Location $RepoRoot
$Compose = ".\dockers\server dockers\docker-compose.yml"
docker compose --env-file .env -f $Compose build ocr
docker compose --env-file .env -f $Compose up -d ocr
docker compose --env-file .env -f $Compose ps ocr
docker compose --env-file .env -f $Compose `
  logs --tail 100 ocr
Invoke-RestMethod http://127.0.0.1:8000/health
~~~

El Dockerfile utiliza python:3.11-slim, instala libgomp1, libgl1, libglib2.0-0 y curl, instala requirements.txt, crea el usuario ocr UID 10001 y descarga los modelos en build. El proceso final ejecuta Uvicorn con un worker. El contenedor recibe la clave desde Compose, no necesita su archivo .env interno.

La construcción necesita acceso a PyPI, repositorios Debian y modelos Paddle. Si la descarga de modelos falla, el build falla antes del arranque. El healthcheck dispone de un start-period de 120 segundos, pero sólo consulta /health.

El Dockerfile actualizado ya incluye las dependencias OCR antes ausentes; las advertencias antiguas del README sobre requirements incompleto no representan estos archivos actuales. No obstante, no se debe llamar reproducible a una imagen sin fijar su base por digest y conservar un bloqueo de dependencias transitivas.

Para producción, construir una vez, registrar el digest y promover la misma imagen de pruebas a producción. Evitar reconstruir el release contra tags latest o dependencias transitivas cambiantes.

## 14 Arrancar backend y frontend

Terminal de backend. Mantenga el proceso abierto; la API escucha en 3000 y el prefijo global es /api.

~~~powershell
Set-Location "$RepoRoot\backend"
npm run typecheck
npm run build
npm run start:dev
~~~

Terminal de frontend. --strictPort evita que Vite elija automáticamente 5174 si 5173 está ocupado; --host restringe el servicio al equipo local.

~~~powershell
Set-Location "$RepoRoot\frontend"
npm ci
npm run build
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
~~~

Abra http://127.0.0.1:5173 o http://localhost:5173 en el mismo equipo que ejecuta el backend. La sesión llama a localhost:3000, por lo que el nombre debe resolver correctamente en el navegador.

| Proceso | Modo de ejecución |
| --- | --- |
| Backend desarrollo | npm run start:dev con vigilancia de archivos. |
| Backend compilado | npm run build y npm run start:prod; entrypoint dist/src/main. |
| Frontend desarrollo | Vite con recarga de módulos. |
| Frontend compilado | npm run build produce dist; npm run preview sólo sirve para revisión local. |
| Producción web | Servidor estático y proxy HTTPS con fallback de SPA; no usar Vite dev ni preview como servicio productivo. |

En la sesión de revisión se usaron contenedores auxiliares gastos-backend-local y gastos-frontend-local con Node 22 para evitar dependencias locales dañadas. Esos contenedores no forman parte del Compose del repositorio y no deben convertirse en prerrequisito de un clon nuevo.

## 15 Cuentas iniciales y pruebas de disponibilidad

El seed crea cuentas de demostración con contraseña Demo12345*. Son exclusivamente para una base local nueva. No llevar el seed ni sus cuentas al ambiente productivo.

| Cuenta | Rol de demostración |
| --- | --- |
| admin@demo.com | Administrador |
| finanzas@demo.com | Finanzas |
| tesoreria@demo.com | Tesorería |
| revisor.ocr@demo.com | Revisor OCR |
| gerente@demo.com | Gerente |
| solicitante@demo.com | Solicitante |
| solicitante2@demo.com | Segundo solicitante |

Esta prueba verifica login y una consulta autenticada sin imprimir el token. Ejecútela contra la base de demostración, no desde logs compartidos.

~~~powershell
$body = @{email="admin@demo.com"; password="Demo12345*"} |
  ConvertTo-Json
$login = Invoke-RestMethod -Method Post `
  -Uri "http://localhost:3000/api/auth/login" `
  -ContentType "application/json" -Body $body
$headers = @{Authorization="Bearer $($login.access_token)"}
Invoke-RestMethod "http://localhost:3000/api/documents" `
  -Headers $headers
Invoke-RestMethod "http://127.0.0.1:8000/health"
~~~

El formato del token debe corresponder al contrato de AuthService; en esta versión login devuelve access_token. Un 401 en documentos exige revisar autenticación; un 403 exige permisos. No tratar un 403 como indisponibilidad de servidor.

Prueba mínima adicional: cargar un archivo de prueba, abrir su original, procesar OCR con la clave compartida y confirmar que exista resultado legible. Conservar nombre del archivo, estado y request-id; no registrar JWT ni secretos.

## 16 Pruebas automatizadas y criterios de aceptación

Las pruebas de integración financiera escriben en PostgreSQL y MinIO. npm test ejecuta build y todos los archivos test/*.test.js, incluyendo escenarios E2E con datos reales de prueba. No utilizarlo sobre una base que contiene expedientes de usuarios.

~~~powershell
Set-Location "$RepoRoot\backend"
npm run typecheck
npm run build
# Suite sin escenarios PostgreSQL E2E
$tests = Get-ChildItem .\test\*.test.js |
  Where-Object Name -ne "settlements-e2e-postgres.test.js" |
  ForEach-Object FullName
node --test $tests
Set-Location "$RepoRoot\frontend"
npm run build
node --test .\test\navigation-rbac.test.cjs
~~~

Para OCR, desde Microservicio-OCR: .venv\Scripts\python.exe -m unittest discover -s tests -p 'test*.py'. Los casos de document_intelligence incluyen funciones con formato pytest que unittest no recoge. Para ejecutar todo, instalar una versión aprobada de pytest como herramienta de desarrollo y usar python -m pytest tests.

| Verificación del 6 de octubre | Resultado y límite |
| --- | --- |
| Backend typecheck y build | Pasaron en el contenedor aislado con dependencias limpias. |
| Backend sin E2E PostgreSQL | 140 pruebas pasaron. No certifica todas las operaciones reales. |
| Frontend build | Pasó. Bundle principal 1172.73 kB; se emitió advertencia de tamaño. |
| Navegación frontend | 10 pruebas pasaron. |
| OCR unittest | 9 pruebas pasaron; no incluye todas las funciones pytest ni exactitud de modelos reales. |
| Instalación limpia completa | Procedimiento derivado del código; requiere aceptación en clon y servicios nuevos. |

Para E2E cree una base y bucket separados, aplique migraciones, configure sus URLs y credenciales en una terminal exclusiva y ejecute npm test. Algunos escenarios no comprueban si hay DATABASE_URL antes de escribir. Nunca depender sólo de que una variable de entorno esté ausente para proteger una base.

## 17 Contrato de API y controles de seguridad

| Prefijo de API | Función técnica |
| --- | --- |
| /api/auth | Login, cambio y recuperación de contraseña. |
| /api/security | Usuarios, roles, permisos y matriz. |
| /api/catalog | Catálogos organizacionales y monedas. |
| /api/expense-requests | Solicitudes, ítems, edición, envío y decisiones según endpoint. |
| /api/expense-request-payments | Registro y consulta de ejecución financiera. |
| /api/documents y /api/ocr | Originales, extracción, corrección, confirmación y métricas. |
| /api/budget y /api/budget-imports | Partidas, períodos e importación presupuestaria. |
| /api/exchange-rates | Conversión y tasas vigentes. |
| /api/settlements y /api/banking | Liquidación, documentos, devoluciones y cuentas. |
| /api/dashboard y /api/reports | Indicadores y exportaciones. |
| /api/approval-flows y /api/traceability | Flujos y trazabilidad. |
| /api/test-records y /api/test-cases | Registro de pruebas funcionales. |

La lista identifica controllers registrados, no un catálogo de rutas y permisos exhaustivo. Mantener SECURITY_01_1_ENDPOINT_INVENTORY.json junto con controllers y DTO. No hay Swagger de backend registrado en main.ts; el Swagger disponible pertenece al OCR.

Nest aplica ValidationPipe con whitelist, transform y forbidNonWhitelisted. JWT identifica al usuario y los servicios verifican permisos, empresa y estado de expediente. La navegación frontend reconoce seis roles principales y tiene controles adicionales; crear un rol personalizado no garantiza acceso a rutas.

Antes de producción: restringir CORS a orígenes autorizados, mantener HTTPS, revisar protección XSS porque JWT está en localStorage, aplicar control de intentos de login y no exponer logs con datos de documentos. ConfigModule debe conectarse a validateEnv y ampliarlo para exigir clave OCR.

## 18 Persistencia y migraciones de base de datos

schema.prisma es la fuente del modelo y migrations es el historial de evolución. PostgreSQL y MinIO deben respaldarse como un conjunto: restaurar sólo metadatos puede dejar documentos sin original; restaurar sólo objetos puede dejar archivos sin expediente.

| Grupo | Información que conserva |
| --- | --- |
| Seguridad | Usuarios, roles, permisos, estado de cuenta y tokens de recuperación. |
| Solicitud | Cabecera, ítems, moneda, tasa histórica, validaciones y trazabilidad. |
| Presupuesto | Versiones, líneas, distribución por período, compromisos y reservas. |
| Ejecución | Pagos, cuentas, beneficiarios y evidencia bancaria. |
| Documental | Metadatos, storagePath, resultados OCR, correcciones y decisión fiscal. |
| Liquidación | Pago origen, comprobantes, devoluciones, balance, revisión y certificación. |

Las reglas financieras requieren precisión decimal y transacciones para evitar duplicados, reservas dobles y cierres concurrentes. No convertir importes a float para cálculos de negocio ni modificar montos por SQL directo sin un procedimiento aprobado.

### Proceso de cambio de esquema

1. Crear la migración en una rama de desarrollo sobre una base descartable. 2. Revisar el SQL y su impacto de bloqueo. 3. Probar datos existentes y versión anterior de API. 4. Respaldar. 5. Aplicar migrate deploy. 6. Verificar status y aceptación. No editar migraciones aplicadas.

Una reversión de código no revierte automáticamente la base de datos. Diseñar cambios compatibles por expansión y contracción, o una migración compensatoria probada. Para PostgreSQL, actualizar revisiones menores dentro de 16 requiere una operación distinta de pasar a otra versión mayor; una migración mayor necesita pg_upgrade o exportación y restauración [7].

## 19 Respaldar y restaurar PostgreSQL

Ejemplo PowerShell para entorno local. El archivo dump se crea dentro del contenedor y se copia como binario; no canalizar pg_dump mediante redirección de texto de Windows PowerShell 5.1, que puede alterar el archivo.

~~~powershell
Set-Location $RepoRoot
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
New-Item -ItemType Directory .\backups -Force | Out-Null
docker exec ocr_postgres pg_dump -U postgres `
  -d ocr_db -Fc -f /tmp/ocr_db.dump
docker cp ocr_postgres:/tmp/ocr_db.dump `
  ".\backups\ocr_db-$stamp.dump"
Get-FileHash ".\backups\ocr_db-$stamp.dump" -Algorithm SHA256
~~~

Las copias contienen información del sistema y se conservan fuera de Git con acceso restringido. Antes de un release, pausar escrituras si se requiere consistencia exacta con el respaldo documental. Registrar hash del commit y digest de las imágenes junto con el respaldo.

### Ensayo de restauración

~~~powershell
docker exec ocr_postgres createdb -U postgres ocr_restore_test
docker cp ".\backups\<ARCHIVO>.dump" `
  ocr_postgres:/tmp/restore.dump
docker exec ocr_postgres pg_restore -U postgres `
  -d ocr_restore_test --no-owner --exit-on-error `
  /tmp/restore.dump
~~~

Sustituir <ARCHIVO> por el dump elegido. La base de ensayo debe ser nueva. Verifique tablas, historial _prisma_migrations, usuarios, saldos y referencias documentales; configure una API de prueba contra esa base para aceptación. Estos comandos no sustituyen la base activa.

Política recomendada: respaldo diario, previo a migraciones y previo a cambios de versión; al menos un ensayo mensual. Definir RPO y RTO según la operación. Conservar una copia fuera del equipo anfitrión y probar recuperación después de cada cambio de infraestructura.

## 20 Respaldar documentos y operar los servicios

Para MinIO, use un cliente S3 compatible aprobado o mc de una distribución mantenida y verificada. Defina un alias con endpoint y credenciales, y haga una copia del bucket a almacenamiento de respaldo. Las siguientes órdenes suponen mc disponible; no es una herramienta incluida en el repositorio.

~~~powershell
mc alias set local http://localhost:9000 <USUARIO> <SECRETO>
mc mirror local/documents .\backups\documents
# Restaurar sólo hacia un bucket de ensayo
mc mirror .\backups\documents local/documents-restore-test
~~~

No guardar claves en scripts versionados ni historial compartido. mc mirror no es por sí solo una política de versiones o un respaldo inmutable. Para consistencia, registrar una ventana de respaldo de objetos y PostgreSQL y verificar objetos referenciados después de restaurar.

~~~powershell
Set-Location $RepoRoot
$Compose = ".\dockers\server dockers\docker-compose.yml"
docker compose --env-file .env -f $Compose ps
docker compose --env-file .env -f $Compose logs --tail 100
docker compose --env-file .env -f $Compose stop
# Sólo cuando se requiere retirar contenedores
docker compose --env-file .env -f $Compose down
~~~

Ctrl+C detiene los procesos locales de Vite, Nest y Uvicorn. stop conserva contenedores y volúmenes; down retira contenedores y red, pero conserva los volúmenes nombrados. No agregar -v si debe conservarse la base y los archivos.

Compose usa postgres_data y minio_data, cuyos nombres efectivos dependen del proyecto Compose. Cambiar nombre del proyecto o directorio puede crear volúmenes nuevos y dar la impresión de pérdida de datos. Revisar docker volume ls e inspect antes de conectar otro ambiente.

## 21 Auditoría de dependencias y prioridad de actualización

Consulta realizada el 6 de octubre de 2026 a npm sobre copias de los locks, sin instalar ni modificar dependencias. El resultado representa paquetes afectados del árbol de dependencias, no vulnerabilidades distintas ni una demostración de explotación en la aplicación.

| Componente | Críticas | Altas | Moderadas | Total |
| --- | --- | --- | --- | --- |
| Backend | 1 | 7 | 4 | 12 |
| Frontend | 0 | 3 | 0 | 3 |

| Prioridad | Acción recomendada |
| --- | --- |
| P0 | Revisar proxy-addr transitorio crítico en backend y su cadena Express. Actualizar la cadena compatible y confirmar nueva auditoría. |
| P1 | Actualizar Axios a 1.20.0 en ambos paquetes y Multer a 2.4.0; alinear los paquetes principales Nest 11 a 11.2.7. |
| P1 | Actualizar transitivas afectadas de frontend nanoid y source-map-js y las transitivas backend. Verificar npm explain antes de overrides. |
| P1 | Planificar reemplazo o soporte mantenido de MinIO; no confiar en latest de una distribución archivada. |
| P2 | Prisma 6.7.0 a 6.19.3 como transición compatible, siempre CLI y cliente juntos. |
| P2 | Mantener PostgreSQL 16 en revisión menor actual; pasar de 16.11 a 16.15 después de respaldo y pruebas. |
| P3 | Migraciones mayores Nest 12, Prisma 7 y TypeScript 7 mediante proyectos separados. |

ExcelJS 4.4.0 aparece afectado por su uuid anidado. Actualizar el uuid directo 14 no sustituye el anidado. npm audit propone ExcelJS 3.4.0 como arreglo mayor: no aplicar ese downgrade sin revisar exportación/importación y compatibilidad.

npm audit no cubre todo el entorno Python, modelos, contenedores ni el código propio. Completar con pip-audit, escaneo de imágenes y pruebas. Una versión antigua sin aviso no demuestra abandono; una versión latest no demuestra compatibilidad [8].

## 22 Estrategia de versiones de backend

Fase inicial: corregir avisos de seguridad dentro de versiones compatibles. Mantener Nest common, core y platform-express alineados para evitar diferencias de comportamiento; CLI puede usar otra revisión dentro de la misma línea.

~~~powershell
# Ejecutar en rama de mantenimiento, desde backend
npm install @nestjs/common@11.2.7 @nestjs/core@11.2.7 `
  @nestjs/platform-express@11.2.7 axios@1.20.0 multer@2.4.0
npm install prisma@6.19.3 @prisma/client@6.19.3
npx prisma generate
npm run typecheck
npm run build
npm audit
~~~

Las versiones del ejemplo son candidatas consultadas en la fecha del manual; confirmar sus avisos y existencia al ejecutar. La orden modifica manifiesto y lock; no corresponde al procedimiento de instalación inicial. Después, instalar con npm ci en un ambiente nuevo y repetir las pruebas.

El backend no declara TypeScript directamente, aunque el lock lo resuelve a 6.0.3 mediante dependencias de herramientas. Declarar una versión exacta probada como devDependency y fijar engines de Node y la herramienta npm. @types/node 25 no coincide con el runtime Node 22 utilizado; alinear los tipos con el runtime aprobado.

Nest 12 ya aparece publicado en el registro. Su guía oficial describe nuevos paquetes ESM y cambios de CLI. Planificar la actualización coordinada de paquetes Nest y requisitos Node; el backend actual CommonJS exige una revisión de herramientas y resolución de módulos [9].

Prisma 7 modifica ESM, generación del cliente, configuración de CLI y requiere adaptador de base de datos. No instalar @prisma/client@latest de forma aislada. Conservar una rama independiente, validar PostgreSQL, transacciones, decimales, seed y migraciones [10].

En el registro prisma tiene dist-tag latest 8.0.0-rc.20 mientras @prisma/client publica 7.10.0. Ese tag es prerelease y no es una pareja compatible. La recomendación estable requiere elegir ambos paquetes con la misma versión.

## 23 Estrategia de versiones frontend y OCR

| Área | Actualización candidata y verificación |
| --- | --- |
| Frontend base | Axios 1.20.0; Vite 8.3.3 y plugin-react 6.1.2; Router 7.18.4. Verificar build, login, navegación y archivos. |
| React y estilos | React y React DOM 19.3.0 juntos; tipos compatibles. Chakra 3.37.0 requiere revisar formularios, diálogos y componentes. |
| Estado | Redux Toolkit 2.13.0 y React Query 5.104.1; confirmar qué partes realmente las usan antes de introducir refactor. |
| TypeScript | Frontend bloqueado en 5.9.3; latest 7.0.2 es salto mayor. Migración separada con tsconfig y todos los builds. |
| OCR web | Evaluar FastAPI 0.142.2, Uvicorn 0.54.0, python-multipart 0.0.32 y Pydantic 2.13.5 en venv nuevo. |
| OCR extracción | PaddleOCR 3.7.0 y PaddlePaddle 3.3.1 ya coinciden con últimas versiones consultadas. Mantenerlas y comparar documentos patrón. |
| PDF | PyMuPDF 1.28.2 como candidata; probar PDF con texto, escaneado, varias páginas y límites. |
| NumPy | Latest 2.5.3 exige Python >=3.12. Mantener 2.3.5 para la base Python 3.11 hasta resolver compatibilidad de un cambio conjunto. |

Para OCR crear un venv nuevo en una carpeta de ensayo, instalar las versiones candidatas, ejecutar pip check, pruebas y un conjunto de facturas patrón. Comparar texto, confianza, NIT, empresa, total, moneda, tiempo y consumo; no decidir sólo por el porcentaje promedio de confianza.

requirements fija dependencias directas pero no todas las transitivas. Añadir un lock con hashes y una herramienta aprobada como pip-tools o uv; mantenerlo por plataforma si las ruedas difieren. Conservar versión de modelos y CPU/GPU junto con el lock.

Usar python -m pip list --outdated para detectar candidatos y pip-audit para avisos. No ejecutar pip install --upgrade -r requirements.txt esperando actualizar paquetes fijados con ==: para cambiar la versión hay que editar y validar el archivo.

## 24 Procedimiento mensual de mantenimiento

Responsable sugerido: un desarrollador mantiene dependencias; soporte valida instalación y respaldo; el responsable funcional acepta los escenarios financieros. Las ventanas y responsables concretos deben acordarse en la operación del sistema.

| Frecuencia | Actividad y evidencia |
| --- | --- |
| Cada semana | Revisar avisos críticos/altos, fin de soporte y alertas de dependencias. Registrar decisión y fecha. |
| Cada mes | Consultar outdated, npm audit y pip-audit; actualizar parches en rama; recompilar y validar escenarios. |
| Cada trimestre | Revisar Node/Python/PostgreSQL, imágenes base, modelos, licencias, MinIO y tamaño de bundle. |
| Antes de release | Respaldar, fijar commit e imágenes, instalar limpio, aplicar migraciones en ensayo, revisar acceso por rol y empresa. |
| Después de release | Comprobar login, originales, OCR, saldos y logs; registrar incidencias y criterio de reversión. |

~~~powershell
# Desde backend y frontend por separado
npm outdated
npm audit --json
npm audit --omit=dev
npm explain proxy-addr
npm explain uuid
npm audit fix --dry-run
# Desde el entorno Python aprobado
python -m pip list --outdated
python -m pip check
python -m pip_audit
~~~

Instalar pip-audit como herramienta de mantenimiento aprobada, no como dependencia de ejecución por defecto. npm outdated puede salir con código distinto de cero cuando hay actualizaciones; distinguirlo de un error de conexión.

No usar npm audit fix --force ni actualizar todo a latest sin revisión. Para un override transitorio comprobar que el padre acepta la nueva API, agregar una prueba pertinente, documentar fecha y retirar el override cuando el padre se actualice.

Configurar Dependabot o Renovate como mejora futura: no existe un flujo CI observado que garantice builds y aceptación del stack. Agrupar React/React DOM, paquetes Nest y Prisma/cliente para mantener coherencia.

## 25 Preparación de producción y automatización pendiente

La configuración actual está orientada a desarrollo. Un despliegue productivo requiere resolver URL fija de API, CORS, secretos, credenciales demo, exposición de puertos y servicios sin definición Docker. Los cambios siguientes son recomendaciones y no archivos ya presentes.

| Mejora | Implementación y condición de aceptación |
| --- | --- |
| Docker de backend | Build multietapa con npm ci, Prisma generate, Nest build y usuario sin privilegios; instalar OpenSSL compatible y comprobar entrypoint. |
| Docker de frontend | Build Vite y servidor estático con fallback a index.html; API mediante URL configurable o proxy /api. |
| Compose completo | Agregar backend/frontend, redes internas, healthchecks y migración como trabajo controlado. No ejecutar seed demo en cada arranque. |
| Configuración | Conectar validateEnv, exigir secretos, NODE_ENV=production y CORS por lista autorizada. |
| Almacenamiento | Proveedor S3 mantenido, credenciales de mínimo privilegio, bucket privado, respaldo y prueba de lectura. |
| Observabilidad | Salud y readiness backend registrados, métricas de OCR, logs con request-id y alertas de fallos. |
| CI | Instalación npm ci, build/typecheck, pruebas unitarias, OCR completo, auditoría y E2E con base/bucket efímeros. |
| Release | Artefactos inmutables, SBOM, hashes, promoción a pruebas y producción, aceptación y reversión. |

No usar npm ci --omit=dev para construir el backend antes de tener TypeScript/CLI disponibles. El proceso de build necesita herramientas de desarrollo. La imagen de ejecución conserva sólo las dependencias realmente necesarias y el cliente Prisma generado.

El bundle frontend observado supera 1 MB sin compresión. Revisar imports, rutas con carga diferida y chunking de Vite; medir el efecto en navegación y redes lentas antes de aceptar el cambio. Aumentar el límite de aviso no reduce el tamaño.

## 26 Diagnóstico de instalación y operación

| Síntoma | Diagnóstico y acción |
| --- | --- |
| localhost 5173 no abre | Confirmar proceso Vite, puerto y terminal. Usar 127.0.0.1 y strictPort. No confundir Compose de datos con frontend iniciado. |
| ERR_CONNECTION_REFUSED API | Verificar Nest en 3000. Axios sigue apuntando al localhost del navegador. |
| npm ci falla | Revisar Node, manifiesto/lock, pares y flags. Conservar error; no regenerar lock sin revisar. |
| No conecta Prisma | Confirmar pg_isready, DATABASE_URL y credenciales. Instalar OpenSSL en imagen slim si Prisma advierte detección. |
| No existe bucket | Crear el bucket de S3_BUCKET y verificar política privada, endpoint y claves. |
| OCR devuelve 401 | La clave del backend no coincide con la del proceso OCR. |
| OCR devuelve 503 | Falta OCR_INTERNAL_API_KEY en ambiente real; .env local debe cargarse explícitamente. |
| OCR 502 o 504 desde API | Revisar conectividad, timeout, logs, modelo y recursos. No repetir automáticamente operaciones sin conocer su resultado. |
| Imagen o PDF rechazado | Verificar MIME real, tamaño, píxeles, páginas y límites coherentes. |
| ERROR 403 en una página | Revisar rol, permisos y routeAccess. Varias rutas están bloqueadas incluso para Admin. |
| Invalid currency code | Datos E2E usan códigos no ISO. Aislar la base de pruebas; no alterar expedientes reales para ocultar la falla. |
| Correo de recuperación no llega | EmailService sólo escribe log; integrar SMTP u otro proveedor antes de prometer entrega. |

Reporte de soporte: commit, ambiente, módulo, usuario y rol, fecha, pasos, código de expediente, request-id y error exacto. No adjuntar contraseñas, claves ni access_token. Una captura sin original de factura no es evidencia de que el documento esté correctamente almacenado.

## 27 Publicación actualización y reversión de código

Trabaje con cambios revisables y conserve la relación entre código, migraciones, locks y documentación. No publicar node_modules, dist, venv, logs, backups, sesiones del navegador ni renders. Los manuales finales se guardan en docs/manuales.

~~~powershell
git status --short
git diff --check
git diff --stat
# Agregar sólo código configuración de ejemplo y documentos finales
git add <RUTAS_REVISADAS>
git diff --cached --stat
git commit -m "Actualizar aplicación y documentación técnica"
git push origin main
~~~

Estos comandos describen el proceso de publicación; <RUTAS_REVISADAS> debe sustituirse por los archivos elegidos. En equipos con varias personas se recomienda rama y revisión antes de integrar a main. No hacer push --force ante divergencia.

En el servidor o ambiente destino: verificar un árbol limpio, obtener la revisión aprobada, instalar con npm ci, generar Prisma, respaldar, aplicar migraciones y ejecutar aceptación. Si hay datos sensibles, sólo el entorno destino administra sus archivos .env.

| Falla | Reversión controlada |
| --- | --- |
| Sólo frontend/API | Volver al artefacto o commit anterior previamente guardado, si el esquema sigue siendo compatible. |
| Cambio de dependencia | Reponer manifiesto y lock de la revisión anterior, npm ci y reconstruir. No mezclar locks de versiones. |
| Migración aplicada | Aplicar migración compensatoria probada o restaurar respaldo en una ventana aprobada; no asumir rollback automático. |
| Cambio de almacenamiento | Volver al endpoint aprobado sólo después de comprobar consistencia de objetos y metadatos. |
| Criterio de interrupción | Login general fallido, documentos ilegibles, saldos incoherentes o duplicados de movimientos. Pausar escrituras antes de investigar. |

## 28 Lista de aceptación de instalación

| Control | Resultado que debe conservarse |
| --- | --- |
| Revisión | Hash instalado y evidencia de que contiene módulos y migraciones documentados. |
| Herramientas | Node/npm/Python y digests aprobados, sin líneas EOL elegidas por defecto. |
| Configuración | Archivos de entorno excluidos de Git; clave OCR coincidente y secretos distintos. |
| Datos | PostgreSQL acepta conexiones; Prisma status actualizado; seed sólo demo. |
| Almacenamiento | Bucket privado existente; carga y apertura del original comprobadas. |
| API | Login y consulta autenticada correctos; permisos por empresa verificados. |
| OCR | Salud y documento real de ensayo procesado; texto/campos y límites revisados. |
| Frontend | Build y navegación correctos en 5173; URL API correspondiente al ambiente. |
| Finanzas | Escenarios de aprobación, pago, rendición, devolución y cierre en base/bucket de ensayo. |
| Seguridad | Auditoría de dependencias revisada y fallas pendientes con responsable y fecha. |
| Recuperación | Respaldo PostgreSQL y objetos, hash y ensayo de restauración. |
| Documentación | Manuales finales en docs/manuales; acta de instalación con incidencias y aceptación. |

No marcar instalada toda la aplicación sólo porque los contenedores estén Up. La aceptación exige distinguir disponibilidad técnica, permisos y corrección de los procesos financieros. Los defectos conocidos deben mantenerse como incidencias hasta que exista prueba de corrección.

## 29 Inventario de dependencias backend parte uno

Fuente: manifiesto y lock local más consulta a registry.npmjs.org del 6 de octubre de 2026. Compatible significa que satisface el rango SemVer del manifiesto; no demuestra que haya pasado pruebas de esta aplicación.

| Paquete | Bloqueada | Compatible | Última publicada |
| --- | --- | --- | --- |
| @aws-sdk/client-s3 | 3.1032.0 | 3.1146.0 | 3.1146.0 |
| @nestjs/common | 11.1.19 | 11.2.7 | 12.1.2 |
| @nestjs/config | 4.0.4 | 4.0.4 | 12.0.1 |
| @nestjs/core | 11.1.19 | 11.2.7 | 12.1.2 |
| @nestjs/jwt | 11.0.2 | 11.0.2 | 12.0.2 |
| @nestjs/passport | 11.0.5 | 11.0.5 | 12.0.0 |
| @nestjs/platform-express | 11.1.28 | 11.2.7 | 12.1.2 |
| @prisma/client | 6.7.0 | 6.19.3 | 7.10.0 |
| axios | 1.19.0 | 1.20.0 | 1.20.0 |
| bcrypt | 6.0.0 | 6.0.0 | 6.0.0 |
| class-transformer | 0.5.1 | 0.5.1 | 0.5.1 |
| class-validator | 0.15.1 | 0.15.1 | 0.15.1 |
| exceljs | 4.4.0 | 4.4.0 | 4.4.0 |
| form-data | 4.0.6 | 4.0.6 | 4.0.6 |
| mime-types | 3.0.2 | 3.0.2 | 3.0.2 |

Instalar la versión bloqueada reproduce el estado actual. Aplicar una candidata requiere revisar avisos de seguridad, pares, documentación y pruebas. Conservar package.json y package-lock.json juntos en el commit.

## 30 Inventario de dependencias backend parte dos

Fuente: manifiesto y lock local más consulta a registry.npmjs.org del 6 de octubre de 2026. Compatible significa que satisface el rango SemVer del manifiesto; no demuestra que haya pasado pruebas de esta aplicación.

| Paquete | Bloqueada | Compatible | Última publicada |
| --- | --- | --- | --- |
| multer | 2.2.0 | 2.4.0 | 2.4.0 |
| passport | 0.7.0 | 0.7.0 | 0.7.0 |
| passport-jwt | 4.0.1 | 4.0.1 | 4.0.1 |
| pdf-lib | 1.17.1 | 1.17.1 | 1.17.1 |
| prisma | 6.7.0 | 6.19.3 | 8.0.0-rc.20 prerelease |
| reflect-metadata | 0.2.2 | 0.2.2 | 0.2.2 |
| rxjs | 7.8.2 | 7.8.2 | 7.8.2 |
| ts-node | 10.9.2 | 10.9.2 | 10.9.2 |
| uuid | 14.0.0 | 14.0.2 | 14.0.2 |
| @nestjs/cli | 11.0.21 | 11.0.24 | 12.0.8 |
| @types/bcrypt | 6.0.0 | 6.0.0 | 6.0.0 |
| @types/mime-types | 3.0.1 | 3.0.1 | 3.0.1 |
| @types/multer | 2.1.0 | 2.3.0 | 2.3.0 |
| @types/node | 25.6.0 | 25.9.9 | 26.6.4 |

Instalar la versión bloqueada reproduce el estado actual. Aplicar una candidata requiere revisar avisos de seguridad, pares, documentación y pruebas. Conservar package.json y package-lock.json juntos en el commit.

## 31 Inventario de dependencias frontend

Fuente: manifiesto y lock local más consulta a registry.npmjs.org del 6 de octubre de 2026. Compatible significa que satisface el rango SemVer del manifiesto; no demuestra que haya pasado pruebas de esta aplicación.

| Paquete | Bloqueada | Compatible | Última publicada |
| --- | --- | --- | --- |
| @chakra-ui/react | 3.34.0 | 3.37.0 | 3.37.0 |
| @emotion/react | 11.14.0 | 11.14.0 | 11.14.0 |
| @reduxjs/toolkit | 2.12.0 | 2.13.0 | 2.13.0 |
| @tanstack/react-query | 5.101.4 | 5.104.1 | 5.104.1 |
| axios | 1.19.0 | 1.20.0 | 1.20.0 |
| class-transformer | 0.5.1 | 0.5.1 | 0.5.1 |
| class-validator | 0.15.1 | 0.15.1 | 0.15.1 |
| lucide-react | 1.11.0 | 1.52.0 | 1.52.0 |
| react | 19.2.5 | 19.3.0 | 19.3.0 |
| react-dom | 19.2.5 | 19.3.0 | 19.3.0 |
| react-redux | 9.3.0 | 9.3.0 | 9.3.0 |
| react-router-dom | 7.18.2 | 7.18.4 | 7.18.4 |
| @types/node | 24.12.2 | 24.19.1 | 26.6.4 |
| @types/react | 19.2.14 | 19.3.0 | 19.3.0 |
| @types/react-dom | 19.2.3 | 19.3.0 | 19.3.0 |
| @vitejs/plugin-react | 6.0.1 | 6.1.2 | 6.1.2 |
| typescript | 5.9.3 | 5.9.3 | 7.0.2 |
| vite | 8.2.0 | 8.3.3 | 8.3.3 |

Instalar la versión bloqueada reproduce el estado actual. Aplicar una candidata requiere revisar avisos de seguridad, pares, documentación y pruebas. Conservar package.json y package-lock.json juntos en el commit.

## 32 Inventario OCR e infraestructura

| Paquete OCR | Fijada | Última PyPI |
| --- | --- | --- |
| fastapi | 0.141.1 | 0.142.2 |
| uvicorn | 0.52.0 | 0.54.0 |
| python-multipart | 0.0.22 | 0.0.32 |
| pydantic | 2.12.5 | 2.13.5 |
| paddleocr | 3.7.0 | 3.7.0 |
| paddlepaddle | 3.3.1 | 3.3.1 |
| numpy | 2.3.5 | 2.5.3 |
| pillow | 12.3.0 | 12.3.0 |
| pymupdf | 1.28.0 | 1.28.2 |

Consulta directa a https://pypi.org/pypi/<PAQUETE>/json. NumPy latest requiere Python 3.12 o superior. Los números de PyPI son candidatos publicados y no reemplazan la evaluación del conjunto Paddle, plataforma y Python.

| Componente | Configuración y recomendación |
| --- | --- |
| PostgreSQL | Compose postgres:16; ejecución observada 16.11. Candidata 16.15 dentro de la misma línea; soporte mayor hasta noviembre de 2028 [7]. |
| Python Docker | python:3.11-slim sin digest. Fijar imagen y reconstruir con revisiones de seguridad. |
| MinIO | minio/minio:latest. Registrar digest y resolver distribución mantenida; repositorio oficial archivado [5]. |
| pgAdmin | dpage/pgadmin4:latest. Fijar versión/digest aprobados y revisar release notes. |
| Node | Runtime de los auxiliares 22.23.2; host 25.6.0. Objetivo LTS 24 después de validación [1]. |

## 33 Detalle de paquetes afectados en npm

Fuente: npm audit --package-lock-only --json ejecutado contra cada lock local en copia aislada el 6 de octubre de 2026. La severidad representa el paquete en el árbol y puede agregar varios avisos.

| Proyecto | Paquete | Severidad | Dependencia |
| --- | --- | --- | --- |
| backend | @nestjs/platform-express | high | Directa |
| backend | axios | high | Directa |
| backend | baseline-browser-mapping | moderate | Transitiva |
| backend | brace-expansion | high | Transitiva |
| backend | browserslist | high | Transitiva |
| backend | exceljs | moderate | Directa |
| backend | fast-uri | high | Transitiva |
| backend | js-yaml | high | Transitiva |
| backend | multer | high | Directa |
| backend | proxy-addr | critical | Transitiva |
| backend | qs | moderate | Transitiva |
| backend | uuid | moderate | Transitiva |
| frontend | axios | high | Directa |
| frontend | nanoid | high | Transitiva |
| frontend | source-map-js | high | Transitiva |

Aviso crítico registrado para proxy-addr: https://github.com/advisories/GHSA-jqcg-44mw-7w3h. Revisar alcance real según versión de Express y uso de proxies. npm explain identifica quién introduce el paquete.

La auditoría no modifica el árbol. Debe repetirse después de resolver actualizaciones; no publicar este resultado como prueba de ausencia de vulnerabilidades.

## 34 Fuentes oficiales y trazabilidad

Fuentes de ciclo de vida y procedimientos consultadas el 6 de octubre de 2026. Las versiones cambian; una instalación posterior debe renovar la consulta y conservar su acta.

[1] Node.js y calendario de releases
https://nodejs.org/en/about/previous-releases

[2] Requisitos de Vite 8
https://v8.vite.dev/guide/

[3] Estado de versiones Python
https://devguide.python.org/versions/

[4] Variables e interpolación en Docker Compose
https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/

[5] Repositorio oficial de MinIO archivado
https://github.com/minio/minio

[6] Instalaciones reproducibles mediante npm ci
https://docs.npmjs.com/cli/commands/npm-ci/

Fuentes de código: backend/package.json y package-lock.json; frontend/package.json y package-lock.json; Microservicio-OCR/requirements.txt y Dockerfile; dockers/server dockers/docker-compose.yml; main.ts, AppModule, configuración, OcrClientService, StorageService, seed y pruebas.

## 35 Fuentes de mantenimiento y aceptación

[7] Política de versiones PostgreSQL
https://www.postgresql.org/support/versioning/

[8] Funcionamiento y alcance de npm audit
https://docs.npmjs.com/cli/npm-audit/

[9] Guía de migración NestJS
https://github.com/nestjs/docs.nestjs.com/blob/master/content/migration.md

[10] Migración a Prisma 7
https://docs.prisma.io/docs/guides/upgrade-prisma-orm/v7

Inventario de versiones npm obtenido directamente del registro público: https://registry.npmjs.org/<PAQUETE>. Para paquetes con scope, consultar la URL codificada correspondiente. Se calcularon candidatas compatibles con los rangos SemVer declarados.

Inventario Python obtenido de los metadatos públicos de PyPI: https://pypi.org/pypi/<PAQUETE>/json. No se ejecutó una auditoría completa de Python ni un escaneo de todas las imágenes durante esta revisión.

Acta mínima que debe adjuntarse a cada instalación: commit, sistema operativo, herramientas, digests, configuración sin secretos, resultado de migraciones, respaldo/ensayo, pruebas y limitaciones pendientes.

La ruta permanente de este manual y de cualquier manual posterior del proyecto es docs/manuales dentro de la raíz del repositorio.
