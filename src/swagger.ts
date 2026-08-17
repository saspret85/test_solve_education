import swaggerJsdoc from "swagger-jsdoc";
import { config } from "./config";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Notes REST API",
    version: "1.0.0",
    description: "API Documentation for Notes Application Assessment",
  },
  servers: [
    {
      url: `http://localhost:${config.port}`,
      description: "Local Server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT token in the format: Bearer <token>",
      },
    },
    schemas: {
      RegisterRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            example: "user@example.com",
          },
          password: {
            type: "string",
            example: "secret123",
          },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            example: "alice@example.com",
          },
          password: {
            type: "string",
            example: "password1",
          },
        },
      },
      RefreshTokenRequest: {
        type: "object",
        required: ["refreshToken"],
        properties: {
          refreshToken: {
            type: "string",
            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          },
        },
      },
      AuthResponse: {
        type: "object",
        properties: {
          token: {
            type: "string",
            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          },
          refreshToken: {
            type: "string",
            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          },
          iat: {
            type: "integer",
            example: 1700000000,
          },
          expired_at: {
            type: "integer",
            example: 1700000300,
          },
        },
      },
      CreateNoteRequest: {
        type: "object",
        required: ["title", "body"],
        properties: {
          title: {
            type: "string",
            example: "My Note Title",
          },
          body: {
            type: "string",
            example: "This is the content of my note.",
          },
        },
      },
      NoteResponse: {
        type: "object",
        properties: {
          id: {
            type: "integer",
            example: 1,
          },
          user_id: {
            type: "integer",
            example: 1,
          },
          title: {
            type: "string",
            example: "Alice note",
          },
          body: {
            type: "string",
            example: "private thoughts",
          },
          author: {
            type: "string",
            nullable: true,
            example: "alice@example.com",
          },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          error: {
            type: "string",
            example: "invalid credentials",
          },
        },
      },
    },
  },
  paths: {
    "/users/register": {
      post: {
        summary: "Register a new user",
        tags: ["Users"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/RegisterRequest",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "User successfully registered",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: {
                      type: "boolean",
                      example: true,
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Validation failed",
          },
          "409": {
            description: "Email already registered",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
    "/auth/login": {
      post: {
        summary: "User login to acquire JWT Access Token & Refresh Token",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/LoginRequest",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Login successful",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/AuthResponse",
                },
              },
            },
          },
          "401": {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
    "/auth/refresh": {
      post: {
        summary: "Refresh JWT Access Token using valid Refresh Token",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/RefreshTokenRequest",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Token refresh successful",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/AuthResponse",
                },
              },
            },
          },
          "401": {
            description: "Invalid or expired refresh token",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
    "/notes": {
      get: {
        summary: "Get notes for authenticated user",
        tags: ["Notes"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          "200": {
            description: "List of user notes",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/NoteResponse",
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Create a new note",
        tags: ["Notes"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CreateNoteRequest",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Note created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: {
                      type: "integer",
                      example: 3,
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Validation failed or XSS payload blocked",
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
    "/notes/{id}": {
      get: {
        summary: "Get note by ID for authenticated user",
        tags: ["Notes"],
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "integer",
            },
            description: "Note ID",
          },
        ],
        responses: {
          "200": {
            description: "Note detail",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/NoteResponse",
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
          },
          "404": {
            description: "Note not found or does not belong to user",
          },
        },
      },
    },
  },
};

const options = {
  definition: swaggerDefinition,
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
