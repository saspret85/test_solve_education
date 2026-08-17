import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger";
import { authRouter } from "./auth";
import { usersRouter } from "./users";
import { notesRouter } from "./notes";
import { config } from "./config";

export const app = express();

app.use(express.json());
app.use(cors({ origin: "*", credentials: true }));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/notes", notesRouter);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const isDev = process.env.NODE_ENV === "development";
  res.status(500).json({
    error: err.message || "Internal server error",
    ...(isDev && { stack: err.stack }),
  });
});

if (process.env.NODE_ENV !== "test") {
  app.listen(config.port, () => {
    console.log(`listening on ${config.port}`);
    console.log(`Swagger docs available at http://localhost:${config.port}/api-docs`);
  });
}
