# SupportCopilot 🚀

SupportCopilot is an AI-powered support-ticket application designed to empower agents with instant, RAG-driven drafted replies grounded in a team knowledge base.

![Screenshot Placeholder](https://via.placeholder.com/1200x630.png?text=SupportCopilot+UI)

## Quick Start
1. `npm install`
2. Set up Postgres and run `npx prisma db push`
3. `npm run dev`

## Environment Variables
| Variable | Description |
| --- | --- |
| `DATABASE_URL` | Postgres connection string (pgvector required) |
| `ANTHROPIC_API_KEY` | For Claude drafts |
| `OPENAI_API_KEY` | For text embeddings |
| `AUTH_SECRET` | NextAuth secret |
| `GOOGLE_CLIENT_ID` | OAuth ID |
| `GOOGLE_CLIENT_SECRET` | OAuth Secret |

## Demo Login
- Agent: agent@example.com / password
- Admin: admin@example.com / password
