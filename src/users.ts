import { Router, Request, Response } from "express";
import { db, hashPassword } from "./db";
import { validateBody, RegisterSchema } from "./validator";

export const usersRouter = Router();

usersRouter.post("/register", validateBody(RegisterSchema), (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Parameterized query to prevent SQL Injection
  const existing = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email);

  if (existing) {
    return res.status(409).json({ error: "email taken" });
  }

  db.prepare("INSERT INTO users (email, password) VALUES (?, ?)").run(
    email,
    hashPassword(password)
  );

  res.json({ ok: true });
});
