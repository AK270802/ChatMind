import express, { Request, Response } from "express";
import session from "express-session";
import cors from "cors";
import dotenv from "dotenv";
import { Pool } from "pg";
import bcrypt from "bcrypt";

dotenv.config();

const app = express();
app.use(express.json());

// --- Postgres connection ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // e.g. postgres://user:pass@localhost:5432/mydb
});

// --- Middlewares ---
const allowedOrigins = ["http://localhost:5173", "http://localhost:4000"];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, maxAge: 1000 * 60 * 60 * 24 },
  })
);

// --- Register ---
app.post("/api/register", async (req: Request, res: Response) => {
  const { username, email, password, firstName, lastName } = req.body;

  if (!username || !email || !password || !firstName || !lastName) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const hashed = await bcrypt.hash(password, 10);

  try {
    const result = await pool.query(
      `INSERT INTO users (username, email, password, first_name, last_name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, first_name AS "firstName", last_name AS "lastName"`,
      [username, email, hashed, firstName, lastName]
    );

    const newUser = result.rows[0];

    req.session.user = { id: newUser.id, username: newUser.username, email: newUser.email };
    res.json({ message: "User registered", user: newUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration failed" });
  }
});


// --- Login ---
app.post("/api/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Missing fields" });

  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  const user = result.rows[0];

  if (user && (await bcrypt.compare(password, user.password))) {
    req.session.user = { id: user.id, username: user.username, email: user.email };
    return res.json({ message: "Logged in" });
  }

  res.status(401).json({ message: "Invalid credentials" });
});

// --- Protected route ---
app.get("/api/user", (req: Request, res: Response) => {
  if (!req.session.user) return res.status(401).json({ message: "Unauthorized" });
  res.json({ user: req.session.user });
});
// --- STATS ---
app.get("/api/stats", (req, res) => {
  // Temporary mock data
  res.json({
    totalTrades: 10,
    totalProfit: 500,
  });
});

// --- TRADES ---
app.get("/api/trades", (req, res) => {
  // Temporary mock trades data
  res.json([
    { id: 1, symbol: "AAPL", amount: 100, profit: 50 },
    { id: 2, symbol: "GOOGL", amount: 50, profit: 20 },
    { id: 3, symbol: "TSLA", amount: 70, profit: -10 },
  ]);
});


// --- Logout ---
app.post("/api/logout", (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: "Logout failed" });
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out" });
  });
});

const port = parseInt(process.env.PORT || "5000", 10);
app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);

});
