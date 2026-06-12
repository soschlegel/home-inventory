const spec = {
  openapi: '3.0.3',
  info: {
    title: 'Home Inventory API',
    version: '1.0.0',
    description:
      'REST API für die Home-Inventory-App. Alle Endpunkte außer `/api/health`, `/api/auth/login`, `/api/auth/register` und `/api/auth/refresh` erfordern einen gültigen Bearer-Token.\n\n' +
      '**Rollen:**\n- `EDITOR` – kann alles lesen und schreiben\n- `VIEWER` – kann nur lesen (GET)',
  },
  servers: [{ url: '/api', description: 'Aktueller Server' }],
  tags: [
    { name: 'Auth', description: 'Registrierung, Login, Token-Refresh' },
    { name: 'Users', description: 'Benutzerverwaltung (nur EDITOR)' },
    { name: 'Rooms', description: 'Räume im Haus' },
    { name: 'Locations', description: 'Aufbewahrungsorte / Container' },
    { name: 'Items', description: 'Gegenstände' },
    { name: 'Tags', description: 'Tags auf Gegenständen' },
    { name: 'ContainerTypes', description: 'Typen von Aufbewahrungscontainern' },
    { name: 'Lendings', description: 'Ausleihverwaltung' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Access-Token aus `/api/auth/login` oder `/api/auth/refresh`',
      },
    },
    schemas: {
      UserRole: { type: 'string', enum: ['EDITOR', 'VIEWER'] },
      ItemCondition: { type: 'string', enum: ['NEW', 'GOOD', 'WORN', 'BROKEN'] },

      Error: {
        type: 'object',
        required: ['error'],
        properties: {
          error: { type: 'string', example: 'Nicht gefunden' },
          details: { type: 'array', items: { type: 'object' } },
        },
      },

      AuthResponse: {
        type: 'object',
        required: ['user', 'accessToken', 'refreshToken'],
        properties: {
          user: { $ref: '#/components/schemas/User' },
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
        },
      },

      User: {
        type: 'object',
        required: ['id', 'email', 'role'],
        properties: {
          id: { type: 'string', example: 'cm0abc123' },
          email: { type: 'string', format: 'email', example: 'test@home.local' },
          name: { type: 'string', nullable: true, example: 'Max Mustermann' },
          role: { $ref: '#/components/schemas/UserRole' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },

      Tag: {
        type: 'object',
        required: ['id', 'name'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string', example: 'Elektronik' },
        },
      },

      TagWithCount: {
        allOf: [
          { $ref: '#/components/schemas/Tag' },
          {
            type: 'object',
            properties: {
              _count: {
                type: 'object',
                properties: { items: { type: 'integer' } },
              },
            },
          },
        ],
      },

      ContainerType: {
        type: 'object',
        required: ['id', 'name'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string', example: 'Regal' },
          icon: { type: 'string', nullable: true, example: '📦' },
          color: { type: 'string', nullable: true, example: '#3B82F6' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },

      ContainerTypeWithCount: {
        allOf: [
          { $ref: '#/components/schemas/ContainerType' },
          {
            type: 'object',
            properties: {
              _count: {
                type: 'object',
                properties: { locations: { type: 'integer' } },
              },
            },
          },
        ],
      },

      Room: {
        type: 'object',
        required: ['id', 'name'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string', example: 'Wohnzimmer' },
          description: { type: 'string', nullable: true },
          icon: { type: 'string', nullable: true, example: '🛋️' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },

      RoomWithCount: {
        allOf: [
          { $ref: '#/components/schemas/Room' },
          {
            type: 'object',
            properties: {
              _count: {
                type: 'object',
                properties: { locations: { type: 'integer' } },
              },
            },
          },
        ],
      },

      LocationRef: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      },

      Location: {
        type: 'object',
        required: ['id', 'name', 'roomId'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string', example: 'Regal links' },
          description: { type: 'string', nullable: true },
          roomId: { type: 'string' },
          containerTypeId: { type: 'string', nullable: true },
          parentId: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },

      LocationWithChildren: {
        allOf: [
          { $ref: '#/components/schemas/Location' },
          {
            type: 'object',
            properties: {
              children: {
                type: 'array',
                items: {
                  allOf: [
                    { $ref: '#/components/schemas/Location' },
                    {
                      type: 'object',
                      properties: {
                        _count: {
                          type: 'object',
                          properties: { items: { type: 'integer' } },
                        },
                      },
                    },
                  ],
                },
              },
              _count: {
                type: 'object',
                properties: { items: { type: 'integer' } },
              },
            },
          },
        ],
      },

      ItemTag: {
        type: 'object',
        properties: {
          tag: { $ref: '#/components/schemas/Tag' },
        },
      },

      Item: {
        type: 'object',
        required: ['id', 'name', 'quantity', 'locationId'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string', example: 'Hammer' },
          description: { type: 'string', nullable: true },
          quantity: { type: 'number', example: 1 },
          unit: { type: 'string', nullable: true, example: 'Stück' },
          minQuantity: { type: 'number', nullable: true },
          condition: { $ref: '#/components/schemas/ItemCondition', nullable: true },
          imageUrl: { type: 'string', nullable: true },
          purchaseUrl: { type: 'string', nullable: true },
          purchasePrice: { type: 'number', nullable: true },
          purchaseDate: { type: 'string', format: 'date-time', nullable: true },
          warrantyUntil: { type: 'string', format: 'date-time', nullable: true },
          serialNumber: { type: 'string', nullable: true },
          barcode: { type: 'string', nullable: true },
          locationId: { type: 'string' },
          tags: { type: 'array', items: { $ref: '#/components/schemas/ItemTag' } },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },

      ItemWithDetails: {
        allOf: [
          { $ref: '#/components/schemas/Item' },
          {
            type: 'object',
            properties: {
              location: {
                allOf: [
                  { $ref: '#/components/schemas/Location' },
                  {
                    type: 'object',
                    properties: {
                      room: { $ref: '#/components/schemas/LocationRef' },
                      parent: { $ref: '#/components/schemas/LocationRef', nullable: true },
                    },
                  },
                ],
              },
              lendings: {
                type: 'array',
                items: { $ref: '#/components/schemas/Lending' },
              },
            },
          },
        ],
      },

      Lending: {
        type: 'object',
        required: ['id', 'itemId', 'lentTo', 'lentAt'],
        properties: {
          id: { type: 'string' },
          itemId: { type: 'string' },
          lentTo: { type: 'string', example: 'Klaus Müller' },
          lentAt: { type: 'string', format: 'date-time' },
          returnedAt: { type: 'string', format: 'date-time', nullable: true },
          note: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },

      LendingWithItem: {
        allOf: [
          { $ref: '#/components/schemas/Lending' },
          {
            type: 'object',
            properties: {
              item: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  imageUrl: { type: 'string', nullable: true },
                  location: {
                    allOf: [
                      { $ref: '#/components/schemas/Location' },
                      {
                        type: 'object',
                        properties: {
                          room: { $ref: '#/components/schemas/LocationRef' },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        ],
      },
    },
  },
  security: [{ BearerAuth: [] }],
  paths: {
    '/health': {
      get: {
        tags: ['Auth'],
        summary: 'Health-Check',
        security: [],
        responses: {
          200: {
            description: 'Server läuft',
            content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', example: 'ok' } } } } },
          },
        },
      },
    },

    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Neuen Account registrieren',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  name: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Account erstellt',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
          },
          400: { description: 'Validierungsfehler', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          409: { description: 'E-Mail bereits registriert', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Einloggen und Tokens erhalten',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login erfolgreich',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
          },
          400: { description: 'Validierungsfehler', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Falsche Zugangsdaten', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Neuen Access-Token mit Refresh-Token holen',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: { refreshToken: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Neuer Access-Token',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { accessToken: { type: 'string' } },
                },
              },
            },
          },
          400: { description: 'Fehlender oder ungültiger Token', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Nutzer nicht mehr vorhanden', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/users': {
      get: {
        tags: ['Users'],
        summary: 'Alle Nutzer auflisten',
        description: 'Nur für EDITOR.',
        responses: {
          200: {
            description: 'Liste aller Nutzer',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/User' } } } },
          },
          401: { description: 'Nicht authentifiziert' },
          403: { description: 'Nur EDITOR erlaubt' },
        },
      },
      post: {
        tags: ['Users'],
        summary: 'Neuen Nutzer anlegen',
        description: 'Nur für EDITOR.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  name: { type: 'string' },
                  role: { $ref: '#/components/schemas/UserRole', default: 'VIEWER' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Nutzer erstellt', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          400: { description: 'Validierungsfehler' },
          403: { description: 'Nur EDITOR erlaubt' },
          409: { description: 'E-Mail bereits vergeben' },
        },
      },
    },

    '/users/{id}/role': {
      put: {
        tags: ['Users'],
        summary: 'Rolle eines Nutzers ändern',
        description: 'Nur für EDITOR.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['role'],
                properties: { role: { $ref: '#/components/schemas/UserRole' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Rolle geändert', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          403: { description: 'Nur EDITOR erlaubt' },
          404: { description: 'Nutzer nicht gefunden' },
        },
      },
    },

    '/users/{id}': {
      delete: {
        tags: ['Users'],
        summary: 'Nutzer löschen',
        description: 'Nur für EDITOR. Eigener Account kann nicht gelöscht werden.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          204: { description: 'Gelöscht' },
          400: { description: 'Eigener Account kann nicht gelöscht werden' },
          403: { description: 'Nur EDITOR erlaubt' },
          404: { description: 'Nutzer nicht gefunden' },
        },
      },
    },

    '/rooms': {
      get: {
        tags: ['Rooms'],
        summary: 'Alle Räume auflisten',
        responses: {
          200: {
            description: 'Liste aller Räume mit Location-Anzahl',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/RoomWithCount' } } } },
          },
          401: { description: 'Nicht authentifiziert' },
        },
      },
      post: {
        tags: ['Rooms'],
        summary: 'Neuen Raum anlegen',
        description: 'Nur für EDITOR.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', maxLength: 100 },
                  description: { type: 'string' },
                  icon: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Raum erstellt', content: { 'application/json': { schema: { $ref: '#/components/schemas/Room' } } } },
          400: { description: 'Validierungsfehler' },
          403: { description: 'Nur EDITOR erlaubt' },
        },
      },
    },

    '/rooms/{id}': {
      get: {
        tags: ['Rooms'],
        summary: 'Einzelnen Raum mit Locations abrufen',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Raum mit Top-Level-Locations',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/Room' },
                    {
                      type: 'object',
                      properties: {
                        locations: { type: 'array', items: { $ref: '#/components/schemas/LocationWithChildren' } },
                      },
                    },
                  ],
                },
              },
            },
          },
          404: { description: 'Raum nicht gefunden' },
        },
      },
      put: {
        tags: ['Rooms'],
        summary: 'Raum bearbeiten',
        description: 'Nur für EDITOR.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', maxLength: 100 },
                  description: { type: 'string' },
                  icon: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Raum aktualisiert', content: { 'application/json': { schema: { $ref: '#/components/schemas/Room' } } } },
          403: { description: 'Nur EDITOR erlaubt' },
          404: { description: 'Raum nicht gefunden' },
        },
      },
      delete: {
        tags: ['Rooms'],
        summary: 'Raum löschen (inkl. aller Locations & Items)',
        description: 'Nur für EDITOR. Cascade-Delete.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          204: { description: 'Gelöscht' },
          403: { description: 'Nur EDITOR erlaubt' },
          404: { description: 'Raum nicht gefunden' },
        },
      },
    },

    '/rooms/{roomId}/locations': {
      get: {
        tags: ['Rooms'],
        summary: 'Top-Level-Locations eines Raumes abrufen',
        parameters: [{ name: 'roomId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Locations (ohne Parent) mit Kind-Locations',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/LocationWithChildren' } } } },
          },
          404: { description: 'Raum nicht gefunden' },
        },
      },
      post: {
        tags: ['Rooms'],
        summary: 'Neue Location in einem Raum anlegen',
        description: 'Nur für EDITOR.',
        parameters: [{ name: 'roomId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', maxLength: 100 },
                  description: { type: 'string' },
                  containerTypeId: { type: 'string' },
                  parentId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Location erstellt', content: { 'application/json': { schema: { $ref: '#/components/schemas/Location' } } } },
          400: { description: 'Validierungsfehler' },
          403: { description: 'Nur EDITOR erlaubt' },
          404: { description: 'Raum nicht gefunden' },
        },
      },
    },

    '/locations/{id}': {
      get: {
        tags: ['Locations'],
        summary: 'Location mit Inhalt abrufen',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Location mit Raum, Eltern, Kind-Locations und Items',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/Location' },
                    {
                      type: 'object',
                      properties: {
                        room: { $ref: '#/components/schemas/LocationRef' },
                        parent: { $ref: '#/components/schemas/LocationRef', nullable: true },
                        children: { type: 'array', items: { $ref: '#/components/schemas/LocationWithChildren' } },
                        items: { type: 'array', items: { $ref: '#/components/schemas/Item' } },
                      },
                    },
                  ],
                },
              },
            },
          },
          404: { description: 'Location nicht gefunden' },
        },
      },
      put: {
        tags: ['Locations'],
        summary: 'Location bearbeiten',
        description: 'Nur für EDITOR.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', maxLength: 100 },
                  description: { type: 'string' },
                  containerTypeId: { type: 'string' },
                  parentId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Location aktualisiert', content: { 'application/json': { schema: { $ref: '#/components/schemas/Location' } } } },
          403: { description: 'Nur EDITOR erlaubt' },
          404: { description: 'Location nicht gefunden' },
        },
      },
      delete: {
        tags: ['Locations'],
        summary: 'Location löschen (inkl. aller Items)',
        description: 'Nur für EDITOR. Cascade-Delete.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          204: { description: 'Gelöscht' },
          403: { description: 'Nur EDITOR erlaubt' },
          404: { description: 'Location nicht gefunden' },
        },
      },
    },

    '/locations/{locationId}/items': {
      get: {
        tags: ['Locations'],
        summary: 'Alle Items einer Location abrufen',
        parameters: [{ name: 'locationId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Liste der Items mit Tags',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Item' } } } },
          },
          404: { description: 'Location nicht gefunden' },
        },
      },
      post: {
        tags: ['Locations'],
        summary: 'Neues Item in einer Location anlegen',
        description: 'Nur für EDITOR.',
        parameters: [{ name: 'locationId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', maxLength: 200 },
                  description: { type: 'string' },
                  quantity: { type: 'number', minimum: 0, default: 1 },
                  unit: { type: 'string' },
                  minQuantity: { type: 'number', minimum: 0 },
                  condition: { $ref: '#/components/schemas/ItemCondition' },
                  purchaseUrl: { type: 'string', format: 'uri' },
                  purchasePrice: { type: 'number', minimum: 0 },
                  purchaseDate: { type: 'string', format: 'date-time' },
                  warrantyUntil: { type: 'string', format: 'date-time' },
                  serialNumber: { type: 'string' },
                  barcode: { type: 'string' },
                  tags: { type: 'array', items: { type: 'string' }, description: 'Tag-Namen (werden angelegt falls nicht vorhanden)' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Item erstellt', content: { 'application/json': { schema: { $ref: '#/components/schemas/Item' } } } },
          400: { description: 'Validierungsfehler' },
          403: { description: 'Nur EDITOR erlaubt' },
          404: { description: 'Location nicht gefunden' },
        },
      },
    },

    '/items/search': {
      get: {
        tags: ['Items'],
        summary: 'Items suchen',
        description: 'Sucht in Name, Beschreibung, Seriennummer und Barcode (max. 50 Treffer).',
        parameters: [{ name: 'q', in: 'query', required: true, schema: { type: 'string', minLength: 1 } }],
        responses: {
          200: {
            description: 'Suchergebnisse mit Location-Kontext',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/ItemWithDetails' } } } },
          },
          400: { description: 'Suchbegriff fehlt' },
        },
      },
    },

    '/items/low-stock': {
      get: {
        tags: ['Items'],
        summary: 'Items unter Mindestbestand',
        description: 'Gibt alle Items zurück bei denen `quantity < minQuantity`.',
        responses: {
          200: {
            description: 'Items mit Location-Kontext',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/ItemWithDetails' } } } },
          },
        },
      },
    },

    '/items/{id}': {
      get: {
        tags: ['Items'],
        summary: 'Einzelnes Item abrufen',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Item mit Tags, Ausleihhistorie und Location',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ItemWithDetails' } } },
          },
          404: { description: 'Item nicht gefunden' },
        },
      },
      put: {
        tags: ['Items'],
        summary: 'Item bearbeiten',
        description: 'Nur für EDITOR. Alle Felder optional (Patch-Semantik). `tags`-Array ersetzt alle bestehenden Tags.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', maxLength: 200 },
                  description: { type: 'string' },
                  quantity: { type: 'number', minimum: 0 },
                  unit: { type: 'string' },
                  minQuantity: { type: 'number', minimum: 0 },
                  condition: { $ref: '#/components/schemas/ItemCondition' },
                  purchaseUrl: { type: 'string', description: 'Leerer String entfernt die URL' },
                  purchasePrice: { type: 'number', minimum: 0 },
                  purchaseDate: { type: 'string', format: 'date-time' },
                  warrantyUntil: { type: 'string', format: 'date-time' },
                  serialNumber: { type: 'string' },
                  barcode: { type: 'string' },
                  tags: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Item aktualisiert', content: { 'application/json': { schema: { $ref: '#/components/schemas/Item' } } } },
          400: { description: 'Validierungsfehler' },
          403: { description: 'Nur EDITOR erlaubt' },
          404: { description: 'Item nicht gefunden' },
        },
      },
      delete: {
        tags: ['Items'],
        summary: 'Item löschen',
        description: 'Nur für EDITOR. Löscht auch das Bild vom Dateisystem.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          204: { description: 'Gelöscht' },
          403: { description: 'Nur EDITOR erlaubt' },
          404: { description: 'Item nicht gefunden' },
        },
      },
    },

    '/items/{id}/image': {
      post: {
        tags: ['Items'],
        summary: 'Bild für ein Item hochladen',
        description: 'Nur für EDITOR. Ersetzt ein vorhandenes Bild.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['image'],
                properties: { image: { type: 'string', format: 'binary' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Bild hochgeladen, gibt Item mit neuer `imageUrl` zurück', content: { 'application/json': { schema: { $ref: '#/components/schemas/Item' } } } },
          400: { description: 'Kein Bild im Request' },
          403: { description: 'Nur EDITOR erlaubt' },
          404: { description: 'Item nicht gefunden' },
        },
      },
    },

    '/tags': {
      get: {
        tags: ['Tags'],
        summary: 'Alle verwendeten Tags abrufen',
        responses: {
          200: {
            description: 'Tags mit Item-Anzahl, alphabetisch sortiert',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/TagWithCount' } } } },
          },
        },
      },
    },

    '/container-types': {
      get: {
        tags: ['ContainerTypes'],
        summary: 'Alle Container-Typen abrufen',
        responses: {
          200: {
            description: 'Container-Typen mit Location-Anzahl',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/ContainerTypeWithCount' } } } },
          },
        },
      },
      post: {
        tags: ['ContainerTypes'],
        summary: 'Neuen Container-Typ anlegen',
        description: 'Nur für EDITOR.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', maxLength: 50 },
                  icon: { type: 'string' },
                  color: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$', example: '#3B82F6' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Container-Typ erstellt', content: { 'application/json': { schema: { $ref: '#/components/schemas/ContainerType' } } } },
          400: { description: 'Validierungsfehler' },
          403: { description: 'Nur EDITOR erlaubt' },
        },
      },
    },

    '/container-types/{id}': {
      put: {
        tags: ['ContainerTypes'],
        summary: 'Container-Typ bearbeiten',
        description: 'Nur für EDITOR.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', maxLength: 50 },
                  icon: { type: 'string' },
                  color: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Aktualisiert', content: { 'application/json': { schema: { $ref: '#/components/schemas/ContainerType' } } } },
          403: { description: 'Nur EDITOR erlaubt' },
          404: { description: 'Nicht gefunden' },
        },
      },
      delete: {
        tags: ['ContainerTypes'],
        summary: 'Container-Typ löschen',
        description: 'Nur für EDITOR.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          204: { description: 'Gelöscht' },
          403: { description: 'Nur EDITOR erlaubt' },
          404: { description: 'Nicht gefunden' },
        },
      },
    },

    '/lendings/active': {
      get: {
        tags: ['Lendings'],
        summary: 'Alle aktiven Ausleihen abrufen',
        description: 'Gibt alle Ausleihen zurück bei denen `returnedAt` null ist.',
        responses: {
          200: {
            description: 'Aktive Ausleihen mit Item-Kontext',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/LendingWithItem' } } } },
          },
        },
      },
    },

    '/lendings/{id}': {
      get: {
        tags: ['Lendings'],
        summary: 'Einzelne Ausleihe abrufen',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Ausleihe mit Item-Referenz', content: { 'application/json': { schema: { $ref: '#/components/schemas/LendingWithItem' } } } },
          404: { description: 'Ausleihe nicht gefunden' },
        },
      },
    },

    '/lendings/{id}/return': {
      put: {
        tags: ['Lendings'],
        summary: 'Ausleihe als zurückgegeben markieren',
        description: 'Nur für EDITOR. Setzt `returnedAt` auf den aktuellen Zeitstempel.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Ausleihe abgeschlossen', content: { 'application/json': { schema: { $ref: '#/components/schemas/Lending' } } } },
          403: { description: 'Nur EDITOR erlaubt' },
          404: { description: 'Ausleihe nicht gefunden' },
          409: { description: 'Wurde bereits zurückgegeben' },
        },
      },
    },

    '/items/{itemId}/lend': {
      post: {
        tags: ['Lendings'],
        summary: 'Item verleihen',
        description: 'Nur für EDITOR. Erstellt eine neue Ausleihe für das angegebene Item.',
        parameters: [{ name: 'itemId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['lentTo'],
                properties: {
                  lentTo: { type: 'string', minLength: 1, example: 'Klaus Müller' },
                  lentAt: { type: 'string', format: 'date-time', description: 'Standard: jetzt' },
                  note: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Ausleihe erstellt', content: { 'application/json': { schema: { $ref: '#/components/schemas/Lending' } } } },
          400: { description: 'Validierungsfehler' },
          403: { description: 'Nur EDITOR erlaubt' },
          404: { description: 'Item nicht gefunden' },
        },
      },
    },

    '/items/{itemId}/lendings': {
      get: {
        tags: ['Lendings'],
        summary: 'Ausleihhistorie eines Items',
        parameters: [{ name: 'itemId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Alle Ausleihen, neueste zuerst',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Lending' } } } },
          },
          404: { description: 'Item nicht gefunden' },
        },
      },
    },
  },
};

export default spec;
