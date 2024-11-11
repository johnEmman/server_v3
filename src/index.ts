import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fs from "fs";
import https from "https";
import authRoutes from "./auth/authRoutes";
import path from "path";
// import webrtcRoutes from "./webRTC/webrtcRoutes"; // Import the WebRTC routes
import { initWebRTC } from "./webRTC/webrtcController"; // Import the WebRTC signaling setup
import { Server as SocketIOServer } from "socket.io"; // Correct import for Socket.io server

const app = express();
const port = process.env.PORT || 4000;

// Create HTTP server and initialize WebSocket (Socket.io)
const server = https.createServer(
  {
    key: fs.readFileSync(path.resolve(__dirname, "../../ssl_certs/private.key")), // Adjust path if certs are elsewhere
    cert: fs.readFileSync(
      path.resolve(__dirname, "../../ssl_certs/certificate.crt")
    ),
  },
  app
);

const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Initialize WebRTC signaling
initWebRTC(io);

// CORS configuration
app.use(
  cors({
    origin: "*", // Replace <YOUR-IP-ADDRESS> with your actual IP
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type, Authorization",
  })
);

// Middleware setup
app.use(bodyParser.json());

// Authentication routes
app.use("/auth", authRoutes);

// WebRTC signaling routes
// app.use("/webrtc", webrtcRoutes); // WebRTC routes for signaling

// Serve frontend files (optional, for development)
const staticPath = path.join(__dirname, "../client/build");
app.use(express.static(staticPath));

// Start the server
server.listen(port, () => {
  console.log(`Server running at https://192.168.1.20:${port}`);
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});
