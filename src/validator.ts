import { z } from "zod";
import { Request, Response, NextFunction } from "express";

export function sanitizeString(val: string): string {
  if (typeof val !== "string") return val;
  return val
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .trim();
}

const stringSanitized = z
  .string()
  .min(1, "Field cannot be empty")
  .transform((val) => sanitizeString(val));

export const RegisterSchema = z.object({
  email: z.string().email("Invalid email format").transform((val) => sanitizeString(val)),
  password: z.string().min(1, "Password is required"),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email format").transform((val) => sanitizeString(val)),
  password: z.string().min(1, "Password is required"),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const CreateNoteSchema = z.object({
  title: stringSanitized,
  body: stringSanitized,
});

export function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({ error: "Validation failed", details: "Request body is required" });
    }
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const formattedErrors = result.error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      return res.status(400).json({ error: "Validation failed", details: formattedErrors });
    }
    req.body = result.data;
    next();
  };
}
