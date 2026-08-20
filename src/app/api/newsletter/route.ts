import { NextResponse } from "next/server";

// Always run server-side; never cached at the framework level.
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Module-scoped in-memory store for subscribed emails.
// (Vercel Hobby has no DB for this; in-memory Set is acceptable for a landing
// page newsletter capture. Survives per-instance, not across cold starts.)
const subscribers = new Set<string>();

// Pragmatic email regex — sufficient for landing page capture.
// Disallows whitespace, requires single @, requires a dot in the domain,
// requires 1+ chars on each side of @ and the dot.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface NewsletterPayload {
  ok: boolean;
  message?: string;
  error?: string;
}

function bad(error: string) {
  return NextResponse.json<NewsletterPayload>(
    { ok: false, error },
    {
      status: 400,
      headers: { "Cache-Control": "no-store" },
    }
  );
}

function ok(message: string) {
  return NextResponse.json<NewsletterPayload>(
    { ok: true, message },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    }
  );
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return bad("Invalid JSON");
  }

  const email =
    typeof body === "object" && body !== null && "email" in body
      ? String((body as { email: unknown }).email ?? "").trim().toLowerCase()
      : "";

  if (!email || !EMAIL_RE.test(email)) {
    return bad("Invalid email");
  }

  if (subscribers.has(email)) {
    return bad("Already subscribed");
  }

  subscribers.add(email);
  return ok("Subscribed!");
}

// Optional GET — returns the current count without exposing emails.
export async function GET() {
  return NextResponse.json(
    { count: subscribers.size },
    { headers: { "Cache-Control": "no-store" } }
  );
}
