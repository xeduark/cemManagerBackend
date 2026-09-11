# Acta Manager Backend

Backend para la gestión de actas de entrega de equipos, construido con **Node.js + Express 5 + TypeScript** (ESM/NodeNext), **PostgreSQL** (vía `pg`, sin ORM) y **Docker**.

---

## Stack

- Express 5 + TypeScript (NodeNext)
- PostgreSQL 16 (contenedor Docker), consultas SQL directas con `pg`
- JWT (access + refresh token vía cookie httpOnly) para autenticación
- Swagger (`swagger-jsdoc` + `swagger-ui-express`) en `/api/docs`
- Vitest + Supertest para pruebas
- Docker Compose para desarrollo y producción

---

## Requisitos

- Node.js v20+
- Docker Desktop
- Un archivo `.env` en la raíz (ver más abajo)

---

## Variables de entorno (`.env`)

```env
PORT=4000

# PostgreSQL
DB_HOST=localhost        # dentro de Docker Compose se sobreescribe a "db"
DB_PORT=5432
DB_NAME=acta_manager
DB_USER=...
DB_PASSWORD=...

# JWT
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
ACCESS_TOKEN_EXPIRES=15m
REFRESH_TOKEN_EXPIRES=7d

# CORS (orígenes del frontend)
FRONTEND_URL=http://localhost:3000
FRONTEND_URL_VITE=http://localhost:3000   # el frontend corre en el puerto 3000, no 5173

# Google Workspace SSO (opcional; si no se define, /api/auth/google responde error controlado)
GOOGLE_CLIENT_ID=...
# Lista separada por comas de dominios de correo permitidos para SSO
GOOGLE_WORKSPACE_DOMAINS=menteplena.com.co,comitedeestudiosmedicos.com

# SMTP (opcional). Sin configurar, los correos de firma remota se simulan
# en el log del servidor en vez de enviarse — útil para probar en local.
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

---

## Desarrollo local (Docker)

```bash
docker volume create actamanagerbackend_postgres_data   # una sola vez
docker compose up -d --build
```

Esto levanta `acta_db` (Postgres) y `acta_backend` (API en modo `npm run dev`, con recarga en caliente vía bind-mount). La API queda en `http://localhost:4000`.

> **Nota Windows/Docker Desktop**: la recarga en caliente (`tsx watch`) a veces no detecta cambios de archivos por el bind-mount. Si el contenedor no refleja tu último cambio, o si instalaste una dependencia nueva, hay que reconstruir:
> ```bash
> docker compose rm -f -s -v api
> docker compose up -d --build api
> ```
> (el `-v` es importante: el volumen anónimo de `node_modules` no se refresca solo con `--build`).

Comandos útiles:

```bash
docker ps -a                                              # ver contenedores
docker logs -f acta_backend                                # logs en vivo
docker exec -it acta_db psql -U <DB_USER> -d <DB_NAME>      # entrar a psql
```

Dentro de `psql`: `\dt` lista las tablas, `\d nombre_tabla` describe una tabla.

### Sin Docker

```bash
npm install
npm run build   # compila src/ -> dist/
npm start       # node dist/index.js

npm run dev     # o, para desarrollo: tsx watch src/index.ts
npm test        # vitest
```

---

## Roles y permisos (RBAC)

Tres roles: `SUPERADMIN`, `ADMIN`, `LECTOR`.

| Acción | LECTOR | ADMIN | SUPERADMIN |
|---|---|---|---|
| Leer actas, catálogos, analítica | ✅ | ✅ | ✅ |
| Crear/editar/cerrar actas, firmar | ❌ | ✅ | ✅ |
| Crear/desactivar sedes (`POST`/`DELETE /api/sedes`) | ❌ | ✅ | ✅ |
| Ver personal para selectores (`/api/personal`) | ✅ | ✅ | ✅ |
| Gestionar usuarios (`/api/users`) | ❌ | ❌ | ✅ |
| Resolver solicitudes de cambio de contraseña | ❌ | ❌ | ✅ |
| Editar configuración general (`/api/settings`) | ❌ | ❌ | ✅ |

Toda ruta (salvo `POST /api/auth/login`, `POST /api/auth/google` y `POST /api/auth/solicitar-cambio-password`) requiere `Authorization: Bearer <accessToken>`.

**Nota de datos**: los roles en la base de datos están guardados como texto libre en minúscula (`"admin"`, `"superadmin"`, `"viewer"`) tal como se crearon originalmente — el middleware normaliza a mayúsculas al comparar, pero el valor `"viewer"` no se ha renombrado a `"lector"` en la BD. Es una decisión de negocio pendiente, no un bug.

---

## Autenticación

- **Login normal**: `POST /api/auth/login` `{ email, password, rememberMe? }` → `{ accessToken, mustChangePassword, user }` + cookie `refreshToken`.
- **Login con Google Workspace SSO**: `POST /api/auth/google` `{ idToken, rememberMe? }`. Verifica el ID token contra Google (`google-auth-library`, sin necesidad de client secret), valida que el dominio del correo esté en `GOOGLE_WORKSPACE_DOMAINS`, y **solo autentica usuarios que ya existen** en la tabla `users` — no crea cuentas nuevas. Pensado para el personal de sistemas/IT.
- **Renovar sesión**: `POST /api/auth/refresh` (sin body, usa la cookie `refreshToken`) → `{ accessToken, user }`, rota el `refreshToken`. El `accessToken` dura `ACCESS_TOKEN_EXPIRES` (15 min por defecto) — **el frontend tiene que llamar este endpoint antes de que expire (o al recibir un 401), si no, el usuario ve la sesión "cerrarse" cada 15 minutos** aunque tenga una cookie de sesión válida por días. `rememberMe: true` en el login extiende la cookie/el refresh token a `REFRESH_TOKEN_EXPIRES_REMEMBER` (30 días por defecto) en vez de `REFRESH_TOKEN_EXPIRES` (7 días); ese valor se conserva automáticamente en cada renovación posterior, sin tener que volver a mandar `rememberMe`.
- **Cambio de contraseña (autenticado)**: `POST /api/auth/change-password` `{ currentPassword, newPassword }`.
- **"Olvidé mi contraseña"** (público, con rate limit de 5 intentos / 15 min por IP): `POST /api/auth/solicitar-cambio-password` `{ email, nombreCompleto, motivo }` con `motivo` en `OLVIDO | CAMBIO_REGULAR | CUENTA_COMPROMETIDA`. No resetea nada automáticamente — crea una solicitud que un `SUPERADMIN` revisa (`GET /api/auth/solicitudes-cambio-password`) y resuelve (`POST /api/auth/solicitudes-cambio-password/:id/resolver`), lo que genera una contraseña temporal aleatoria y marca `must_change_password = true` para esa cuenta.
- **`mustChangePassword`**: cuando el login devuelve `true`, el frontend debe bloquear la navegación hasta que el usuario cambie su contraseña. Se usa tanto para las contraseñas temporales generadas por sistemas como para las cuentas creadas en la importación histórica (contraseña inicial = cédula sin el último dígito).

---

## Firma digital

Tabla `acta_firmas` (una fila por `acta_id` + `tipo`, con upsert al volver a firmar):

- `POST /api/actas/:id/firma` (ADMIN/SUPERADMIN) `{ tipo: "RECIBE" | "ENTREGA", firmaBase64, firmanteNombre?, firmanteCC? }`.
- `GET /api/actas/:id` devuelve `firmaRecibe` / `firmaEntrega` (`{ base64, firmanteNombre, firmanteCC, capturadaEn }` o `null`).

**Panel físico TOPAZ T-S460-HBS-R** (SDK SigWeb, integración en el frontend): el dispositivo tiene memoria interna y puede arrastrar el trazo de una firma anterior si no se limpia — el frontend debe llamar `ClearTablet()` antes de cada captura nueva.

**Firma remota** (`firma_remota_solicitudes`): un enlace + código de un solo uso para firmar desde el navegador sin el panel físico. **El envío es manual, fuera del sistema** — no hay integración con ninguna API de WhatsApp; el backend genera el enlace/código y el ADMIN los copia (o hace clic en un link `wa.me` ya armado) para mandarlos él mismo por WhatsApp, o por el canal que prefiera.

- `POST /api/actas/:id/firma-remota/solicitar` (ADMIN/SUPERADMIN) `{ tipo, destinatarioNombre?, destinatarioEmail?, destinatarioTelefono? }` (al menos uno de `destinatarioEmail`/`destinatarioTelefono`) — genera un código de 6 dígitos y un enlace `${FRONTEND_URL}/firmar/:token`, válidos por **24 horas**. Responde `{ link, codigo, waLink, expiraEn }` — `codigo` viaja en texto plano solo en esta respuesta (en la BD se guarda el hash), y `waLink` es un `https://wa.me/...` con el mensaje pre-armado, listo para abrir y enviar si se dio `destinatarioTelefono`. Si se dio `destinatarioEmail`, además se envía por correo (o se simula en el log si no hay SMTP) como canal adicional, no exclusivo. Crea una notificación.
- `POST /api/firma-remota/:token/validar` (público, rate-limited) `{ codigo }` — máximo 5 intentos por token; si es válido devuelve un `firmaSessionToken` de corta duración (10 min) junto con un resumen del acta para que la persona confirme que es la correcta antes de firmar.
- `POST /api/firma-remota/completar` (`Authorization: Bearer <firmaSessionToken>`) `{ firmaBase64 }` — guarda la firma (mismo mecanismo que `acta_firmas`, con `dispositivo = 'WEB_REMOTA'`), marca la solicitud como usada (no se puede reutilizar el enlace) y resuelve la notificación asociada.

---

## Auditoría (`audit_logs`)

La tabla `audit_logs` **ya existía en el esquema original pero nada le escribía nunca**. Ahora sí:

- `GET /api/audit-logs?page=&limit=&module=&userId=` (SUPERADMIN y ADMIN) — historial paginado, más reciente primero, con el nombre/correo de quién hizo la acción (join a `users`).
- Se registra automáticamente en: crear/actualizar/cerrar/cambiar estado de actas, firmar (panel TOPAZ), solicitar firma remota, crear/actualizar/eliminar usuarios, crear sedes, resolver solicitudes de cambio de contraseña, y editar configuración general. Un fallo al escribir el log nunca bloquea la acción real que lo originó (solo se registra en consola).
- No se audita el lado del firmante externo en firma remota (`/api/firma-remota/completar` es público, no hay un "admin" que auditar ahí).

---

## Notificaciones

Tabla `notifications`, pensada para que el frontend muestre una campanita persistente: una notificación **no desaparece sola** — solo cuando se descarta manualmente o cuando se resuelve la acción que la generó (ej. al resolver una solicitud de cambio de contraseña, o al completarse una firma remota).

- `GET /api/notifications` (autenticado) — devuelve las notificaciones `PENDIENTE` visibles para el rol del usuario (`target_role = NULL` = visibles para cualquiera, o coincide con su rol).
- `POST /api/notifications/:id/descartar` (autenticado) — la oculta sin resolver nada (el botón de la "x").

Hoy generan notificaciones: solicitudes de cambio de contraseña (visibles solo para `SUPERADMIN`) y eventos de firma remota (solicitada/completada, visibles para todos).

---

## Analítica

Todos los endpoints son `GET`, requieren solo estar autenticado (cualquier rol, incluido `LECTOR`):

| Endpoint | Devuelve |
|---|---|
| `/api/analytics/summary` | Totales de actas (incluye `BORRADOR`, ver nota abajo), usuarios activos, sedes/cargos/operadores |
| `/api/analytics/actas-by-estado` | Conteo agrupado por estado |
| `/api/analytics/actas-by-sede` | Conteo agrupado por sede |
| `/api/analytics/actas-por-mes?months=N` | Serie temporal de actas creadas |
| `/api/analytics/tiempo-cierre-promedio` | Promedio de días entre creación y cierre |
| `/api/analytics/equipos` | Distribución por marca de laptop/diadema/celular |
| `/api/analytics/usuarios-por-rol` | Conteo de usuarios por rol y estado activo |

> **Nota**: existe un tercer estado de acta, `BORRADOR`, presente en la base de datos y contemplado en el diseño original (ver diagrama de tablas más abajo), pero el código actual (`ActaDB.estado`, validaciones de `updateEstadoActa`) solo modela `ABIERTA | CERRADA`. `summary.actas.abiertas + summary.actas.cerradas` puede ser menor que `summary.actas.total` por esta razón. Pendiente decidir si `BORRADOR` se formaliza en todo el sistema.

---

## Configuración general (`app_settings`)

Tabla clave/valor genérica para datos que no deberían quedar quemados en el código ni requerir un redeploy para cambiar.

- `GET /api/settings/public` — sin autenticación, solo expone las claves marcadas `is_public` (hoy: `whatsappSistemas`, el contacto que se muestra en el login para pedir acceso).
- `GET /api/settings` / `PUT /api/settings/:key` (SUPERADMIN) — gestión completa.

---

## Importación histórica de actas

Contexto: existían ~925-935 actas de entrega en papel/Google Docs que había que migrar al sistema. **Ya se importaron 907 actas** (ver detalle abajo); queda pendiente la creación de usuarios para el personal de sistemas identificado en ellas.

**Herramientas** (en `src/scripts/`, no forman parte del servidor en ejecución):
- `parse-actas-pdf.cjs` — extrae el texto completo del PDF fuente (`src/data/Actas de entrega para actualizar.pdf`, no versionado, tiene datos personales reales) y lo segmenta en actas individuales. **Las actas no están alineadas una por página** — muchas terminan a mitad de página y la siguiente empieza justo después — por eso el script concatena todo el documento y corta usando como ancla el bloque `Fecha de devolución: ... / Recibido por: ...`, que aparece exactamente una vez por acta. Genera `src/data/actas-parsed.json` y `src/data/actas-parse-report.md` (reporte de validación).
- `import-actas.cjs` — lee `actas-parsed.json`, mapea `cargo`/`sede` de texto libre a los catálogos reales (`cargo_id`/`sede_id`) y hace la inserción real en una única transacción (todo o nada). Genera `src/data/actas-import-log.json`.

**Resultado de la importación ya ejecutada** (907 de 935 páginas del PDF; el conteo esperado era ~925, diferencia sin resolver):
- Mapeo de `cargo_id` (catálogo de solo 5 valores genéricos) por reglas de palabras clave sobre el texto libre — siempre se conserva el texto original completo en `cargo_especificacion`, el bucket es solo una categorización aproximada.
- Mapeo de `sede_id` por normalización + sinónimos conocidos contra las 31 sedes reales. **117 actas (13%) no tuvieron un match confiable** y quedaron con `sede_id = SEDE EXTERNA`, con el texto original de la sede preservado al inicio de `observaciones` (ej. `[SEDE ORIGINAL: CAMPESTRE]`) para no perder el dato.
- Los campos de marca de laptop/celular/diadema **no se separaron en catálogos** (`laptop_marca_id`, `diadema_marca_id` quedaron en `NULL`) — el texto de equipo y marca se guardó completo y legible en la columna `equipo`. Es una simplificación deliberada para esta primera carga; separarlo en catálogos reales de marcas es trabajo futuro.
- Nombre/Cargo faltantes en el origen (no error de parseo) corresponden en su mayoría a actas de equipos enviados a una sede/bodega sin persona asignada (ej. `Nombre: APARTADO`).
- El ranking de personas que firman como "Entregado por" (en `actas-parse-report.md`) es la base para identificar al personal de sistemas — quienes aparecen firmando en **10 o más actas** son casi con certeza personal de IT, no empleados normales entregando su propio equipo. **Pendiente crear sus cuentas `ADMIN`** (cédula real, contraseña temporal = cédula sin el último dígito, `must_change_password = true`) — bloqueado en sus correos corporativos, que aún no se han confirmado.

---

## Despliegue en producción

`docker-compose.prod.yml` (separado del de desarrollo):
- No monta el código fuente ni usa `npm run dev` — corre el build compilado (`CMD` del `Dockerfile`).
- Ni Postgres ni la API exponen puertos al exterior — solo el proxy.
- Servicio `proxy` (Caddy) en 80/443, HTTPS automático vía Let's Encrypt (`Caddyfile`, reemplazar `TU-DOMINIO.com` por el dominio real).

```bash
docker volume create actamanagerbackend_postgres_data   # una sola vez
docker compose -f docker-compose.prod.yml up -d --build
```

Requiere: un (sub)dominio con registro A apuntando a la IP del VPS, y los puertos 80/443 abiertos en el firewall (no hace falta abrir 4000 ni 5432).

**Pendiente**: backups automáticos de Postgres (hoy no existen).

---

## Migraciones

Los archivos en `migrations/` son SQL manuales, no hay un runner automático — se aplican a mano contra la base de datos.

| Archivo | Contenido | Estado |
|---|---|---|
| `001_migrate_users_to_system_users.sql` | Unificaría `users` + `system_users` en una sola tabla | **No aplicada** — choca con el modelo de dos tablas que usa el código actual. Señalada como riesgo conocido, pendiente de decisión propia. |
| `002_add_acta_firmas.sql` | Tabla `acta_firmas` (reemplaza una tabla residual de una integración Cloudinary ya eliminada del código) | Aplicada |
| `003_add_password_reset_and_settings.sql` | `users.must_change_password`, tabla `password_reset_requests`, tabla `app_settings` | Aplicada |
| `004_add_notifications_and_firma_remota.sql` | Tablas `notifications` y `firma_remota_solicitudes` | Aplicada |
| `005_add_firma_remota_telefono.sql` | `firma_remota_solicitudes.destinatario_telefono`, `destinatario_email` pasa a opcional | Aplicada |
| `006_extend_audit_logs.sql` | `audit_logs` gana `entidad_tipo`/`entidad_id`/`detalle` + índices | Aplicada |

---

## Estructura de la base de datos (resumen)

```text
sedes ──┐
        ├── system_users ── users (auth)
cargos ─┘        │
                  └── actas ── acta_firmas
                         └── celulares
laptops ── acta_equipos (genérico, hoy casi sin usar)
```

- `actas.estado`: `ABIERTA | CERRADA` en el código actual (existe además `BORRADOR` en datos reales, ver sección de Analítica).
- `actas.payload` (jsonb): columna presente en el esquema original pensada para contenido flexible, no usada por el código actual (los campos viven en columnas planas).

---

## Notas de arquitectura

- Sin ORM: todas las consultas son SQL directo vía `pg`.
- ESM + NodeNext: todo el código fuente vive en `src/`, los imports usan extensión `.js` aunque el archivo sea `.ts` (requisito de NodeNext). Node solo ejecuta lo que hay en `dist/` en producción.
- Swagger disponible en `/api/docs`.

---

## Roadmap / pendientes conocidos

- Confirmar y completar `GOOGLE_WORKSPACE_DOMAINS` con todos los dominios reales de la organización.
- Configurar SMTP real para que la firma remota envíe correos de verdad (hoy se simula en el log).
- Crear las cuentas `ADMIN` del personal de sistemas identificado en la importación — bloqueado en sus correos corporativos.
- Decidir qué hacer con `"viewer"` vs `"LECTOR"` en los datos existentes.
- Formalizar (o descartar) el estado `BORRADOR`.
- Revisar las 117 actas importadas con `sede_id = SEDE EXTERNA` (sede original preservada en `observaciones`) y las que quedaron con cargo/nombre en blanco.
- Separar marcas de laptop/celular/diadema en catálogos reales para las actas importadas (hoy quedan como texto libre en `equipo`).
- Diseñar un inventario real de equipos (hoy `laptops`/`acta_equipos` existen pero casi no se usan; no cubre celulares ni diademas como activos reusables).
- Backups automáticos de la base de datos en producción.
- CRUD real para catálogos (`sedes`, `cargos`, `operadores`, marcas) — hoy solo tienen lectura.

---

## Contacto

**Jorge Eduardo Muñoz Quintero**
*Desarrollador principal*
Eduard.munoz@comitedeestudiosmedicos.com | xeduark@gmail.com
