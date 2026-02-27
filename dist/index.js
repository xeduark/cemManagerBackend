import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import actaRoutes from './routes/acta.routes.js';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;
app.use(cors());
app.use(express.json());
app.use('/api/actas', actaRoutes);
app.get('/', (_req, res) => {
    res.send('Backend Acta Manager funcionando ✅');
});
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
