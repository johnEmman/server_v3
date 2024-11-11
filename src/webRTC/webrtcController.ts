import { Server, Socket } from "socket.io";

interface Room {
  host: string;
  guests: string[];
  invitations: Set<string>;
}

const rooms: Record<string, Room> = {}; // Store rooms with host and guest list
const userSockets: Record<string, string> = {}; // Map user IDs to socket IDs

export function initWebRTC(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log("User connected:", socket.id);

    // Register user socket ID
    socket.on("register", (userId: string) => {
      userSockets[userId] = socket.id;
    });

    // Create a room (hosted by Person A)
    socket.on("create-room", ({ roomId, userId }) => {
      if (rooms[roomId]) {
        socket.emit("error", { message: "Room already exists" });
      } else {
        rooms[roomId] = { host: userId, guests: [], invitations: new Set() };
        socket.join(roomId);
        socket.emit("room-created", { roomId });
        console.log(`Room ${roomId} created by ${userId}`);
      }
    });

    // Invite a user to the room
    socket.on("invite-user", ({ roomId, userId, inviteeId }) => {
      const room = rooms[roomId];
      if (room && room.host === userId) {
        room.invitations.add(inviteeId);
        const inviteeSocketId = userSockets[inviteeId];
        if (inviteeSocketId) {
          io.to(inviteeSocketId).emit("invited-to-room", { roomId });
          console.log(
            `${inviteeId} invited to room ${roomId} by host ${userId}`
          );
        }
      } else {
        socket.emit("error", { message: "Only the host can invite users" });
      }
    });

    // Request to join a room (for users who were not invited)
    socket.on("request-join", ({ roomId, userId }) => {
      const room = rooms[roomId];
      if (!room) {
        socket.emit("error", { message: "Room not found" });
      } else if (room.invitations.has(userId) || room.host === userId) {
        // Allow user to join if invited or if they are the host
        socket.join(roomId);
        room.guests.push(userId);
        io.to(roomId).emit("user-joined", { userId });
        console.log(`${userId} joined room ${roomId}`);
      } else {
        // Send join request to the host for approval
        const hostSocketId = userSockets[room.host];
        if (hostSocketId) {
          io.to(hostSocketId).emit("join-request", { roomId, userId });
          console.log(`${userId} requested to join room ${roomId}`);
        }
      }
    });

    // Approve or deny join request
    socket.on("respond-join-request", ({ roomId, userId, approved }) => {
      const room = rooms[roomId];
      if (room && room.host === userSockets[userId]) {
        const guestSocketId = userSockets[userId];
        if (approved && guestSocketId) {
          room.guests.push(userId);
          io.to(guestSocketId).emit("join-approved", { roomId });
          io.to(roomId).emit("user-joined", { userId });
          console.log(`${userId} joined room ${roomId}`);
        } else {
          io.to(guestSocketId).emit("join-denied", { roomId });
          console.log(`Join request denied for ${userId} in room ${roomId}`);
        }
      }
    });

    // Handle signaling for WebRTC
    socket.on("signal", ({ roomId, signalData }) => {
      socket.to(roomId).emit("signal", signalData);
    });

    // Handle disconnect and clean up
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      for (const roomId in rooms) {
        const room = rooms[roomId];
        if (room.host === socket.id || room.guests.includes(socket.id)) {
          io.to(roomId).emit("user-left", { userId: socket.id });
          delete rooms[roomId];
        }
      }
    });
  });
}
