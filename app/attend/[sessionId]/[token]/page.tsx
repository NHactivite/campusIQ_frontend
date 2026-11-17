import { Suspense } from "react";
import AttendanceForm from "./AttendanceForm";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type TokenVerifyResult =
  | { valid: true; sessionTitle: string; sessionStatus: "open" | "closed" }
  | { valid: false; reason: string };

async function verifyToken(
  sessionId: string,
  token: string
): Promise<TokenVerifyResult> {
  try {
    const res = await fetch(
      `${API_URL}/api/attendance/submit/${sessionId}/${token}`,
      { cache: "no-store" }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        valid: false,
        reason:
          (err as { message?: string }).message ??
          (res.status === 404 ? "Invalid QR code" : "Session not found"),
      };
    }
    const data = await res.json();
    return {
      valid: true,
      sessionTitle: data.session?.title ?? data.data?.sessionTitle ?? "Attendance",
      sessionStatus: (data.session?.status ?? data.data?.sessionStatus ?? "open") as "open" | "closed",
    };
  } catch {
    return { valid: false, reason: "Could not connect to server" };
  }
}

export default async function AttendPage({
  params,
}: {
  params: Promise<{ sessionId: string; token: string }>;
}) {
  const { sessionId, token } = await params;
  const result = await verifyToken(sessionId, token);

  if (!result.valid) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-2xl bg-[#13161f] border border-red-500/20 p-8 text-center">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-lg font-bold text-red-400 mb-2">Invalid QR Code</h1>
          <p className="text-sm text-white/50">{result.reason}</p>
        </div>
      </div>
    );
  }

  if (result.sessionStatus === "closed") {
    return (
      <div className="min-h-screen bg-[#0f1117] flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-2xl bg-[#13161f] border border-amber-500/20 p-8 text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-lg font-bold text-amber-400 mb-2">Session Closed</h1>
          <p className="text-sm text-white/50">
            This attendance session has ended. Submissions are no longer accepted.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-2 border-gold border-t-transparent rounded-full" />
        </div>
      }
    >
      <AttendanceForm
        sessionId={sessionId}
        token={token}
        sessionTitle={result.sessionTitle}
      />
    </Suspense>
  );
}
