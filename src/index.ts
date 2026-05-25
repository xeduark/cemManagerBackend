import express, { Application } from "express";
import cors from "cors";
import dotenv from "dotenv";
import actaRoutes from "./routes/acta.routes.js";
import userRoutes from "./routes/user.routes.js";
import cargosRoutes from "./routes/jobTitle.routes.js";
import sedesRoutes from "./routes/sedes.routes.js";
import operadorRoutes from "./routes/operador.routes.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./docs/swagger.js";
import listEndpoints from "express-list-endpoints";

//import para pruebas de bd
import { pool } from "./db.js";

dotenv.config();

//const app: Application = express();
export const app: Application = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use("/api/actas", actaRoutes); // Rutas para actas
app.use("/api/users", userRoutes); // Rutas para usuarios
app.use("/api/cargos", cargosRoutes); // Rutas para cargos
app.use("/api/sedes", sedesRoutes); // Rutas para sedes
app.use("/api/operadores", operadorRoutes); // Rutas para operadores
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec)); // Documentación Swagger en /api/docs

app.get("/", (_req, res) => {
  res.send("Backend Acta Manager funcionando ✅");
});

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log(listEndpoints(app));
  });
}

if (process.env.NODE_ENV !== "test") {
  pool
    .query("SELECT NOW()")
    .then(() => console.log("✅ DB conectada correctamente"))
    .catch((err) => console.error("❌ Error conectando DB", err));
}
