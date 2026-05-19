# VividHead Frontend (Vercel / Next.js)

The Next.js 14 App Router client for VividHead, meticulously engineered to provide an engaging, immersive experience. It features our signature "Anti-Gravity" UI powered by Tailwind CSS, sophisticated glassmorphism effects, Framer Motion coordinate transitions, and a neon mesh overlay for direct visual feedback.

## Features at a Glance
- **Anti-Gravity UX**: Floating glass panes, vibrant neon glows, and dark space motifs.
- **Micro-interactions**: Subtle hover states mapped to user behaviors, with Lucide React icons.
- **Dynamic Framer Motion**: Deep sequential mounting and context-aware staggering.
- **Instant Result Rendering**: Direct parsing and staging of complex JSON results from the VividHead API.

## Environment Variables

Create `.env.local` in `frontend/` to point to the backend API:

```bash
# Set this to the Hugging Face Space endpoint in production
NEXT_PUBLIC_API_URL=http://localhost:7860
```

## System Requirements
- Node.js `^20.x` or later.
- NPM `^10.x` or later.

## Local Development Initialization

To get started with local UI scaling and debugging:

```bash
cd frontend
# Install dependencies, allowing legacy dependencies if necessary:
npm install --legacy-peer-deps
# Spin up the Next.js dev server:
npm run dev
```

Open `http://localhost:3000`. You should see the Anti-Gravity environment immediately load.

## Vercel Deployment

1. Import `frontend/` as a Vercel project.
2. Add `NEXT_PUBLIC_API_URL` env variable in project settings.
3. Deploy with default Next.js preset.
4. Prefer Edge runtime for lightweight future API routes when added.
