# Contexto arquitectónico del proyecto

> Documento base para Codex y colaboradores técnicos. Consultar antes de iniciar tareas sobre el proyecto. Representa el estado analizado del repositorio al 1 de agosto de 2026. Si el código cambia, verificar únicamente el área afectada y actualizar este documento cuando corresponda.

## 1. Identificación y alcance

El proyecto es un **Sistema Web para la Gestión y Control Presupuestario de Gastos Operativos Empresariales**, desarrollado como proyecto de graduación y basado en la tesis `Proyecto-de-Graduación-Walter-Rene-Rosales-v03.docx`.

El código efectivo se encuentra bajo `stack/`:

- `stack/backend/`
- `stack/frontend/`
- `stack/Microservicio-OCR/`
- `stack/dockers/`

La solución busca centralizar solicitudes de gasto, aprobaciones, documentos, OCR, pagos, trazabilidad, presupuesto, liquidaciones, conciliación y reportes. El estado actual no cubre todo ese alcance con el mismo nivel de implementación.

## 2. Resumen ejecutivo

El núcleo realmente integrado comprende:

1. Autenticación mediante JWT.
2. Administración de usuarios, roles y permisos.
3. Catálogos de países, monedas y empresas.
4. Creación y consulta de solicitudes de gasto.
5. Envío, aprobación, rechazo y observación de solicitudes.
6. Registro básico de pagos para solicitudes aprobadas.
7. Carga de documentos en almacenamiento S3/MinIO.
8. Procesamiento OCR mediante un microservicio FastAPI/Python.
9. Corrección y confirmación de resultados OCR.
10. Trazabilidad de solicitudes, monitor de estados y cálculo básico de SLA.

Existen tres niveles de madurez:

- **Integrado:** autenticación, seguridad, catálogos, solicitudes, documentos/OCR y trazabilidad.
- **Parcial:** pagos, validación presupuestaria y SLA.
- **Visual o conceptual:** presupuesto, liquidaciones, conciliación, dashboard ejecutivo, reportes, notificaciones, gobernanza y varias funciones futuras.

Una pantalla frontend no debe considerarse evidencia de un módulo terminado. Varias páginas usan datos constantes o `ModulePlaceholderPage`.

## 3. Arquitectura general

```text
Navegador
  └─ React 19 + React Router + Chakra UI
       └─ Axios + JWT Bearer
            └─ NestJS /api
                 ├─ Auth y seguridad
                 ├─ Catálogos
                 ├─ Solicitudes y pagos
                 ├─ Documentos y OCR
                 └─ Trazabilidad
                      ├─ Prisma → PostgreSQL
                      ├─ S3Client → MinIO
                      └─ HTTP multipart → FastAPI OCR
                                           ├─ PaddleOCR
                                           ├─ PyMuPDF
                                           └─ Parser de facturas
```

El backend es un monolito modular NestJS. El OCR es el único microservicio separado. PostgreSQL y MinIO son compartidos por la aplicación; el servicio OCR no mantiene persistencia propia.

### Flujo general

```text
Usuario → Login → bcrypt → JWT → localStorage
        → Axios Bearer → JwtStrategy → permisos
        → controller/service → Prisma → PostgreSQL
```

Para documentos:

```text
Frontend → Backend → MinIO + PostgreSQL
         → Microservicio OCR → campos extraídos
         → PostgreSQL → revisión manual → confirmación
```

## 4. Stack tecnológico

### Backend

- NestJS 11.1.x.
- Prisma 6.7.x.
- PostgreSQL.
- Passport y Passport JWT.
- bcrypt 6.
- `class-validator` y `class-transformer`.
- AWS SDK S3.
- Multer.
- Axios/Fetch.
- RxJS.

### Frontend

- React 19.2.
- React DOM 19.2.
- React Router DOM 7.9.
- Vite 8.
- TypeScript 5.9.
- Chakra UI 3.28.
- Emotion.
- Axios.
- Lucide React.

Redux no está instalado ni utilizado. El estado se maneja principalmente con hooks locales y `localStorage`.

### OCR

Declaradas en `requirements.txt`:

- FastAPI.
- Uvicorn.
- python-multipart.
- Pydantic.

Usadas por el código, pero no declaradas:

- PaddleOCR.
- NumPy.
- Pillow.
- PyMuPDF.

## 5. Árbol de módulos backend

```text
AppModule
├─ PrismaModule
├─ UsersModule
├─ CatalogModule
├─ AuthModule
├─ DocumentsModule
│  └─ StorageModule
├─ OcrModule
├─ ExpenseRequestsModule
├─ PoliciesModule
├─ ExpenseRequestPaymentsModule
├─ SecurityModule
└─ TraceabilityModule
```

`HealthModule` existe, pero no está importado por `AppModule`, por lo que su endpoint no forma parte efectiva de la aplicación.

### Responsabilidades

| Módulo | Propósito | Estado | Dependencias principales |
|---|---|---|---|
| Prisma | Cliente y conexión PostgreSQL | Implementado | Prisma Client |
| Users | Búsqueda mínima de usuarios para login | Implementado | Prisma |
| Auth | Login, bcrypt, permisos y generación JWT | Implementado básico | Users, Prisma, Passport, JWT |
| Security | Usuarios, roles, permisos y matriz de acceso | Integrado | Prisma, bcrypt, Auth |
| Catalog | Países, monedas y empresas | Integrado | Prisma |
| Expense Requests | Solicitudes, ítems, documentos, edición, envío y cancelación | Integrado | Prisma, Auth, Catalog, Documents |
| Policies | CRUD y motor configurable de evaluación | Integrado | Prisma, Auth, ExpenseRequestValidation, ExpenseRequestTrace |
| Expense Request Payments | Pagos de solicitudes aprobadas | Parcial | Prisma, solicitudes, monedas |
| Documents | Carga, listado, detalle y recuperación | Integrado con brecha de permisos | Prisma, MinIO/S3 |
| OCR | Procesamiento, corrección y confirmación | Desarrollado; despliegue incompleto | Documents, Prisma, FastAPI OCR |
| Traceability | Aprobaciones, estados, SLA y bitácora | Integrado básico | Prisma, solicitudes, Auth |
| Health | Comprobación de salud | No conectado | NestJS |

No existen middlewares, interceptors, exception filters ni pipes personalizados adicionales. Existe un `ValidationPipe` global.

## 6. Frontend

### Estructura efectiva

```text
App
└─ RouterProvider
   ├─ LoginPage
   └─ ProtectedRoute
      └─ MainLayout
         ├─ Header
         ├─ Sidebar
         └─ Outlet/páginas
```

### Áreas con consumo real de API

- Login.
- Usuarios.
- Roles.
- Permisos.
- Matriz de acceso.
- Catálogos.
- Solicitudes de gasto.
- Detalle y envío de solicitudes.
- Documentos.
- Revisión OCR.
- Aprobaciones.
- Monitor de estados.
- SLA.
- Bitácora de eventos.

### Áreas principalmente estáticas o conceptuales

- Dashboard.
- Control presupuestario.
- Liquidaciones.
- Conciliación.
- Gobernanza.
- Reportes y analítica.
- Notificaciones.
- Auditoría visual.
- Centro de autorizaciones alternativo.
- Monitor de flujo alternativo.
- Políticas y reglas.

### Navegación

El `Sidebar` agrupa:

- Dashboard.
- Seguridad.
- Mapa del sistema.
- Planificación y normativa.
- Trazabilidad de flujos.
- Rendición y conciliación financiera.
- Control presupuestario e inteligencia.

El menú no se filtra por permisos. `ProtectedRoute` solo comprueba que exista un token en `localStorage`.

## 7. Flujo de autenticación y autorización

Endpoint:

```text
POST /api/auth/login
```

Proceso:

1. `UsersService.findByEmail()` consulta al usuario.
2. `bcrypt.compare()` valida la contraseña.
3. Se consultan `UserRole`, `Role` y `RolePermission` activos.
4. Se consolidan códigos de permiso sin duplicados.
5. Se genera un JWT.

El JWT contiene:

- `sub`.
- `email`.
- `name`.
- `role`.
- `companyId`.
- `managerId`.
- `costCenter`.
- `position`.
- `permissions`.

El frontend almacena el token como `access_token`. Axios agrega `Authorization: Bearer <token>`. Ante un `401`, elimina la sesión y redirige a `/login`.

### Mecanismos de autorización

Coexisten:

1. `JwtAuthGuard`.
2. `requirePermission()` en controllers.
3. Comprobaciones directas de permisos en services.
4. `RolesGuard` y `@Roles`, presentes pero sin uso efectivo en las rutas principales.

`User.role` es un rol legado. El RBAC actual usa `UserRole` y permite múltiples roles. `ADMIN` tiene un bypass especial en `hasPermission()`.

### Riesgos de seguridad conocidos

- El login no comprueba `User.active`.
- Los permisos quedan embebidos en el JWT hasta que expire.
- No hay refresh token ni revocación de sesión.
- No hay rate limiting ni bloqueo por intentos fallidos.
- Los catálogos no están protegidos con JWT.
- CORS acepta cualquier origen con credenciales.
- El token está en `localStorage`.
- No se filtran rutas o menús por permisos.
- No existe bitácora de login o sesiones.
- La contraseña de demostración está en el seed.

## 8. Flujo de una solicitud de gasto

### Creación

1. El frontend carga países, monedas y empresas.
2. El usuario captura empresa, centro de costo, cuenta, tipo, prioridad, concepto, justificación e ítems.
3. El frontend envía la solicitud.
4. El controller exige JWT y `EXPENSE_REQUEST_CREATE`.
5. El servicio busca la empresa por ID o código.
6. Obtiene su país y moneda.
7. Genera el correlativo mediante `DocumentSeries`.
8. Recalcula el total en backend.
9. Prisma crea solicitud, ítems, validaciones y traza.

La solicitud inicia en `BORRADOR`.

La identidad no procede del formulario: `requesterId`, `requesterName` y `requesterRole` se obtienen exclusivamente de `req.user`, autenticado mediante JWT. El frontend solo muestra nombre y rol como datos de lectura.

Se crea la validación marcadora `PRESUPUESTO / PENDIENTE`. Las políticas se evalúan mediante `PolicyEngineService`; sus resultados `OK`, `WARNING`, `ERROR`, `APPROVAL_REQUIRED` y `NOT_APPLICABLE` se almacenan como `ExpenseRequestValidation` con tipo `POLITICA:<código>`.

El motor recibe un objeto de dominio y no depende de HTTP ni de `ExpenseRequestsService`. Las reglas configurables soportan monto, empresa, país, centro de costo, cuenta presupuestaria, tipo, prioridad, rol, destino, moneda y días. La evaluación se ejecuta al crear, editar y enviar una solicitud, sin detenerse en la primera coincidencia.

### Catálogo administrativo y simulador

`PoliciesRulesPage` es el catálogo funcional del motor. Permite buscar, filtrar por empresa, país, tipo, estado, vigencia, prioridad, resultado, campo y operador; ordenar; paginar; alternar entre tarjetas y tabla; crear desde plantillas o biblioteca; y exportar el resultado filtrado a CSV, JSON o Excel compatible.

El simulador usa `POST /api/policies/simulate`. El controller adapta el formulario a `PolicyEvaluationInput` y llama al mismo `PolicyEngineService.evaluate()` utilizado por Solicitudes. La simulación no crea solicitudes, validaciones ni trazas.

```text
Usuario funcional
      |
      +--> Catálogo --> PoliciesService --> PolicyRule
      |
      +--> Plantilla/Biblioteca --> precarga del formulario --> CRUD normal
      |
      +--> Simulador --> PoliciesController --> PolicyEngineService
                                             |
                                             +--> reglas aplicadas
                                             +--> reglas ignoradas
                                             +--> OK / WARNING / ERROR
                                             +--> APPROVAL_REQUIRED
```

Ejemplos configurables:

- `AMOUNT GREATER_THAN 10000` → `APPROVAL_REQUIRED`.
- `AMOUNT GREATER_THAN 100000` → `ERROR`.
- `DESTINATION CONTAINS INTERNACIONAL`, limitado a `GASTO_VIAJE` → aprobación y recordatorio documental.
- `COST_CENTER EQUALS MARKETING` → `WARNING`.
- `BUDGET_ACCOUNT CONTAINS PROYECTO ESPECIAL` → `APPROVAL_REQUIRED`.

Casos de uso principales:

1. El administrador crea o ajusta una regla desde cero o desde una plantilla.
2. Desactiva temporalmente reglas sin eliminarlas.
3. Simula una combinación de solicitud antes de publicar o modificar políticas.
4. Exporta el catálogo filtrado para revisión funcional o auditoría.
5. Consulta vigencia, próxima expiración y resultado esperado desde el catálogo.

### Edición, documentos y cancelación

- `PATCH /api/expense-requests/:id` actualiza únicamente borradores del solicitante o de un administrador y registra `SOLICITUD_EDITADA`.
- `PATCH /api/expense-requests/:id/documents` asocia documentos existentes mediante `Document.expenseRequestId`; no altera el procesamiento OCR.
- `PATCH /api/expense-requests/:id/cancel` cambia únicamente borradores a `CANCELADA`, sin eliminación física, y registra `SOLICITUD_CANCELADA`.
- Empresa, país y moneda se validan como catálogos activos y coherentes; los totales siempre se recalculan en backend.

### Envío

```text
PATCH /api/expense-requests/:id/submit
```

- Solo admite `BORRADOR`.
- Cambia directamente a `PENDIENTE_APROBACION`.
- Registra `SOLICITUD_ENVIADA_AUTORIZACION`.

### Autorización

Traceability permite:

- Aprobar → `APROBADA`.
- Rechazar → `RECHAZADA`.
- Observar → `OBSERVADA`.

Cada acción crea `ExpenseRequestTrace`. No existen tablas independientes para flujos, pasos o logs de aprobación.

### Pago

`ExpenseRequestPayment` acepta pagos sobre solicitudes `APROBADA` y registra método, banco, referencias, monto, moneda, fecha, usuario y notas. El pago nace directamente como `PAGADO`.

No hay integración bancaria, control de sobrepago, liquidación formal ni actualización automática del estado de la solicitud.

## 9. Flujo OCR

### Carga

```text
POST /api/documents/upload
```

1. Multer recibe el archivo en memoria.
2. `StorageService` lo guarda en MinIO/S3.
3. Prisma crea `Document` en estado `CARGADO`.

### Procesamiento

```text
POST /api/ocr/:documentId
```

1. Busca el documento.
2. Cambia a `PROCESANDO`.
3. Recupera el binario desde MinIO.
4. Lo envía como multipart al microservicio.
5. Recibe texto, contexto, campos, ítems, totales y confianza.
6. Persiste `OCRResult` y sus entidades relacionadas.
7. Cambia a `PENDIENTE_REVISION`.
8. Ante error, cambia a `ERROR_OCR`.

### Microservicio Python

Endpoints:

- `GET /health`.
- `POST /process`.

Para imágenes, PaddleOCR procesa en español y reintenta con menor resolución si falla. Para PDF, PyMuPDF intenta extraer texto; si el PDF es escaneado, solo se aplica OCR a la primera página.

`invoice_parser.py` extrae mediante reglas y expresiones regulares:

- País y moneda.
- Tipo de documento.
- Emisor e identificación tributaria.
- Serie y DTE.
- Fechas.
- Comprador.
- Autorización y certificador.
- Subtotal, impuesto y total.
- Posibles líneas de detalle.

Incluye reglas para Guatemala, El Salvador, Honduras, Nicaragua y Costa Rica.

### Revisión

El frontend permite consultar, corregir campos e ítems y confirmar. La confirmación crea `OCRConfirmation` y cambia el documento a `CONFIRMADO`.

### Brechas

- `Document.expenseRequestId` existe, pero no hay flujo completo para asociarlo.
- No existe entidad de liquidación.
- El cliente OCR usa `http://localhost:8000/process` de forma fija.
- El Dockerfile OCR no instala todas las dependencias usadas.
- `ocr_processor copy.py` es una implementación duplicada.

## 10. Modelo de datos

### Relaciones principales

```text
Country
├─ Company
├─ Currency (N:M implícita)
└─ ExpenseRequest

Currency
├─ Company
├─ ExpenseRequest
└─ ExpenseRequestPayment

Company
├─ User
├─ DocumentSeries
└─ ExpenseRequest

User
├─ manager/subordinates → User
├─ UserRole → Role
├─ Document
├─ OCRConfirmation
└─ ExpenseRequestPayment

Role
├─ UserRole → User
└─ RolePermission → Permission

ExpenseRequest
├─ ExpenseRequestItem
├─ ExpenseRequestValidation
├─ ExpenseRequestTrace
├─ ExpenseRequestPayment
├─ Document
├─ Company
├─ Country
└─ Currency

Document
├─ User
├─ ExpenseRequest
├─ OCRResult
└─ OCRConfirmation

OCRResult
├─ ExtractedField
├─ ExtractedExtraField
└─ ExtractedLineItem
```

### Modelos

Seguridad:

- `User`.
- `Role`.
- `Permission`.
- `UserRole`.
- `RolePermission`.

Catálogos:

- `Country`.
- `Currency`.
- `Company`.
- `DocumentSeries`.

Solicitudes:

- `ExpenseRequest`.
- `ExpenseRequestItem`.
- `ExpenseRequestValidation`.
- `ExpenseRequestTrace`.
- `ExpenseRequestPayment`.

Políticas y aprobaciones:

- `PolicyRule`: condición configurable y resultado esperado del motor de políticas.
- `PolicyApprovalStep`: ruta ordenada de aprobadores asociada a una política `APPROVAL_REQUIRED`.
- `ApprovalFlow`: instancia del flujo generado para una entidad; actualmente integrada con solicitudes.
- `ApprovalStep`: nivel, asignación, delegación y decisión de una instancia de flujo.

OCR:

- `Document`.
- `OCRResult`.
- `ExtractedField`.
- `ExtractedExtraField`.
- `ExtractedLineItem`.
- `OCRConfirmation`.

### Enums

- `RoleName`.
- `AccessScope` — declarado pero no utilizado.
- `DocumentStatus`.
- `ExpenseRequestStatus`.
- `ExpenseType`.
- `RequestPriority`.
- `PaymentStatus`.
- `PaymentMethod`.
- `PolicyField`, `PolicyOperator` y `PolicyResultStatus`.
- `ApprovalFlowStatus` y `ApprovalStepStatus`.

### Dominios no persistidos

No existen modelos para:

- Presupuestos, partidas, períodos, reservas o ejecución.
- Liquidaciones y detalles.
- Anticipos, conciliaciones y reintegros.
- Notificaciones.
- SLA configurable.
- Auditoría general.
- Sesiones y accesos.
- Reportes o exportaciones.

## 11. Estado funcional por dominio

### Implementados o integrados

- Autenticación básica.
- Seguridad y matriz de acceso.
- Catálogos.
- Creación, listado, detalle y envío de solicitudes.
- Aprobación, rechazo y observación.
- Documentos en MinIO.
- Flujo OCR y confirmación.
- Trazabilidad de solicitudes.
- Monitor y bitácora de eventos.
- Catálogo, simulación y evaluación de políticas configurables.
- Flujos de aprobación configurables de uno o varios niveles.
- Asignación, reasignación, aprobación, rechazo, observación, delegación y cancelación de flujos.

### Parciales

- Pagos de solicitudes.
- Alcances de acceso propio/equipo/empresa/todos.
- Asociación documento–solicitud.
- Validación presupuestaria.
- SLA.
- Integración del Approval Engine con dominios distintos de solicitudes.

### Pendientes o conceptuales

- Presupuesto integral y ejecución.
- Simulación/verificación presupuestaria.
- Liquidaciones.
- Anticipos y conciliación.
- Reintegros y cierres certificados.
- Notificaciones persistentes.
- Auditoría transversal y bitácora de acceso.
- Reportes y exportaciones reales.
- Integraciones financieras externas.
- Gobernanza de unidades y centros de costo.
- Integraciones futuras del motor de políticas con Presupuesto, SLA, OCR y Liquidaciones.
- Dashboard con datos reales.

## 11.1 Approval Engine

El motor de aprobaciones es un servicio de dominio desacoplado de HTTP y de la interfaz. No modifica ni replica el `PolicyEngineService`: consume su resultado estructurado y procesa únicamente las reglas cuyo resultado sea `APPROVAL_REQUIRED`.

```text
ExpenseRequestsService.submit()
  -> PolicyEngineService.evaluate()
  -> ExpenseRequestValidation
  -> ApprovalEngineService.generateFlow()
       -> PolicyApprovalStep (configuración)
       -> ApprovalFlow + ApprovalStep (ejecución)
       -> ExpenseRequestTrace (bitácora)
  -> ApprovalFlowService
       -> aprobar / rechazar / observar / delegar / reasignar / cancelar
       -> activa el siguiente nivel o finaliza el flujo
```

### Configuración y generación

- Una política `APPROVAL_REQUIRED` debe tener al menos un `PolicyApprovalStep`.
- Cada nivel define un rol, un usuario específico o ambos.
- Cuando solo se configura un rol, el motor asigna un usuario activo de ese rol perteneciente a la empresa de la solicitud.
- Las rutas de todas las políticas aplicables se combinan respetando la prioridad de las reglas y el orden de sus niveles.
- Una misma combinación usuario/rol se elimina si aparece duplicada en el flujo resultante.
- La generación es idempotente por `entityType + entityId`.

### Ejecución

- Solo el nivel actual queda `ASIGNADA`; los niveles posteriores permanecen `PENDIENTE`.
- Solo el usuario asignado puede aprobar, rechazar, observar o delegar.
- Aprobar activa el nivel siguiente; el último nivel deja flujo y solicitud `APROBADA`.
- Rechazar finaliza el flujo y marca los pasos posteriores como `OMITIDA`.
- Observar conserva el nivel actual para que pueda continuar luego de atender la observación.
- Delegar cambia el aprobador del nivel actual y conserva el origen de la delegación.
- Cancelar finaliza los pasos abiertos sin borrar información.
- Los eventos se guardan en `ExpenseRequestTrace`; no existe una bitácora paralela.

### API mínima

- `GET /approval-flows/pending/me`
- `GET /approval-flows/request/:requestId`
- `GET /approval-flows/:id`
- `GET /approval-flows/:id/history`
- `POST /approval-flows/:id/approve`
- `POST /approval-flows/:id/reject`
- `POST /approval-flows/:id/observe`
- `POST /approval-flows/:id/delegate`
- `PATCH /approval-flows/:id/steps/:stepId/reassign`
- `POST /approval-flows/:id/cancel`

Las operaciones antiguas de trazabilidad delegan al motor cuando la solicitud posee un flujo; las solicitudes históricas sin flujo conservan el comportamiento anterior.

### Centro de Autorizaciones

La interfaz oficial se encuentra en `/trazabilidad-flujos/autorizaciones` y funciona exclusivamente como capa de presentación del Approval Engine:

- Consume `GET /approval-flows/pending/me`, por lo que la bandeja se limita al usuario autenticado.
- Carga flujo, historial y expediente completo bajo demanda al seleccionar una aprobación.
- Presenta filtros locales, búsqueda con debounce, ordenamiento y paginación sobre la bandeja personal retornada por backend.
- Representa los pasos y estados entregados por el motor sin recalcular decisiones.
- Ejecuta aprobar, rechazar, observar, delegar, reasignar y cancelar mediante los endpoints existentes.
- Los comentarios obligatorios y la autorización final siguen siendo validados por backend.
- No contiene reglas de políticas, asignación ni avance de niveles.

## 11.2 Workflow: notificaciones, bandejas y SLA

La capa Workflow se integra sin modificar los motores de políticas y aprobaciones:

```text
ExpenseRequestsController / ApprovalController
  -> WorkflowEventBus
       -> NotificationService
            -> NotificationChannelAdapter
                 -> InAppNotificationChannel
                      -> Notification
       -> consumidores futuros (EMAIL, MICROSOFT_TEAMS, PUSH, WEBHOOK)

ApprovalStep.assignedAt + ExpenseRequest.priority
  -> SlaService
       -> SlaRule
       -> elapsedMinutes / remainingMinutes / overdueMinutes / indicator
```

Eventos soportados:

- `REQUEST_CREATED`.
- `REQUEST_SUBMITTED`.
- `REQUEST_OBSERVED`.
- `REQUEST_REJECTED`.
- `REQUEST_APPROVED`.
- `REQUEST_CANCELLED`.
- `FLOW_GENERATED`.
- `APPROVER_ASSIGNED`.
- `APPROVAL_DELEGATED`.
- `FLOW_COMPLETED`.

El canal implementado es `IN_APP`. Los canales `EMAIL`, `MICROSOFT_TEAMS`, `PUSH` y `WEBHOOK` están representados en el contrato y enum, pero no poseen adaptador ni realizan conexiones externas.

Configuración SLA inicial:

| Prioridad | Objetivo | Advertencia |
|---|---:|---:|
| URGENTE | 240 minutos | 60 minutos restantes |
| ALTA | 480 minutos | 120 minutos restantes |
| NORMAL | 1,440 minutos | 240 minutos restantes |
| BAJA | 2,880 minutos | 480 minutos restantes |

Indicadores: `GREEN` dentro del objetivo, `YELLOW` dentro del umbral de advertencia y `RED` vencido. No existe todavía un cron de vencimiento o escalamiento automático.

Bandejas frontend:

- Mis notificaciones.
- Pendientes con SLA.
- Mis observadas.
- Mis delegadas.
- Mis aprobadas.
- Historial.

La campana del encabezado consulta notificaciones reales, muestra no leídas, permite marcar una o todas y navega al detalle o expediente.

API Workflow:

- `GET /notifications`.
- `GET /notifications/latest`.
- `GET /notifications/unread-count`.
- `GET /notifications/:id`.
- `PATCH /notifications/:id/read`.
- `PATCH /notifications/read-all`.
- `GET /workflow/sla/rules`.
- `GET /workflow/sla/pending/me`.
- `GET /workflow/sla/flow/:id`.

## 12. Docker e infraestructura

El Compose actual solo define:

- PostgreSQL 16 en `5432` con volumen `postgres_data`.
- MinIO en `9000/9001` con volumen `minio_data`.
- pgAdmin en `5050`, dependiente de PostgreSQL.

No incluye:

- Backend.
- Frontend.
- Microservicio OCR.
- Creación automática del bucket MinIO.
- Migraciones o seed.
- Health checks.
- Red explícita.
- Orden completo de inicio.

No existen Dockerfiles para backend y frontend. Las credenciales de desarrollo están codificadas directamente y MinIO/pgAdmin usan imágenes `latest`.

## 13. Riesgos técnicos prioritarios

### Críticos

1. **Docker OCR no reproducible:** faltan PaddleOCR, NumPy, Pillow y PyMuPDF.
2. **URL OCR fija:** el backend ignora `OCR_SERVICE_URL` y usa `localhost:8000`.
3. **Usuario inactivo autenticable:** login no valida `active`.
4. **Filtro documental no aplicado:** `DocumentsService.findAll()` construye un filtro de permisos, pero no lo usa en `findMany()` ni en `count()`.

### Altos

- Catálogos sin JWT.
- Menús y rutas sin filtrado por permisos.
- Permisos del JWT desactualizados hasta su expiración.
- CORS abierto.
- Sin rate limiting ni bloqueo de login.
- Compose no levanta la aplicación completa.
- Presupuesto todavía genera una validación pendiente sin ejecutar un motor real.
- No hay suite automatizada de pruebas declarada.
- Faltan índices para consultas por estado, fecha, empresa, solicitante y eventos.

### Medios

- Dos guards JWT.
- Dos decoradores de roles equivalentes.
- Dos `ProtectedRoute`.
- Dos routers.
- Dos providers de Chakra.
- Servicios frontend duplicados de solicitudes y seguridad.
- Ruta `autorizaciones` duplicada.
- Ruta `notificaciones` duplicada.
- Endpoint frontend `/ocr/:id/process` inexistente.
- Servicio alternativo de login duplica `/api`.
- `VITE_API_URL` no se usa; la URL está fija.
- Logs de depuración en frontend y backend.
- `update-expense-request-payment.dto.t` tiene extensión incorrecta.
- `file.util.ts`, `.env.example` raíz y `prueba.tsx` están vacíos.
- `env.validation.ts` existe pero no está conectado a `ConfigModule`.

## 14. Convenciones y observaciones

- Backend modular por controller/service/DTO.
- Acceso Prisma directo desde services.
- UUID para entidades principales.
- Auditoría temporal mediante `createdAt`/`updatedAt`.
- Desactivación lógica mediante `active`.
- Estados de negocio en español, con nombres de código mezclados en español e inglés.
- Validación global con whitelist, transformación y rechazo de campos desconocidos.
- La auditoría actual se limita principalmente a `ExpenseRequestTrace`.
- Las validaciones y trazas usan strings libres en varios campos.
- La tesis expresa un alcance y grado de finalización superior al observado en el código; para decisiones técnicas, prevalece el estado real del repositorio.

## 15. Regla operativa para tareas futuras

Antes de modificar el proyecto:

1. Leer este documento.
2. Identificar el dominio y su estado real: integrado, parcial o conceptual.
3. Verificar únicamente los archivos del área que puedan haber cambiado desde este análisis.
4. No asumir que una página está conectada a una API.
5. No asumir que un requisito descrito en la tesis tiene modelo o backend implementado.
6. Preservar el RBAC, la trazabilidad y las relaciones existentes al diseñar cambios.
7. Considerar que el working tree puede contener cambios locales del usuario; no sobrescribirlos.

## 16. Integración presupuestaria (Sprint 4)

El sistema no mantiene el presupuesto corporativo. Consume versiones oficiales mediante proveedores intercambiables. `IBudgetSourceProvider` define el contrato; `ExcelBudgetProvider` implementa el origen actual y `OracleJdeProvider` reserva el punto de extensión para API, base de datos o ETL de Oracle JD Edwards. `BudgetEngineService` consulta únicamente el repositorio normalizado, por lo que no conoce Excel ni requerirá cambios al sustituir el proveedor.

### Fuente oficial 2026

El libro `documentacion/2025.10.21 - OPEX DSC 2026 v3.0.xlsx` contiene ocho hojas. La hoja maestra importable es `Detalle TI` (encabezados en fila 6, datos desde fila 7 y total en fila 296). `Resumen` es una vista agregada; las demás hojas son históricas, auxiliares u hojas de detalle de años anteriores. La importación usa B:K para dimensiones, BT:CE para enero-diciembre 2026, CF como total informativo y CH como comentario. El importe anual autoritativo se deriva de los doce meses.

El archivo tiene 289 filas fuente y se normaliza a 286 líneas por tres duplicados exactos consolidados. La suma mensual oficial importable es USD 1,768,727.60. La diferencia frente a totales almacenados se reporta como advertencia. El archivo no identifica empresa y contiene valores de país que no existen en todos los catálogos actuales; no se inventan asociaciones: se preserva el código fuente y se emite advertencia.

### Modelo y flujo

```text
Excel / Oracle JDE -> IBudgetSourceProvider -> validación y vista previa
                    -> transacción -> BudgetVersion -> BudgetLine -> BudgetPeriod
ExpenseRequest -> BudgetEngineService -> BudgetEvaluationResult
WorkflowEventBus -> BudgetWorkflowSubscriber -> reserva / liberación / ejecución
                                      -> ExpenseRequestValidation + ExpenseRequestTrace
```

- `BudgetVersion`: importación inmutable, hash del archivo, usuario, fecha, estado y versión fiscal.
- `BudgetLine`: una combinación natural de país fuente, BU, objeto, subcuenta, área y detalle.
- `BudgetPeriod`: los doce importes mensuales aprobados.
- `BudgetReservation`: asignación transaccional entre solicitud y líneas presupuestarias; estados `RESERVED`, `RELEASED` y `EXECUTED`.
- Disponible = aprobado - reservado - ejecutado. Comprometido equivale a reservas activas. Saldo = disponible - monto solicitado.

Eventos: `REQUEST_SUBMITTED` reserva; `REQUEST_REJECTED` y `REQUEST_CANCELLED` liberan; `REQUEST_APPROVED` ejecuta. Las operaciones son idempotentes y se registran en las validaciones y trazas existentes. No se convierte moneda sin una tasa oficial: una solicitud con moneda diferente recibe `NO_APPLIES` y un mensaje explícito.

Endpoints: `POST /budget-imports/preview`, `POST /budget-imports`, `GET /budget-imports/versions`, `GET /budget-imports/versions/:id`, `GET /budget-imports/versions/:currentId/compare/:previousId` y `GET /budget/requests/:id/evaluation`.

## 17. Dashboard Ejecutivo (Sprint 4.5)

El dashboard principal dejó de utilizar indicadores simulados. La raíz `/` presenta `ExecutiveDashboardPage`, destinada a `ADMIN`, `GERENTE` y `FINANZAS`, y consume únicamente consultas de lectura del `DashboardModule`.

```text
ExecutiveDashboardPage
  -> React Query + Axios
  -> DashboardController (JWT + roles ejecutivos)
  -> DashboardService
       -> ExpenseRequest / ExpenseRequestValidation
       -> ApprovalFlow / ApprovalStep
       -> SlaService
       -> BudgetVersion / BudgetLine / BudgetReservation
       -> Company / Country / User
```

No existen tablas, cachés persistentes ni copias de indicadores. Los valores se calculan en backend desde los datos vigentes. El dashboard reutiliza `SlaService.calculate()` para los semáforos y consulta resultados persistidos de políticas, aprobaciones y presupuesto sin ejecutar nuevamente sus motores.

Filtros compartidos: empresa, país, fecha inicial, fecha final, estado, prioridad, tipo de gasto, centro de costo y solicitante. Los filtros se aplican en backend a solicitudes y relaciones dependientes.

Endpoints de solo lectura: `GET /dashboard/summary`, `/budget`, `/workflow`, `/policies`, `/approvals`, `/charts`, `/trends` y `/filters`.

Indicadores: estados de solicitudes, presupuesto aprobado/reservado/ejecutado/disponible, consumo, tiempos y pendientes del workflow, semáforos SLA, resultados de políticas, desempeño por aprobador, consumo por empresa y país, top 10 por tipo/centro/cuenta y tendencias diarias, semanales y mensuales.

La fuente presupuestaria dentro del alcance académico continúa siendo exclusivamente la importación mediante Excel. `OracleJdeProvider` se mantiene como frontera arquitectónica sin conexión implementada y Oracle JD Edwards queda fuera del alcance del Trabajo de Graduación.
