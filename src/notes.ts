import { Router, Response } from "express";
import { db } from "./db";
import { authMiddleware, AuthenticatedRequest } from "./auth";
import { validateBody, CreateNoteSchema } from "./validator";
import {note} from "./dto";

export const notesRouter = Router();

notesRouter.get("/", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;

  const notes = db
    .prepare(
      `SELECT notes.id, notes.user_id, notes.title, notes.body, users.email AS author 
       FROM notes 
       LEFT JOIN users ON notes.user_id = users.id 
       WHERE notes.user_id = ?`
    )
    .all(userId) as note[];

  res.json(notes);
});

notesRouter.get("/:id", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const noteId = Number(req.params.id);
  const userId = req.user?.userId;

  if (isNaN(noteId)) {
    return res.status(400).json({ error: "invalid note id" });
  }

  const note = db
    .prepare(
      `SELECT notes.id, notes.user_id, notes.title, notes.body, users.email AS author 
       FROM notes 
       LEFT JOIN users ON notes.user_id = users.id 
       WHERE notes.id = ? AND notes.user_id = ?`
    )
    .get(noteId, userId);

  if (!note) {
    return res.status(404).json({ error: "note not found" });
  }

  res.json(note);
});

// POST /notes - Attach input validation and associate note with authenticated user_id
notesRouter.post("/", authMiddleware, validateBody(CreateNoteSchema), (req: AuthenticatedRequest, res: Response) => {
  const { title, body } = req.body;
  const userId = req.user?.userId;

  const info = db
    .prepare("INSERT INTO notes (user_id, title, body) VALUES (?, ?, ?)")
    .run(userId, title, body);

  res.json({ id: info.lastInsertRowid });
});
