import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

// Extend session with our custom properties
declare module "express-session" {
  interface SessionData {
    userId: number;
    username: string;
    isAuthenticated: boolean;
  }
}

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    // Special case for demo login with username "demo" and password "1234"
    // This logic is handled separately in the LocalStrategy callback
    
    // Split the stored password into hash and salt
    const [hashed, salt] = stored.split(".");
    
    // Normal case - compute hash of supplied password with same salt
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    
    // Compare the two buffers in constant time
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "ai-code-buddy-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      // Special case for demo login
      if (username === "demo" && password === "1234") {
        const demoUser = await storage.getUserByUsername("demo");
        if (demoUser) {
          return done(null, demoUser);
        } else {
          // If demo user doesn't exist, create it
          try {
            const hashedPassword = await hashPassword("1234");
            const newDemoUser = await storage.createUser({
              username: "demo",
              password: hashedPassword
            });
            return done(null, newDemoUser);
          } catch (error) {
            console.error("Failed to create demo user:", error);
            return done(null, false);
          }
        }
      }

      // Normal login flow
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).send("Username already exists");
    }

    const user = await storage.createUser({
      ...req.body,
      password: await hashPassword(req.body.password),
    });

    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  });

  // Special endpoint for demo login - bypasses normal authentication
  app.post("/api/demo-login", async (req, res) => {
    console.log("Demo login attempt");
    try {
      // Get or create demo user
      let demoUser = await storage.getUserByUsername("demo");
      if (!demoUser) {
        console.log("Creating demo user");
        const hashedPassword = await hashPassword("1234");
        demoUser = await storage.createUser({
          username: "demo",
          password: hashedPassword
        });
      }
      
      // Create a session manually
      req.session.userId = demoUser.id;
      req.session.username = demoUser.username;
      req.session.isAuthenticated = true;
      
      // Save session and return user info
      req.session.save(err => {
        if (err) {
          console.error("Failed to save session:", err);
          return res.status(500).json({ message: "Session error" });
        }
        console.log("Demo login successful, session ID:", req.sessionID);
        return res.status(200).json(demoUser);
      });
    } catch (error) {
      console.error("Demo login error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Regular login endpoint
  app.post("/api/login", (req, res, next) => {
    console.log("Login attempt for user:", req.body.username);
    
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error("Authentication error:", err);
        return next(err);
      }
      
      if (!user) {
        console.log("Authentication failed: Invalid credentials");
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("Session login error:", loginErr);
          return next(loginErr);
        }
        
        console.log("Authentication successful for user:", user.username);
        console.log("Session ID:", req.sessionID);
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", async (req, res) => {
    console.log("GET /api/user - Session ID:", req.sessionID);
    
    // Check both passport authentication and session-based authentication
    const isPassportAuth = req.isAuthenticated();
    const isSessionAuth = req.session.isAuthenticated === true;
    
    console.log("Passport authenticated:", isPassportAuth);
    console.log("Session authenticated:", isSessionAuth);
    
    if (req.user) {
      console.log("User in passport session:", req.user.username);
    } else if (req.session.userId) {
      console.log("User ID in custom session:", req.session.userId);
    } else {
      console.log("No user in any session");
    }
    
    // User can be authenticated either through passport or custom session
    if (isPassportAuth) {
      // Standard Passport.js authentication
      return res.json(req.user);
    } else if (isSessionAuth && req.session.userId) {
      // Custom session-based authentication for test mode
      try {
        const user = await storage.getUser(req.session.userId);
        if (user) {
          return res.json(user);
        } else {
          console.log("User not found for ID in session:", req.session.userId);
          return res.sendStatus(401);
        }
      } catch (error) {
        console.error("Error fetching user from custom session:", error);
        return res.sendStatus(500);
      }
    } else {
      // Not authenticated through any method
      return res.sendStatus(401);
    }
  });
}
