import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db, hashPassword } from "./db";
import { config } from "./config";
import { validateBody, LoginSchema, RefreshTokenSchema } from "./validator";
import {user} from "./dto";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    email: string;
  };
}

export const authRouter = Router();

authRouter.post("/login", validateBody(LoginSchema), (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Parameterized query to prevent SQL Injection
  const row = db
    .prepare("SELECT * FROM users WHERE email = ? AND password = ?")
    .get(email, hashPassword(password)) as user;

  if (!row) {
    return res.status(401).json({ error: "invalid credentials" });
  }

  const iat = Math.floor(Date.now() / 1000);
  const expired_at = iat + config.jwtExpiresIn;

  const token = jwt.sign({ userId: row.id, email: row.email }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });

  const refreshToken = jwt.sign({ userId: row.id, email: row.email }, config.refreshSecret, {
    expiresIn: config.refreshExpiresIn,
  });

  res.json({
    token,
    refreshToken,
    iat,
    expired_at,
  });
});

authRouter.post("/refresh", validateBody(RefreshTokenSchema), (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  try {
    const payload = jwt.verify(refreshToken, config.refreshSecret) as any;

    const iat = Math.floor(Date.now() / 1000);
    const expired_at = iat + config.jwtExpiresIn;

    const newToken = jwt.sign({ userId: payload.userId, email: payload.email }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });

    const newRefreshToken = jwt.sign({ userId: payload.userId, email: payload.email }, config.refreshSecret, {
      expiresIn: config.refreshExpiresIn,
    });

    res.json({
      token: newToken,
      refreshToken: newRefreshToken,
      iat,
      expired_at,
    });
  } catch (e) {
    res.status(401).json({ error: "invalid or expired refresh token" });
  }
});

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  const token = header.replace("Bearer ", "").trim();

  if (!token) {
    return res.status(401).json({ error: "unauthorized" });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as any;
    req.user = payload;
    next();
  } catch (e) {
    res.status(401).json({ error: "unauthorized" });
  }
}
