import { generateActa } from '../services/acta.service.js';
// Almacenamiento temporal
const actas = [];
export const createActa = (req, res) => {
    const data = req.body;
    const acta = generateActa(data);
    actas.push(acta);
    res.status(201).json(acta);
};
export const getActas = (_req, res) => {
    res.json(actas);
};
export const getActaByNumber = (req, res) => {
    const actaNumber = Number(req.params.actaNumber);
    const acta = actas.find(a => a.actaNumber === actaNumber);
    if (!acta)
        return res.status(404).json({ message: 'Acta no encontrada' });
    res.json(acta);
};
