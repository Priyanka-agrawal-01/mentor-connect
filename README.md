# MentorConnect

MentorConnect is an AI-powered mentorship platform for student-alumni connections. It combines a Node.js backend, MongoDB persistence, real-time chat, and a static frontend to deliver user authentication, mentorship matching, messaging, communities, goals, badges, and verification.

## Project Structure

- `client/`
  - Frontend application with HTML, CSS, and JavaScript.
  - Includes UI pages like `dashboard.html`, `chat.html`, `communities.html`, `profile.html`, and `login.html`.
  - `js/` contains client logic for authentication, chat, community interaction, and page behavior.
  - `css/` contains styling and may use Tailwind + Sass build tooling.
  - `assets/` contains static files such as profile images.

- `server/`
  - Backend API and real-time service.
  - `server.js`: Express app setup, middleware, route mounting, MongoDB connection, and static file serving.
  - `socket.js`: Socket.IO implementation for real-time messaging and online presence.
  - `routes/`: REST API endpoints for auth, users, mentorships, messages, goals, badges, communities, search, and verification.
  - `models/`: Mongoose schemas for Badge, Community, Conversation, Goal, Message, and User.
  - `middleware/`: authentication helpers and request validation.
  - `services/`: AI verification or additional backend services.
  - `utils/`: shared utility functions like database connection helpers.

## Tech Stack

- Backend: Node.js, Express, MongoDB, Mongoose, Socket.IO
- Authentication: JSON Web Tokens (`jsonwebtoken`), `bcryptjs`
- Frontend: HTML, CSS, JavaScript, Bootstrap, Tailwind CSS, jQuery
- Dev tools: `nodemon`, `live-server`, `concurrently`, `sass`, `postcss`, Babel

## Key Features

- User authentication and profile management
- Mentor/mentee matching and mentorship relationships
- Real-time chat with Socket.IO
- Community pages and discussion support
- Goal tracking and badge systems
- AI verification workflows in the backend

## Running the Project

From the root folder:

```bash
npm install
npm run dev
```

This starts the backend server and the client app together. The backend listens on port `5000` by default, and the client runs with `live-server`.

## Notes

- The backend serves static client files in production, but during development the client uses `live-server`.
- `server/routes` and `server/models` are the main places to update API behavior and database structure.
