import { Request, Response } from "express";
import socketIo from "socket.io";

let io: socketIo.Server;
let rooms: { [key: string]: string[] } = {}; // Store rooms and user ids

export const initWebRTC = (socketServer: socketIo.Server) => {
  io = socketServer;
};

// Create a room (Person A)
export const createRoom = (req: Request, res: Response) => {
  const { roomId, userId } = req.body; // Person A's ID
  console.log(`Room created by ${userId} with roomId: ${roomId}`);

  if (rooms[roomId]) {
    return res.status(400).json({ message: "Room already exists." });
  }

  // Add the creator (Person A) to the room
  rooms[roomId] = [userId];
  res.status(200).json({ message: "Room created", roomId });
};

// Join a room (Person B)
export const joinRoom = (req: Request, res: Response) => {
  const { roomId, userId } = req.body; // Person B's ID
  console.log(`${userId} is trying to join room: ${roomId}`);

  if (!rooms[roomId]) {
    return res.status(404).json({ message: "Room not found." });
  }

  // Check if the user is already in the room
  if (rooms[roomId].includes(userId)) {
    return res.status(400).json({ message: "User already in room." });
  }

  // Add Person B to the room
  rooms[roomId].push(userId);

  // Notify all users in the room that a new user has joined
  io.to(roomId).emit("user-joined", { userId });

  res.status(200).json({ message: "Joined room", roomId });
};

// WebRTC signaling (offer, answer, ice-candidate) for users in a room
export const handleOffer = (req: Request, res: Response) => {
  const { offer, roomId, targetUserId } = req.body;
  console.log(`Sending offer to ${targetUserId} in room ${roomId}`);
  io.to(targetUserId).emit("offer", { offer, roomId });
  res.status(200).send({ message: "Offer sent" });
};

export const handleAnswer = (req: Request, res: Response) => {
  const { answer, roomId, targetUserId } = req.body;
  console.log(`Sending answer to ${targetUserId} in room ${roomId}`);
  io.to(targetUserId).emit("answer", { answer, roomId });
  res.status(200).send({ message: "Answer sent" });
};

export const handleIceCandidate = (req: Request, res: Response) => {
  const { candidate, roomId, targetUserId } = req.body;
  console.log(`Sending ICE candidate to ${targetUserId} in room ${roomId}`);
  io.to(targetUserId).emit("ice-candidate", { candidate, roomId });
  res.status(200).send({ message: "ICE candidate sent" });
};
