const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// In-memory ticket locks
const lockedTickets = new Map();

// Sample support tickets
const tickets = [
  {
    id: 101,
    title: "Truck Breakdown",
    customer: "Dallas Freight Co.",
    status: "Open",
  },
  {
    id: 102,
    title: "Missed Delivery",
    customer: "Texas Retail Group",
    status: "Open",
  },
  {
    id: 103,
    title: "Damaged Package",
    customer: "Lone Star Logistics",
    status: "Open",
  },
  {
    id: 104,
    title: "Driver Assistance",
    customer: "Rapid Cargo LLC",
    status: "Open",
  },
  {
    id: 105,
    title: "Delivery Delay",
    customer: "Dallas Distribution",
    status: "Open",
  },
];

app.get("/", (req, res) => {
  res.json({
    message: "RapidDispatch Live Ops Server is running",
  });
});

io.on("connection", (socket) => {
  console.log(`Agent connected: ${socket.id}`);

  // Agent joins dashboard
  socket.on("join_dashboard", (agentName) => {
    console.log(`${agentName} joined the dashboard`);

    socket.emit("dashboard_joined", {
      message: `Welcome ${agentName}`,
    });

    socket.emit("tickets_list", tickets);
  });

  // Lock a ticket
  socket.on("lock_ticket", ({ ticketId, agentName }) => {
    const existingLock = lockedTickets.get(ticketId);

    // Ticket is already locked
    if (existingLock) {
      socket.emit("lock_rejected", {
        ticketId,
        lockedBy: existingLock.agentName,
      });

      return;
    }

    // Create lock
    lockedTickets.set(ticketId, {
      socketId: socket.id,
      agentName,
    });

    console.log(`Ticket #${ticketId} locked by ${agentName}`);

    // Broadcast to ALL connected clients
    io.emit("ticket_locked", {
      ticketId,
      agentName,
    });
  });

  // Unlock a ticket
  socket.on("unlock_ticket", ({ ticketId }) => {
    const existingLock = lockedTickets.get(ticketId);

    if (!existingLock) {
      console.log(`Ticket #${ticketId} is not locked`);
      return;
    }

    // Only the agent who owns the lock can unlock it
    if (existingLock.socketId !== socket.id) {
      socket.emit("unlock_rejected", {
        ticketId,
        message: "You do not own this ticket lock.",
      });

      return;
    }

    // Remove the lock
    lockedTickets.delete(ticketId);

    console.log(`Ticket #${ticketId} unlocked`);

    // Tell every connected client
    io.emit("ticket_unlocked", {
      ticketId,
    });
  });

  // Disconnect handler
  socket.on("disconnect", () => {
    console.log(`Agent disconnected: ${socket.id}`);
    // Find all tickets locked by this socket
    for (const [ticketId, lock] of lockedTickets.entries()) {
      if (lock.socketId === socket.id) {
        lockedTickets.delete(ticketId);
        console.log(
          `Ticket #${ticketId} automatically unlocked because the agent disconnected`
        );
        // Tell every remaining client that the ticket is available
        io.emit("ticket_unlocked", {
          ticketId,
        });
      }
    }
  });
});


const PORT = 4000;

server.listen(PORT, () => {
  console.log(
    `RapidDispatch server running on http://localhost:${PORT}`
  );
});