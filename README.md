# Acta Manager Backend

Backend para la generación y gestión de actas, construido con **Node.js + Express + TypeScript** usando módulos **ESM (NodeNext)**.

---

## Requisitos

- Node.js **v18+** (recomendado v20+)
- npm

---

## Instalación

Clonar el repositorio:

```bash
git clone <https://github.com/xeduark/cemManagerBackend.git>
cd cemManagerBackend
```

Instalar dependencias:

```bash
npm install
```

---

## Variables de entorno

Crear un archivo `.env` en la raíz:

```env
PORT=4000
```

---

## Estructura del proyecto

```text
actaManagerBackend/
│
├─ src/
│  ├─ index.ts
│  ├─ routes/
│  │  └─ acta.routes.ts
│  ├─ controllers/
│  │  └─ acta.controller.ts
│  ├─ services/
│  │  └─ acta.service.ts
│  └─ utils/
│     └─ helpers.ts
│
├─ dist/                # Se genera automáticamente
│
├─ .env
├─ package.json
├─ tsconfig.json
└─ README.md
```

## 📘 Documentación de la API (Swagger)

Este backend utiliza **Swagger (OpenAPI)** para documentar los endpoints y permitir pruebas desde el navegador.

---

### 📦 Dependencias instaladas

```bash
npm install swagger-ui-express swagger-jsdoc
npm install -D @types/swagger-jsdoc
```

---

### 📁 Configuración básica

Se configuró Swagger usando `swagger-jsdoc` y `swagger-ui-express` para generar documentación automáticamente a partir de comentarios en el código.

La documentación está disponible en:

```
http://localhost:4000/api/docs
```

---

### 🧩 Uso en el servidor

Swagger se monta como middleware de Express y expone una interfaz HTML interactiva.

Permite:
- Ver todos los endpoints
- Ver métodos HTTP
- Ver parámetros y respuestas
- Probar endpoints con **Try it out**

---

### ✍️ Cómo documentar un endpoint

Los endpoints se documentan usando comentarios especiales en las rutas.

Ejemplo:

```ts
/**
 * @swagger
 * /api/actas:
 *   get:
 *     summary: Obtener todas las actas
 *     tags: [Actas]
 *     responses:
 *       200:
 *         description: Lista de actas
 */
```

Swagger detecta estos comentarios y los muestra automáticamente en la UI.

---

### 🧪 Pruebas con Postman

Swagger permite copiar directamente los endpoints o exportar la colección para Postman, facilitando las pruebas del API.

---


---

## Scripts disponibles

### Desarrollo (sin generar dist)

```bash
npm run dev
```

Usa **ts-node-dev** para recargar automáticamente.

---

### Build (generar carpeta dist)

# Paso 7 – Instalación de dependencias para Base de Datos (PostgreSQL + Docker)

Este paso prepara el backend para conectarse a una base de datos PostgreSQL que será ejecutada dentro de Docker.

---

## 1. Requisitos previos

- Node.js instalado
- Docker instalado
- Proyecto backend en TypeScript funcionando (`npm run dev` o `npm run build`)

---

## 2. Instalación del driver de PostgreSQL

Desde la raíz del backend (`actaManagerBackend`):

```bash
npm install pg
```

### ¿Para qué sirve?
`pg` es el cliente oficial de PostgreSQL para Node.js y permite ejecutar consultas SQL desde el backend.

---

## 3. Tipos para TypeScript

Como el proyecto usa TypeScript, es obligatorio instalar los tipos:

```bash
npm install -D @types/pg
```

Esto evita errores de compilación y mejora el autocompletado.

---

## 4. Crear el archivo de conexión a la base de datos

📁 **src/db.ts**

```ts
import pkg from 'pg';
const { Pool } = pkg;

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
```

⚠️ **Importante**
- No usar `localhost`
- En Docker, el `host` debe ser el nombre del servicio (ej: `db`)

---

## 5. Variables de entorno necesarias

📁 **.env**

```env
PORT=4000

DB_HOST=
DB_PORT=
DB_NAME=
DB_USER=
DB_PASSWORD=
```

Estas variables serán usadas tanto por Docker como por el backend.

---

## 6. Probar la conexión a la base de datos

En `src/index.ts`, agregar temporalmente:

```ts
import { pool } from './db.js';

pool.query('SELECT NOW()')
  .then(() => console.log('✅ DB conectada correctamente'))
  .catch(err => console.error('❌ Error conectando DB', err));
```

Si aparece el mensaje `DB conectada correctamente`, la configuración es correcta.

---

## 7. Buenas prácticas (Docker mindset)

- ❌ No usar `localhost` para la base de datos
- ❌ No conectar a DB sin Docker
- ❌ No hardcodear credenciales
- ✅ Usar variables de entorno
- ✅ Usar `docker-compose` para la red interna

---

## 8. Resultado esperado

Al finalizar este paso, el proyecto:

- Tiene instalado el cliente PostgreSQL
- Puede conectarse a una DB usando variables de entorno
- Está listo para ser dockerizado completamente

---

## Próximo paso

👉 Crear y levantar los contenedores con `docker-compose`  
👉 Definir la tabla `actas` en PostgreSQL



⚠️ **Ejecutar**

- Tener docker en **Engine Running**
- el archivo .env y el docker -composer.yml deben tener las mismas credenciales.

- ejecutar estos comandos para lanzar el backend con docker.
- detener docker
```bash
docker compose down
```
```bash
docker compose up --build
```

---
- ejecutar estos comandos para conocer tablas y nombre del docker con consola.

```bash
docker ps -a
```

---
```bash
docker exec -it NOMBRE DEL DOCKER psql -U USUARIO -d BASE DE DATOS
```

---

Cuando salga acta_manager-#
```bash
\dt
```

---


⚠️ **Este paso es obligatorio antes de usar `npm start`**

```bash
npm run build
```

Esto ejecuta:

```bash
tsc
```

Y genera:

```text
dist/
├─ index.js
├─ routes/
├─ controllers/
├─ services/
└─ utils/
```

---

### Producción

Después del build:

```bash
npm start
```

Ejecuta:

```bash
node dist/index.js
```

---

## TypeScript + NodeNext (importante)

Este proyecto usa:

```json
{
  "module": "NodeNext",
  "moduleResolution": "NodeNext"
}
```

Reglas clave:
- Todo el código fuente vive en `src`
- **Nunca** se importa `.ts` en runtime
- Node ejecuta **solo lo que está en `dist`**
- Siempre correr `npm run build` antes de `npm start`

---

## API Endpoints

### Crear acta

```http
POST /api/actas
```

Body (ejemplo):

```json
{
  "nombre": "Juan Pérez",
  "cargo": "Ingeniero",
  "sede": "Bogotá",
  "equipo": "Laptop",
  "marca": "Dell"
}
```

---

### Listar actas

```http
GET /api/actas
```

---

### Obtener acta por número

```http
GET /api/actas/:actaNumber
```

---

## Flujo recomendado

```bash
npm install
npm run dev        # desarrollo
npm run build      # generar dist
npm start          # producción
```

---

## Notas finales

- La carpeta `dist` **no se versiona**
- TypeScript solo vive en `src`
- El backend está listo para integrarse con frontend React/Vite

---
## Notas adicionales

- Ver la `db`
```bash
 docker exec -it acta_db psql -U adminCEM2026 -d acta_manager
 \d nombre_de_tu_tabla
 ```
- TypeScript solo vive en `src`
- El backend está listo para integrarse con frontend React/Vite

---

# Arquitectura de Base de Datos – acta_manager

## Descripción

La base de datos **acta_manager** está diseñada para gestionar actas institucionales, usuarios del sistema, cargos organizacionales, áreas y sedes.

El sistema utiliza **PostgreSQL** y sigue una estructura relacional normalizada combinada con almacenamiento flexible mediante **JSONB** para el contenido de las actas.

---

# Diagrama General de Relaciones

```text
areas
│
└── cargos
│
└── system_users
│
├── sede_id
│
└── actas (autor / creador)

sedes
│
└── system_users
```


---

# Tablas del Sistema

## 1. sedes

Almacena las sedes institucionales donde se encuentran los usuarios.

| Campo | Tipo | Descripción |
|-----|-----|-------------|
| id | integer (PK) | Identificador único |
| nombre | varchar(150) | Nombre de la sede |
| direccion | text | Dirección física |
| ciudad | varchar(100) | Ciudad |
| codigo | varchar(10) | Código interno |
| activo | boolean | Estado de la sede |
| created_at | timestamp | Fecha de creación |

Relación:


---

## 2. areas

Define las áreas o departamentos dentro de la organización.

| Campo | Tipo | Descripción |
|-----|-----|-------------|
| id | integer (PK) | Identificador |
| nombre | varchar(100) | Nombre del área |
| activo | boolean | Estado |


 codigo |      nombre
--------+------------------
 4110   | Consulta Externa
 4111   | Proyectos
 4115   | Hospitalización
 5105   | Administración
Relación:


---

## 3. cargos

Representa los cargos organizacionales asociados a un área.

| Campo | Tipo | Descripción |
|-----|-----|-------------|
| id | integer (PK) | Identificador |
| nombre | varchar(100) | Nombre del cargo |
| activo | boolean | Estado |
| area_id | integer (FK) | Área a la que pertenece |

Relación:


---

## 4. system_users

Contiene los usuarios registrados en el sistema.

| Campo | Tipo | Descripción |
|-----|-----|-------------|
| id | integer (PK) | Identificador |
| nombre | varchar(150) | Nombre del usuario |
| dni | varchar(20) | Documento único |
| activo | boolean | Estado del usuario |
| created_at | timestamp | Fecha de creación |
| sede_id | integer (FK) | Sede del usuario |
| cargo_id | integer | Cargo del usuario |

Relaciones:

---

## 5. actas

Tabla principal donde se almacenan las actas del sistema.

| Campo | Tipo | Descripción |
|-----|-----|-------------|
| id | integer (PK) | Identificador |
| acta_number | integer | Número único del acta |
| payload | jsonb | Contenido del acta |
| estado | varchar(20) | Estado del acta (BORRADOR / CERRADA) |
| created_at | timestamp | Fecha de creación |
| updated_at | timestamp | Fecha de actualización |
| closed_at | timestamp | Fecha de cierre |

Índices:


---

# Uso de JSONB en actas

El campo **payload** permite almacenar información estructurada flexible dentro del acta.

Ejemplo:

```json
{
  "titulo": "Acta reunión administrativa",
  "fecha": "2026-02-10",
  "asistentes": [
    "Director",
    "Secretaria"
  ],
  "temas": [
    "Presupuesto",
    "Planeación académica"
  ]
}

#Posibles Mejoras Futuras

-Relación entre actas y usuarios (autor del acta)

-Índices adicionales para búsquedas en JSONB

-Sistema de auditoría de cambios

-Control de versiones de actas

-Sistema de firmas digitales

✅ Backend Acta Manager listo para escalar
