# Architecture

- **Framework**: Next.js App Router (TypeScript, Server Actions)
- **Database**: PostgreSQL mapped with Prisma
- **Vector Search**: `pgvector` for similarity matching
- **Auth**: Auth.js (v5) with email+password and OAuth
- **RAG**: Embeddings via OpenAI `text-embedding-3-small`, generation via Anthropic `claude-3-5-sonnet-20240620`.
- **Styling**: Tailwind CSS, shadcn/ui inspired primitives, responsive design (desktop first)
- **Deployment**: Vercel

## Key Flows
1. **Ticket Ingestion** -> Agent dashboard
2. **AI Drafts** -> Agent requests RAG AI draft -> Context matching -> Claude generation -> Saved as draft
3. **Admin** -> Manages Knowledge Base articles -> Embeddings auto-generated on save
