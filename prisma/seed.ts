import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database…");

  // ── Users ────────────────────────────────────────────────────────────────
  const COST = 12;
  const adminHash = await bcrypt.hash("Password123!", COST);
  const agentHash = await bcrypt.hash("Password123!", COST);

  const admin = await prisma.user.upsert({
    where: { email: "admin@test.com" },
    update: {},
    create: {
      email: "admin@test.com",
      passwordHash: adminHash,
      role: "admin",
    },
  });

  const agent = await prisma.user.upsert({
    where: { email: "agent@test.com" },
    update: {},
    create: {
      email: "agent@test.com",
      passwordHash: agentHash,
      role: "agent",
    },
  });

  console.log(`  ✔ Users: ${admin.email} (admin), ${agent.email} (agent)`);

  // ── Tickets ───────────────────────────────────────────────────────────────
  const tickets = [
    {
      subject: "Cannot log in to my account after password reset",
      body: "I reset my password using the email link but now I get 'Invalid credentials' every time I try to log in. I have tried three different browsers. Please help.",
      status: "open" as const,
      priority: "high" as const,
      requesterEmail: "alice@customer.com",
    },
    {
      subject: "Refund request for order #48291",
      body: "I ordered the wrong size and would like a full refund. The item is unused and still in original packaging. Order was placed 5 days ago.",
      status: "pending" as const,
      priority: "med" as const,
      requesterEmail: "bob@customer.com",
    },
    {
      subject: "Package not delivered — tracking shows 'Out for delivery' for 3 days",
      body: "My tracking number TRK-993421 has been stuck on 'Out for delivery' since Monday. I have contacted the courier and they said to reach out to the seller.",
      status: "open" as const,
      priority: "high" as const,
      requesterEmail: "carol@customer.com",
    },
    {
      subject: "How do I export my data as CSV?",
      body: "I need to export all my transaction history as a CSV for my accountant. I cannot find this option in the dashboard settings.",
      status: "resolved" as const,
      priority: "low" as const,
      requesterEmail: "dave@customer.com",
    },
  ];

  for (const t of tickets) {
    await prisma.ticket.upsert({
      where: {
        // Upsert by a stable compound — use subject as proxy since there's no unique constraint
        // Fall back to create only: find first or create pattern
        id: (await prisma.ticket.findFirst({ where: { subject: t.subject } }))?.id ?? "new-" + Math.random(),
      },
      update: {},
      create: {
        ...t,
        assigneeId: agent.id,
      },
    });
  }

  console.log(`  ✔ Tickets: ${tickets.length} created/verified`);

  // ── Articles ──────────────────────────────────────────────────────────────
  const articles = [
    {
      title: "How to reset your password",
      body: `## Password Reset Guide

If you're unable to log in, follow these steps to reset your password:

1. Click **"Forgot password?"** on the login page.
2. Enter the email address associated with your account.
3. Check your inbox for a reset link (also check your spam folder).
4. Click the link — it expires in **60 minutes**.
5. Enter your new password (minimum 8 characters, at least one number).
6. Click **Save** and log in with your new credentials.

**Still locked out?** Contact support with your account email and we'll manually verify your identity.`,
      tags: ["account", "password", "login"],
    },
    {
      title: "Refund policy",
      body: `## Our Refund Policy

We offer a **30-day no-questions-asked refund** on all orders.

### Eligibility
- Item must be in original, unused condition.
- Proof of purchase (order number) is required.
- Digital downloads are non-refundable once accessed.

### How to Request a Refund
1. Open a support ticket with your order number.
2. Our team will review and approve within **1–2 business days**.
3. Refunds are issued to the original payment method within **5–7 business days**.

### Exchanges
We offer free size/color exchanges within 30 days. Shipping both ways is covered by us.`,
      tags: ["refund", "returns", "policy", "orders"],
    },
    {
      title: "Shipping delays — what to do",
      body: `## Shipping Delays

We understand delays are frustrating. Here's how to handle them:

### Check Your Tracking
Visit our **Order Tracking** page and enter your tracking number. Most delays update within 24 hours.

### Common Reasons for Delay
- High seasonal volume (holidays, sales events)
- Weather disruptions
- Customs clearance for international orders
- Incorrect address — verify your shipping address in account settings

### What We Can Do
- If your package is **5+ days late**, open a ticket and we will file a carrier investigation.
- If your package is **confirmed lost**, we will ship a replacement at no cost within 3 business days.

### Contact
Include your order number and tracking number when contacting support so we can help faster.`,
      tags: ["shipping", "delivery", "tracking", "delays"],
    },
  ];

  for (const a of articles) {
    const existing = await prisma.article.findFirst({ where: { title: a.title } });
    if (!existing) {
      await prisma.article.create({
        data: {
          ...a,
          // embedding is omitted here — it will be generated when the article is
          // accessed via the admin upsert action (which calls generateEmbedding).
        },
      });
    }
  }

  console.log(`  ✔ Articles: ${articles.length} created/verified`);
  console.log("\n✅ Seed complete!");
  console.log("   Admin  → admin@test.com  / Password123!");
  console.log("   Agent  → agent@test.com  / Password123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
