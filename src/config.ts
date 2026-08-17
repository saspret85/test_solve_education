export const config = {
  jwtSecret: process.env.JWT_SECRET || "c3d0b2f4-8a4e-4e67-b891-72f1092a10e8",
  jwtExpiresIn: Number(process.env.JWT_EXPIRES_IN) || 300, // 5 minutes in seconds
  refreshSecret: process.env.REFRESH_SECRET || "e8f192b4-3a9d-4c67-a891-92f1092b10e9",
  refreshExpiresIn: Number(process.env.REFRESH_EXPIRES_IN) || 604800, // 7 days in seconds
  dbPath: process.env.DB_PATH || "notes.db",
  port: Number(process.env.PORT) || 3000,
};
