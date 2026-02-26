# JUICES.LIVE

**In-house order management for multi-location juice bars.**  
A university exam project demonstrating a full-stack system for real-time order handling, external API integration, and SMS notifications.

---

## Business Problem

Joe & the Juice and similar multi-location brands need a single in-house system to manage orders across stores and from third-party delivery partners (e.g. JustEat, UberEats). Staff need instant visibility into order status and the ability to move orders through stages without refreshing the page. This project addresses that by providing a Trello-like order board with live updates, a documented REST API for external partners, and optional SMS updates to customers.

---

## Features

- **Trello-style order board** — Drag-and-drop order management with instant updates across all connected clients.
- **Multi-location view** — See and manage orders across different store locations.
- **External partner API** — REST API with Bearer token auth for integrations (e.g. JustEat, UberEats).
- **API documentation** — Interactive Swagger UI for exploring and testing endpoints.
- **SMS notifications** — Twilio integration to keep customers informed about order status.

---

## Tech Stack

| Layer        | Technologies |
|-------------|--------------|
| **Backend** | Node.js, Express |
| **Real-time** | Socket.io |
| **Database** | SQLite (sqlite3) |
| **Auth** | JWT (jsonwebtoken), bcrypt, cookie-parser |
| **API docs** | Swagger UI (swagger-ui-express) |
| **SMS** | Twilio |
| **Frontend** | Vanilla HTML/CSS/JS, static client served by Express |

---

## How to Run Locally

1. Clone the repository.
2. Navigate to the `src` folder.
3. Install dependencies: `npm i`
4. Copy `.env.example` to `.env` and fill in the required environment variables (e.g. JWT secret, Twilio credentials if using SMS).
5. Start the server: `node server.js`

Then open [http://localhost:3000](http://localhost:3000) in your browser.

**Demo store logins** (for local or live testing):

| Store      | Password |
|-----------|----------|
| Copenhagen | testCPH |
| London     | testLD  |
| New York   | testNY  |

---

## Live Demo

The project is hosted at **[https://juices.live](https://juices.live)** on a DigitalOcean droplet.  
API documentation (Swagger UI) is available at **[https://juices.live/docs](https://juices.live/docs)**.

---

## Project Context

This repository is a **university exam project** (DIS). It is built to demonstrate full-stack development, real-time communication, API design, and integration with third-party services—not as production-ready enterprise software.

---

## Authors

- [Amanda Frithjof Bonde](https://www.linkedin.com/in/amandabonde) — 162423  
- [Thøger Elung-Jensen](https://www.linkedin.com/in/th%C3%B8ger-elung-jensen-b687b9249) — 162129  
- [Troels Philip Rohde](https://www.linkedin.com/in/troelsprohde/) — 161078  
- [Gustav Christian Søgård](https://www.linkedin.com/in/gustavsogard/) — 160921  
