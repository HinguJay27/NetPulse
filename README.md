

# ⚡ NetPulse

### Cloud-Based Network Performance Analyzer

**Monitor your network. Analyze performance. Understand connectivity.**

A web-based network analysis dashboard designed to help users explore network performance, connectivity, DNS resolution, latency, and other network metrics.

[🌐 Live Demo](https://netpulse-65dz.onrender.com/) · [📂 GitHub Repository](https://github.com/HinguJay27/NetPulse.git)

![React](https://img.shields.io/badge/React-2026-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-Powered-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-Styling-06B6D4?logo=tailwindcss&logoColor=white)
![Deployment](https://img.shields.io/badge/Deployment-Render-46E3B7?logo=render&logoColor=white)



---

## 📌 About the Project

**NetPulse** is a web-based network performance analyzer developed to provide a convenient interface for examining network connectivity and performance.

The project combines a modern dashboard with network diagnostic tools and visual representations of network-related information.

It is designed as a practical learning project that connects frontend development with computer networking concepts, including TCP/IP, DNS, HTTP/HTTPS, IP addressing, and client-server architecture.

### 🎯 Project Objectives

- Analyze network connectivity and performance.
- Explore latency and ping-related measurements.
- Perform DNS-related checks.
- Present network information through interactive visualizations.
- Understand network diagnostic techniques.
- Develop a foundation for integrating a Python-based network agent and cloud backend.

## ✨ Features

### 📊 Interactive Dashboard
- Modern network monitoring interface.
- Visual representations of network-related metrics.
- Organized navigation between diagnostic tools.
- Dark and light themes.

### 📡 Ping Test
- Interface for running ping-related checks.
- Displays packet-loss and latency-related results.
- Intended to help users understand network reachability.

**Note:** Browser-based implementations cannot directly execute standard ICMP ping. Reliable ICMP measurements require an appropriate local agent or another compatible measurement mechanism.

### 🌐 DNS Lookup
- DNS-related lookup functionality.
- Helps users explore domain resolution.
- Introduces the relationship between domain names and IP addresses.

### 🚀 Speed Test
- Interface for network speed testing.
- Presents performance-related information visually.

Actual throughput accuracy depends on the implemented measurement method and test server.

### 🔌 Connectivity Test
- Provides a way to examine connectivity-related information.
- Helps users understand network availability.

### 🗺️ Traceroute
- Provides a traceroute-related interface.
- Introduces the concept of examining network paths between a source and destination.

**Important:** A simulated route must not be interpreted as a real traceroute. Genuine route measurements require system-level tools or a compatible network service.

### 💻 Network Information
- Browser-accessible network information.
- Connectivity-related details where supported by the browser.

Browser restrictions may limit access to local IP addresses and other system-level information.

### 📈 Charts and History
- Visual presentation of supported measurements.
- Historical results stored using browser storage in the current implementation.

Browser-local history is not automatically synchronized across devices.

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| React | User interface development |
| TypeScript | Type-safe application development |
| Vite | Development server and build tooling |
| Tailwind CSS | Responsive styling |
| Recharts | Charts and data visualization |
| Lucide React | Icons |
| Browser APIs | Browser-accessible network checks |
| localStorage | Local storage of historical results |
| Render | Hosting the deployed web application |

### 🔮 Planned Technologies

The following technologies are part of the proposed backend architecture and should be considered planned integrations until they are implemented and verified.

| Technology | Planned Purpose |
|---|---|
| Python | Local network agent and network testing |
| FastAPI | Backend API |
| Supabase PostgreSQL | Persistent storage |
| GitHub | Source code management |
| Render | Frontend and potential backend hosting |

## 🏗️ Project Architecture

### Current Implementation

The existing application primarily uses a browser-based frontend.

```text
                ┌─────────────────────┐
                │       User          │
                └──────────┬──────────┘
                           │
                           ▼
                ┌─────────────────────┐
                │   React Frontend    │
                │   TypeScript + Vite │
                └──────────┬──────────┘
                           │
                           ▼
                ┌─────────────────────┐
                │ Browser-Based Tests │
                │                     │
                │ DNS / Connectivity  │
                │ Speed / Ping UI     │
                └──────────┬──────────┘
                           │
                           ▼
                ┌─────────────────────┐
                │ Browser localStorage│
                │   Local History     │
                └─────────────────────┘
```

The actual measurement capabilities depend on each test's implementation. Browser-based tests do not provide unrestricted access to operating-system networking tools.

### Planned Architecture

The intended architecture separates the frontend, local network measurements, backend API, and persistent storage.

```text
                 ┌─────────────────────┐
                 │    React Frontend   │
                 │       Render        │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │    FastAPI Backend  │
                 │       Render        │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │  Local Network Agent│
                 │       Python        │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │  Network Diagnostics│
                 │ Ping / DNS / TCP    │
                 │ HTTP / Traceroute   │
                 └─────────────────────┘

                 FastAPI Backend
                        │
                        ▼
                 ┌─────────────────────┐
                 │ Supabase PostgreSQL │
                 │   Planned Storage   │
                 └─────────────────────┘
```

**Architecture note:** The local agent must run on the computer whose network is being measured. A cloud-hosted backend cannot independently measure the user's laptop network as if it were running locally. Communication between the frontend, backend, and local agent must be implemented securely.

## 📂 Project Structure

The existing frontend is based on React, TypeScript, and Vite.

A simplified representation of the known project files is:

```text
NetPulse/
│
├── public/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── lib/
│   │   ├── network.ts
│   │   └── storage.ts
│   ├── App.tsx
│   └── main.tsx
│
├── package.json
├── package-lock.json
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── .gitignore
└── README.md
```

*This is a simplified overview. Your actual folder structure may contain additional files and directories.*

## 🚀 Getting Started

Follow these steps to run the frontend locally.

### Prerequisites

Install the following:

- [Node.js](https://nodejs.org/)
- npm, included with Node.js
- [Git](https://git-scm.com/)

### 1. Clone the Repository

Open a terminal and execute:

```bash
git clone https://github.com/HinguJay27/NetPulse.git
```

### 2. Navigate to the Project

```bash
cd NetPulse
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Development Server

```bash
npm run dev
```

### 5. Open the Application

Open the local URL printed in your terminal. Vite commonly uses:

```text
http://localhost:5173
```

The actual port may differ if that port is already occupied.

### 6. Build for Production

To create a production build, run:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

## ☁️ Deployment

The current live frontend is hosted on Render.

**Live application:** [https://netpulse-65dz.onrender.com/](https://netpulse-65dz.onrender.com/)

### Frontend Deployment Steps

1. Push your latest working code to GitHub.
2. Open your Render dashboard.
3. Create or select the frontend web service.
4. Connect the `HinguJay27/NetPulse` repository.
5. Configure the build command:

   ```bash
   npm install && npm run build
   ```

6. Configure the publish directory according to your Render service type and project settings. For a typical static Vite site, use:

   ```text
   dist
   ```

7. Deploy the application.
8. Open the live website and test the available features.

**Note:** A future FastAPI backend will require a separate service configuration if deployed independently. Its URL and any necessary environment variables must be configured in the frontend.

## 🧪 Testing and Troubleshooting

### Ping Test Shows 100% Packet Loss

A 100% packet-loss result does not automatically mean your internet connection is unavailable.

Possible causes include:

- The browser cannot execute ICMP ping directly.
- The application uses a browser-based approximation.
- The implementation reports failed browser requests as packet loss.
- The target does not respond to ICMP requests.
- A firewall or network configuration blocks the test.

To check basic ICMP connectivity on Windows, run:

```bash
ping -n 4 8.8.8.8
```

Compare the result with NetPulse.

If the command receives replies but the website reports 100% packet loss, inspect `src/lib/network.ts` to determine how the application calculates the ping result before modifying the code.

### DNS Test Fails

Possible causes include:

- DNS resolution errors.
- Browser security restrictions.
- Cross-origin restrictions.
- An unavailable DNS endpoint.

Inspect the browser console and Network tab for the actual error.

### Website Does Not Load

Try the following:

1. Refresh the page.
2. Check your internet connection.
3. Review the browser console.
4. Inspect the Render deployment logs.
5. Verify that the latest deployment completed successfully.

## 🔐 Security and Privacy

Network diagnostic applications should handle network information responsibly.

- Do not publish passwords, API keys, access tokens, or database credentials.
- Keep private environment variables out of GitHub.
- Restrict diagnostic operations to authorized targets.
- Validate user-supplied hostnames and addresses before using them in backend commands.
- Avoid exposing unrestricted command execution through an API.
- Configure appropriate authentication and access controls before storing user-specific history.
- Do not assume browser-local storage is encrypted or suitable for sensitive information.

## 📚 Computer Networking Concepts

NetPulse provides a practical starting point for exploring the following topics:

| Concept | Application |
|---|---|
| TCP/IP | Network communication |
| ICMP | Ping and reachability testing |
| DNS | Domain name resolution |
| TCP | Connection establishment and port connectivity |
| HTTP/HTTPS | Web communication and connectivity checks |
| IP Addressing | Identifying network endpoints |
| Latency | Measuring response time |
| Packet Loss | Understanding missing packets in a valid measurement |
| Traceroute | Examining network paths |
| Client-Server Architecture | Communication between application components |
| Cloud Computing | Hosting web applications and backend services |

## 🔮 Future Enhancements

Planned improvements include:

- [ ] Implement a Python-based local network agent.
- [ ] Integrate a FastAPI backend.
- [ ] Implement genuine ICMP ping measurements.
- [ ] Implement operating-system-based traceroute.
- [ ] Improve DNS and TCP diagnostic accuracy.
- [ ] Connect Supabase PostgreSQL for persistent history.
- [ ] Add user authentication.
- [ ] Provide historical performance analytics.
- [ ] Improve error handling and diagnostic messages.
- [ ] Add automated tests.
- [ ] Improve deployment and monitoring.

These enhancements should be marked complete only after implementation and testing.

## 🎓 Learning Outcomes

This project can help developers gain practical experience with:

- React and TypeScript.
- Responsive web interface development.
- API integration.
- Computer networking fundamentals.
- Network diagnostic techniques.
- Data visualization.
- Frontend deployment.
- Backend architecture and database integration.

## 👨‍💻 Author

**Jay Hingu**

GitHub: [@HinguJay27](https://github.com/HinguJay27)

Project: [NetPulse](https://github.com/HinguJay27/NetPulse)

Live Demo: [NetPulse on Render](https://netpulse-65dz.onrender.com/)

## 📄 License

A license has not been specified here. Add a `LICENSE` file to the repository if you intend to distribute the project under an open-source license.

---


### ⚡ NetPulse

**Understand Your Network. Measure What Matters.**

Built with React, TypeScript, and modern web technologies.

</div>
