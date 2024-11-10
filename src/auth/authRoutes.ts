import { Router, Request, Response, RequestHandler } from "express";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import path from "path";

const router = Router();
const dbPath = path.join(__dirname, "../../db.json");

interface User {
  id: string;
  username: string;
  password: string;
  isGuest: boolean;
}

// Helper functions to read and write the JSON database
const readDB = async (): Promise<{ users: User[] }> => {
  const data = await fs.readFile(dbPath, "utf-8");
  return JSON.parse(data);
};

const writeDB = async (data: { users: User[] }) => {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
};

// Signup handler
const handleSignup: RequestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { username, password } = req.body;
    const db = await readDB();

    if (db.users.find((user) => user.username === username)) {
      res.status(400).json({ message: "Username already exists" });
      return;
    }

    const newUser: User = { id: uuidv4(), username, password, isGuest: false };
    db.users.push(newUser);
    await writeDB(db);

    res
      .status(201)
      .json({ message: "User created", user: { username: newUser.username } });
  } catch (error) {
    res.status(500).json({ message: "Error creating user", error });
  }
};

// Login handler
const handleLogin: RequestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { username, password } = req.body;
    const db = await readDB();

    const user = db.users.find(
      (user) => user.username === username && user.password === password
    );
    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    res.status(200).json({
      message: "Login successful",
      user: { username: user.username, isGuest: false },
    });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error });
  }
};

// Guest login handler
const handleGuestLogin: RequestHandler = (
  req: Request,
  res: Response
): Promise<void> => {
  res.status(200).json({
    message: "Guest login successful",
    user: { username: "guest", isGuest: true },
  });
  return Promise.resolve();
};

// Get all users
const handleGetUsers: RequestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const db = await readDB();
    res.status(200).json({ users: db.users });
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error });
  }
};
let onlineUsers: Set<string> = new Set();
// Handle user coming online
const handleUserOnline: RequestHandler = (req: Request, res: Response) => {
  const { userId } = req.body; // Assuming you're sending userId when they come online
  onlineUsers.add(userId);
  res.status(200).json({ message: "User marked as online" });
};

// Handle user going offline
const handleUserOffline: RequestHandler = (req: Request, res: Response) => {
  const { userId } = req.body;
  onlineUsers.delete(userId);
  res.status(200).json({ message: "User marked as offline" });
};

// Define the new route

// Define routes
router.get("/users", handleGetUsers);
router.post("/user/online", handleUserOnline); // For when a user comes online
router.post("/user/offline", handleUserOffline); // For when a user goes offline
router.post("/signup", handleSignup);
router.post("/login", handleLogin);
router.post("/login/guest", handleGuestLogin);

export default router;
