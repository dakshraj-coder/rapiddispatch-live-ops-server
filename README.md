# RapidDispatch Live Ops Server

Real-time Node.js backend for the RapidDispatch Live Ops collaborative helpdesk.

## Live Server

https://rapiddispatch-live-ops-server.onrender.com

## GitHub

https://github.com/dakshraj-coder/rapiddispatch-live-ops-server

## Tech Stack

- Node.js
- Express
- Socket.io
- CORS

## Responsibilities

The server acts as the source of truth for real-time ticket locks.

It handles:

- `join_dashboard`
- `lock_ticket`
- `unlock_ticket`
- Socket.io connection management
- Lock rejection
- Real-time lock broadcasting
- Real-time unlock broadcasting
- Ghost disconnect handling

## Lock Management

Ticket locks are stored in an in-memory JavaScript `Map`.

Each lock contains:

- Ticket ID
- Socket ID
- Agent name

When an agent locks a ticket, the server broadcasts the lock to all connected clients.

If another agent attempts to lock the same ticket, the request is rejected.

## Ghost Disconnect Handling

When a Socket.io client disconnects, the server searches the lock map for tickets owned by that socket.

Any matching locks are automatically removed and `ticket_unlocked` is broadcast to connected clients.

This prevents tickets from remaining permanently locked when an agent loses their connection.

## Local Development

```bash
npm install
npm run dev