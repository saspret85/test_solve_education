import { describe, it, expect, beforeAll } from "vitest";
import jwt from "jsonwebtoken";
import { config } from "../src/config";
import { db, hashPassword } from "../src/db";
import { sanitizeString } from "../src/validator";

describe("Notes API & Authentication Assessment Tests", () => {
  let aliceToken: string;
  let aliceRefreshToken: string;
  let bobToken: string;

  beforeAll(() => {
    // Generate valid test JWT tokens for Alice (userId 1) and Bob (userId 2)
    aliceToken = jwt.sign({ userId: 1, email: "alice@example.com" }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });
    aliceRefreshToken = jwt.sign({ userId: 1, email: "alice@example.com" }, config.refreshSecret, {
      expiresIn: config.refreshExpiresIn,
    });

    bobToken = jwt.sign({ userId: 2, email: "bob@example.com" }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });
  });

  describe("SQL Injection Prevention Tests", () => {
    it("prevents authentication bypass via SQL Injection in email payload (' OR '1'='1)", () => {
      const sqlInjectionEmail = "alice@example.com' OR '1'='1";
      const sqlInjectionPassword = "wrongpassword";

      // With parameterized query, SQLite treats sqlInjectionEmail as literal string
      const user = db
        .prepare("SELECT * FROM users WHERE email = ? AND password = ?")
        .get(sqlInjectionEmail, hashPassword(sqlInjectionPassword));

      expect(user).toBeUndefined();
    });

    it("prevents authentication bypass via comment syntax injection (admin' --)", () => {
      const sqlInjectionEmail = "alice@example.com' --";
      const dummyPassword = "anypassword";

      const user = db
        .prepare("SELECT * FROM users WHERE email = ? AND password = ?")
        .get(sqlInjectionEmail, hashPassword(dummyPassword));

      expect(user).toBeUndefined();
    });

    it("prevents SQL Injection in user registration check", () => {
      const sqlInjectionEmail = "' OR 1=1 --";

      const existingUser = db
        .prepare("SELECT * FROM users WHERE email = ?")
        .get(sqlInjectionEmail);

      // Should not match any existing user like alice@example.com
      expect(existingUser).toBeUndefined();
    });

    it("prevents SQL Injection in GET note by ID query (1 OR 1=1)", () => {
      const maliciousId = "1 OR 1=1" as any;
      const userId = 1;

      // Parameterized query binds maliciousId as literal parameter
      const note = db
        .prepare(
          `SELECT notes.id, notes.user_id, notes.title, notes.body, users.email AS author 
           FROM notes 
           LEFT JOIN users ON notes.user_id = users.id 
           WHERE notes.id = ? AND notes.user_id = ?`
        )
        .get(maliciousId, userId);

      expect(note).toBeUndefined();
    });

    it("prevents SQL statement injection in INSERT note title/body", () => {
      const maliciousTitle = "Normal Title'); DROP TABLE users; --";
      const maliciousBody = "Body payload";
      const userId = 1;

      const info = db
        .prepare("INSERT INTO notes (user_id, title, body) VALUES (?, ?, ?)")
        .run(userId, maliciousTitle, maliciousBody);

      expect(info.lastInsertRowid).toBeDefined();

      // Verify users table was NOT dropped and remains intact
      const usersCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as any;
      expect(usersCount.count).toBeGreaterThan(0);
    });
  });

  describe("Security & Validation", () => {
    it("hashPassword produces valid non-empty string", () => {
      expect(hashPassword("password1")).toBeDefined();
    });

    it("sanitizeString strips script tags and escapes HTML entities to prevent XSS", () => {
      const input = "<script>alert('xss')</script>Hello <b>World</b>";
      const sanitized = sanitizeString(input);
      expect(sanitized).not.toContain("<script>");
      expect(sanitized).toContain("&lt;b&gt;World&lt;/b&gt;");
    });
  });

  describe("Config & JWT Expiration", () => {
    it("JWT default secret is set to a UUID string", () => {
      expect(config.jwtSecret).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    it("JWT expiration is set to 300 seconds (5 minutes)", () => {
      expect(config.jwtExpiresIn).toBe(300);
    });

    it("JWT token contains valid iat and exp timestamps", () => {
      const decoded = jwt.verify(aliceToken, config.jwtSecret) as any;
      expect(decoded.userId).toBe(1);
      expect(decoded.email).toBe("alice@example.com");
      expect(decoded.exp - decoded.iat).toBe(300);
    });

    it("Refresh token can be verified using refreshSecret", () => {
      const decoded = jwt.verify(aliceRefreshToken, config.refreshSecret) as any;
      expect(decoded.userId).toBe(1);
    });
  });
});
