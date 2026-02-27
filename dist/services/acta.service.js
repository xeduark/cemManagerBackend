export const generateActa = (data) => {
    const actaNumber = Math.floor(Math.random() * 10000);
    const fecha = new Date().toISOString().split('T')[0];
    return {
        actaNumber,
        fecha,
        nombre: data.nombre || '',
        cargo: data.cargo || '',
        sede: data.sede || '',
        equipo: data.equipo || '',
        marca: data.marca || '',
        accesorios: data.accesorios || '',
        estado: data.estado || '',
        observaciones: data.observaciones || '',
        recibidoPorNombre: data.recibidoPorNombre || '',
        recibidoPorCC: data.recibidoPorCC || '',
        entregadoPorNombre: data.entregadoPorNombre || '',
        entregadoPorCC: data.entregadoPorCC || '',
        vistoBueno: data.vistoBueno || '',
    };
};
