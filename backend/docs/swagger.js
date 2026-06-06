import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sahel AgriConnect + AfriYield Exchange API',
      version: '2.0.0',
      description: `
REST API for the Sahel AgriConnect platform and AfriYield Exchange.

**Authentication:**
- Admin routes require a Bearer JWT obtained from POST /api/auth/login
- Investor routes require a Bearer JWT obtained from POST /api/investors/login
- Public routes require no token

**Base URL (production):** https://your-backend.onrender.com
      `,
      contact: { name: 'Sahel AgriConnect', email: 'support@woneapp.com' },
    },
    servers: [{ url: '/api', description: 'Current server' }],
    components: {
      securitySchemes: {
        AdminBearer: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Admin JWT from POST /auth/login',
        },
        InvestorBearer: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Investor JWT from POST /investors/login',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Error message' },
          },
        },
        Farmer: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            nom: { type: 'string', example: 'Amadou Diallo' },
            telephone: { type: 'string', example: '+22376543210' },
            email: { type: 'string', example: 'amadou@example.com' },
            region: { type: 'string', example: 'Sikasso' },
            country: { type: 'string', example: 'Mali' },
            cultures: { type: 'array', items: { type: 'string' }, example: ['Riz', 'Mil'] },
            superficie: { type: 'number', example: 12 },
            statut: { type: 'string', enum: ['Actif', 'En attente', 'Inactif'] },
            lienCooperative: { type: 'string', enum: ['Oui', 'Non'] },
            nomCooperative: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Investor: {
          type: 'object',
          properties: {
            email: { type: 'string' },
            fullName: { type: 'string' },
            status: { type: 'string' },
            investmentTrack: { type: 'string', enum: ['Track A', 'Track B', 'Both'] },
            commodityInterest: { type: 'string', enum: ['Shea Butter', 'Sesame', 'Both'] },
          },
        },
        Investment: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            investorEmail: { type: 'string' },
            amountDeployed: { type: 'number' },
            currency: { type: 'string', example: 'USD' },
            expectedROIPercent: { type: 'number' },
            deploymentDate: { type: 'string', format: 'date' },
            payoutSchedule: { type: 'array', items: { type: 'object' } },
          },
        },
        Training: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            titre: { type: 'string' },
            description: { type: 'string' },
            date: { type: 'string', format: 'date' },
            region: { type: 'string' },
            country: { type: 'string' },
            capacite: { type: 'number' },
            inscrits: { type: 'number' },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            recipientName: { type: 'string' },
            recipientPhone: { type: 'string' },
            message: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'sent', 'failed'] },
            source: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    paths: {
      '/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: 'Admin login',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', example: 'support@woneapp.com' },
                    password: { type: 'string', example: '••••••••' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'JWT token + admin profile',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      token: { type: 'string' },
                      admin: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          email: { type: 'string' },
                          name: { type: 'string' },
                          role: { type: 'string' },
                          country: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
            401: { description: 'Invalid credentials' },
          },
        },
      },
      '/auth/verify': {
        get: {
          tags: ['Authentication'],
          summary: 'Verify admin token',
          security: [{ AdminBearer: [] }],
          responses: {
            200: { description: 'Token is valid' },
            401: { description: 'Token invalid or expired' },
          },
        },
      },
      '/farmers': {
        post: {
          tags: ['Farmers'],
          summary: 'Register a new farmer (public)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: [
                    'nom',
                    'telephone',
                    'region',
                    'country',
                    'cultures',
                    'superficie',
                    'typeExploitation',
                    'accesElectricite',
                    'accesStockage',
                    'latitude',
                    'longitude',
                  ],
                  properties: {
                    nom: { type: 'string', example: 'Amadou Diallo' },
                    telephone: { type: 'string', example: '+22376543210' },
                    email: { type: 'string' },
                    region: { type: 'string', example: 'Sikasso' },
                    country: { type: 'string', example: 'Mali' },
                    cultures: { type: 'array', items: { type: 'string' }, example: ['Riz'] },
                    superficie: { type: 'number', example: 12 },
                    typeExploitation: { type: 'string', enum: ['Familiale', 'Commerciale/Indépendante'] },
                    accesElectricite: { type: 'string', enum: ['Oui', 'Partiel', 'Non'] },
                    accesStockage: { type: 'string', enum: ['Oui', 'Non'] },
                    latitude: { type: 'string', example: '12.6392' },
                    longitude: { type: 'string', example: '-8.0029' },
                    lienCooperative: { type: 'string', enum: ['Oui', 'Non'] },
                    nomCooperative: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Farmer registered',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      farmer: { $ref: '#/components/schemas/Farmer' },
                    },
                  },
                },
              },
            },
            400: { description: 'Validation error' },
          },
        },
        get: {
          tags: ['Farmers'],
          summary: 'List farmers (admin) or self-lookup by email/phone (public)',
          parameters: [
            { name: 'email', in: 'query', schema: { type: 'string' }, description: 'Public self-lookup by email' },
            { name: 'phone', in: 'query', schema: { type: 'string' }, description: 'Public self-lookup by phone' },
            { name: 'region', in: 'query', schema: { type: 'string' } },
            { name: 'statut', in: 'query', schema: { type: 'string', enum: ['Actif', 'En attente', 'Inactif'] } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
          ],
          security: [{ AdminBearer: [] }, {}],
          responses: {
            200: { description: 'Farmer list or single farmer object' },
            401: { description: 'Token required for admin listing' },
          },
        },
      },
      '/farmers/stats/summary': {
        get: {
          tags: ['Farmers'],
          summary: 'Farmer statistics summary (admin)',
          security: [{ AdminBearer: [] }],
          responses: {
            200: { description: 'Stats: total, actifs, enAttente, superficieTotale' },
          },
        },
      },
      '/investors/login': {
        post: {
          tags: ['Investors'],
          summary: 'Investor portal login — returns a 24h JWT',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email'],
                  properties: { email: { type: 'string', example: 'investor@example.com' } },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'JWT token + investor profile',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      token: { type: 'string' },
                      investor: { $ref: '#/components/schemas/Investor' },
                    },
                  },
                },
              },
            },
            404: { description: 'Investor not found' },
          },
        },
      },
      '/investors/register': {
        post: {
          tags: ['Investors'],
          summary: 'Register a new investor (public)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['fullName', 'email', 'investmentTrack', 'investmentRange'],
                  properties: {
                    fullName: { type: 'string' },
                    email: { type: 'string' },
                    phone: { type: 'string' },
                    countryOfResidence: { type: 'string' },
                    investmentTrack: { type: 'string', enum: ['Track A', 'Track B', 'Both'] },
                    investmentRange: { type: 'string', example: '$10,000 - $50,000' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Registration received' },
            409: { description: 'Email already registered' },
          },
        },
      },
      '/investments/investor/{email}': {
        get: {
          tags: ['Investments'],
          summary: 'Get investments for an investor (investor auth)',
          security: [{ InvestorBearer: [] }],
          parameters: [{ name: 'email', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: {
              description: 'Array of investment records',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      investments: { type: 'array', items: { $ref: '#/components/schemas/Investment' } },
                    },
                  },
                },
              },
            },
            401: { description: 'Investor token required' },
          },
        },
      },
      '/trainings': {
        get: {
          tags: ['Trainings'],
          summary: 'List available training sessions (public)',
          parameters: [
            { name: 'region', in: 'query', schema: { type: 'string' } },
            { name: 'country', in: 'query', schema: { type: 'string' } },
          ],
          responses: {
            200: {
              description: 'Array of trainings',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      trainings: { type: 'array', items: { $ref: '#/components/schemas/Training' } },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Trainings'],
          summary: 'Schedule a new training (admin)',
          security: [{ AdminBearer: [] }],
          responses: {
            201: { description: 'Training created' },
            401: { description: 'Admin token required' },
          },
        },
      },
      '/trainings/{id}/register': {
        post: {
          tags: ['Trainings'],
          summary: 'Register a farmer for a training session (public)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['farmerId'],
                  properties: {
                    farmerId: { type: 'string' },
                    name: { type: 'string' },
                    phone: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Registered successfully' },
            400: { description: 'Session full or already registered' },
          },
        },
      },
      '/notifications': {
        get: {
          tags: ['Notifications'],
          summary: 'List pending notifications (admin)',
          security: [{ AdminBearer: [] }],
          responses: {
            200: {
              description: 'Array of pending notifications',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      notifications: { type: 'array', items: { $ref: '#/components/schemas/Notification' } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/notifications/{id}/send': {
        post: {
          tags: ['Notifications'],
          summary: 'Dispatch a single notification via SMS (admin)',
          security: [{ AdminBearer: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'SMS sent or already sent' },
            404: { description: 'Notification not found' },
          },
        },
      },
      '/notifications/send-all': {
        post: {
          tags: ['Notifications'],
          summary: 'Bulk dispatch all pending notifications (admin)',
          security: [{ AdminBearer: [] }],
          responses: { 200: { description: 'Result: { sent, failed, total }' } },
        },
      },
      '/health': {
        get: {
          tags: ['System'],
          summary: 'Health check — no auth required',
          responses: {
            200: {
              description: 'Server is up',
              content: {
                'application/json': {
                  schema: { type: 'object', properties: { status: { type: 'string', example: 'ok' } } },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);

