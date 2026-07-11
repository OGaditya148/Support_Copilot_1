import { getTicketDetails } from "@/app/actions/tickets";
import { TicketDetailClient } from "./TicketDetailClient";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ticket = await getTicketDetails({ ticketId: id });
    return { title: `${ticket.subject} — SupportCopilot` };
  } catch {
    return { title: "Ticket — SupportCopilot" };
  }
}

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const ticket = await getTicketDetails({ ticketId: id });

  // Serialize Dates so they cross the Server→Client boundary as strings
  const serialized = {
    ...ticket,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    replies: ticket.replies.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
  };

  return (
    <TicketDetailClient
      ticket={serialized as any}
      currentUserEmail={(session.user as any).email ?? "agent"}
    />
  );
}
