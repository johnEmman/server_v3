import express, { Request, Response } from "express";
import { Server } from "socket.io";
import { createRoom, requestJoinRoom, inviteUser } from "./webrtcController"; // Import the functions from your controller

const router = express.Router();

// Route to create a new room (for Person A)
router.post("/create-room", (req: Request, res: Response) => {
  const { roomId, userId } = req.body;

  if (!roomId || !userId) {
    return res
      .status(400)
      .json({ message: "Room ID and User ID are required" });
  }

  try {
    const result = createRoom(roomId, userId);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
});

// Route for Person A to invite Person B to the room
router.post("/invite-user", (req: Request, res: Response) => {
  const { roomId, userId, inviteeId } = req.body;

  if (!roomId || !userId || !inviteeId) {
    return res
      .status(400)
      .json({ message: "Room ID, User ID, and Invitee ID are required" });
  }

  try {
    const result = inviteUser(roomId, userId, inviteeId);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
});

// Route for Person B to request to join a room
router.post("/request-join", (req: Request, res: Response) => {
  const { roomId, userId } = req.body;

  if (!roomId || !userId) {
    return res
      .status(400)
      .json({ message: "Room ID and User ID are required" });
  }

  try {
    const result = requestJoinRoom(roomId, userId);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
});

export default router;
