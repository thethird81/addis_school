# Addis School - Modern Fullstack Application

A modern fullstack web application for Addis School with three main components:

- **client/** - Public-facing website (HTML/CSS/JS with Webpack)
- **admin/** - Admin panel (Next.js 14 with TypeScript)
- **server/** - Backend API (Node.js/Express with Prisma)

## Project Structure

```
addis_school/
├── client/          # Public website - deploys to Netlify
├── admin/           # Admin panel - deploys to Vercel
├── server/          # Backend API - deploys to Render
├── shared/          # Shared code between components
├── docs/            # Documentation
└── scripts/         # Build and deployment scripts
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm 9+
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/thethird81/addis_school.git
   cd addis_school
   ```

2. Install dependencies for all workspaces:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in the `/server` directory
   - Add your Supabase credentials and database URL

4. Set up the database:
   ```bash
   cd server
   npx prisma migrate dev
   npx prisma generate
   ```

## Development

### Run all services in development mode:
```bash
npm run dev:client    # Start client on http://localhost:3000
npm run dev:admin     # Start admin on http://localhost:3001
npm run dev:server    # Start server on http://localhost:5000
```

### Run individual services:
```bash
# Client (Webpack dev server)
npm run dev --workspace=client

# Admin (Next.js dev server)
npm run dev --workspace=admin

# Server (Node.js with nodemon)
npm run dev --workspace=server
```

### Build for production:
```bash
npm run build --workspaces
```

## Deployment

### Client (Netlify)
```bash
cd client
npm run build
# Deploy the /dist folder to Netlify
```

### Admin (Vercel)
```bash
cd admin
npm run build
# Connect to Vercel for automatic deployments
```

### Server (Render)
```bash
cd server
# Deploy to Render with Node.js environment
# Ensure all environment variables are set
```

## Tech Stack

### Client
- HTML5, CSS3, JavaScript (ES6+)
- Webpack 5 with ES5 transpilation
- Babel for legacy browser support
- PostCSS with autoprefixer
- Supabase client

### Admin
- Next.js 14 (App Router)
- TypeScript
- React 18
- Tailwind CSS (or CSS Modules)
- Axios for API calls

### Server
- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- JWT authentication
- Supabase integration

## Documentation

- [Setup Guide](docs/SETUP.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [API Documentation](docs/API.md)

## License

ISC

</parameter>
<parameter=requires_approval>false</requires_approval>
<task_progress>
- [x] Explore existing frontend structure
- [x] Explore existing backend structure
- [x] Design new folder structure
- [x] Create new git branch
- [x] Present plan to user
- [x] Adjusting plan based on .clinerules requirements
- [x] Finalize implementation plan
- [x] Create root folder structure
- [ ] Set up client folder with existing code
- [ ] Set up server folder with existing code
- [ ] Set up admin folder with Next.js
- [ ] Set up shared folder
- [ ] Create root configuration files
- [ ] Create documentation
</task_progress>
</write_to_file>