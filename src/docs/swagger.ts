import swaggerJsdoc from 'swagger-jsdoc';

export const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Acta Manager API',
      version: '1.0.0',
      description: 'API para la gestión de actas del CEM',
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Servidor local',
      },
    ],
  },
  apis: ['src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
