"use client";
import { useState } from "react";
import { Loader2, CheckCircle2, AlertTriangle, QrCode } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// ── Sibsagar University — Academic Departments ─────────────────────────────────
const ARTS_DEPARTMENTS = ["Assamese", "English", "Economics", "Education", "History", "Political Science"];
const SCIENCE_DEPARTMENTS = ["Chemistry", "Computer Science", "Geology", "Life Sciences", "Mathematics", "Physics"];
const PROFESSIONAL_DEPARTMENTS = ["Entrepreneurship & Management", "Public Policy and Law", "Teacher Education"];

// Class / programme level
const CLASSES = ["UG", "PG", "MCA", "MBA", "LLM", "PhD / Research Scholar"];

type State = "idle" | "submitting" | "success" | "error";

const field =
  "w-full rounded-xl bg-white/5 border border-white/10 px-3 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30";

export default function AttendanceForm({
  sessionId,
  token,
  sessionTitle,
}: {
  sessionId: string;
  token: string;
  sessionTitle: string;
}) {
  const [name, setName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [customClass, setCustomClass] = useState("");
  const [department, setDepartment] = useState("");
  const [customDept, setCustomDept] = useState("");
  const [semester, setSemester] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const finalDept = department === "Other" ? customDept.trim() : department;
  const finalClass = studentClass === "Other" ? customClass.trim() : studentClass;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) return setErrorMsg("Please enter your full name");
    if (!finalClass) return setErrorMsg("Please select your class");
    if (!finalDept) return setErrorMsg("Please select a department");
    if (!semester) return setErrorMsg("Please select your semester");
    if (!rollNumber.trim()) return setErrorMsg("Roll number is required");

    setState("submitting");
    setErrorMsg("");

    try {
      const res = await fetch(`${API_URL}/api/attendance/submit/${sessionId}/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          studentClass: finalClass,
          department: finalDept,
          semester: Number(semester),
          rollNumber: rollNumber.trim().toUpperCase(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = (err as { message?: string }).message ?? "Submission failed";
        if (res.status === 409) {
          if (msg.toLowerCase().includes("already been used") || msg.toLowerCase().includes("used")) {
            setErrorMsg("This QR code has already been used by another student.");
          } else if (msg.toLowerCase().includes("already")) {
            setErrorMsg("You have already submitted attendance for this session.");
          } else {
            setErrorMsg(msg);
          }
        } else if (res.status === 410) {
          setErrorMsg("This QR code is no longer valid. The session has closed.");
        } else {
          setErrorMsg(msg);
        }
        setState("error");
        return;
      }

      setState("success");
    } catch {
      setErrorMsg("Network error. Please try again.");
      setState("error");
    }
  }

  // ── Success screen ───────────────────────────────────────────────────────────
  if (state === "success") {
    const rows: [string, string][] = [
      ["Name", name.trim()],
      ["Class", finalClass],
      ["Department", finalDept],
      ["Semester", semester],
      ["Roll Number", rollNumber.toUpperCase()],
    ];
    return (
      <div className="min-h-screen bg-[#0f1117] flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-2xl bg-[#13161f] border border-emerald-500/20 p-10 text-center">
          <CheckCircle2 className="h-20 w-20 text-emerald-400 mx-auto" />
          <h2 className="text-xl font-bold text-white mt-4 mb-2">Attendance Recorded!</h2>
          <p className="text-sm text-white/50">
            Your attendance for <span className="text-white font-medium">{sessionTitle}</span> has been
            successfully submitted.
          </p>
          <div className="mt-6 rounded-xl bg-white/5 border border-white/6 p-4 text-left space-y-2 text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <span className="text-white/40">{k}</span>
                <span className={`text-white text-right ${k === "Roll Number" ? "font-mono" : "font-medium"}`}>
                  {v}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-white/20 mt-6">You may close this page.</p>
        </div>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0f1117] flex flex-col items-center px-4 py-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-5">
          <div className="flex items-center justify-center h-14 rounded-2xl bg-gold/10 mb-4">
            <QrCode className="h-7 w-7 text-gold" />
            <h1 className="text-xl font-bold text-white">{sessionTitle}</h1>
          </div>
          <p className="text-sm text-white/40 mt-1">Fill in your details to mark attendance</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">Full Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrorMsg(""); }}
              placeholder="Your full name"
              autoComplete="name"
              maxLength={100}
              className={field}
              required
            />
          </div>

          {/* Class */}
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">Class *</label>
            <select
              value={studentClass}
              onChange={(e) => { setStudentClass(e.target.value); setErrorMsg(""); }}
              className={`${field} appearance-none`}
              required
            >
              <option value="" className="bg-[#13161f]">Select your class…</option>
              {CLASSES.map((c) => (
                <option key={c} value={c} className="bg-[#13161f]">{c}</option>
              ))}
              <option value="Other" className="bg-[#13161f]">Other</option>
            </select>
          </div>

          {studentClass === "Other" && (
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Class Name *</label>
              <input
                type="text"
                value={customClass}
                onChange={(e) => setCustomClass(e.target.value)}
                placeholder="Enter your class…"
                className={field}
                required
              />
            </div>
          )}

          {/* Department */}
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">Department *</label>
            <select
              value={department}
              onChange={(e) => { setDepartment(e.target.value); setErrorMsg(""); }}
              className={`${field} appearance-none`}
              required
            >
              <option value="" className="bg-[#13161f]">Select your department…</option>
              <optgroup label="Arts" className="bg-[#13161f]">
                {ARTS_DEPARTMENTS.map((d) => (
                  <option key={d} value={d} className="bg-[#13161f]">{d}</option>
                ))}
              </optgroup>
              <optgroup label="Science" className="bg-[#13161f]">
                {SCIENCE_DEPARTMENTS.map((d) => (
                  <option key={d} value={d} className="bg-[#13161f]">{d}</option>
                ))}
              </optgroup>
              <optgroup label="Management, Law &amp; Professional" className="bg-[#13161f]">
                {PROFESSIONAL_DEPARTMENTS.map((d) => (
                  <option key={d} value={d} className="bg-[#13161f]">{d}</option>
                ))}
              </optgroup>
              <option value="Other" className="bg-[#13161f]">Other</option>
            </select>
          </div>

          {department === "Other" && (
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">Department Name *</label>
              <input
                type="text"
                value={customDept}
                onChange={(e) => setCustomDept(e.target.value)}
                placeholder="Enter your department…"
                className={field}
                required
              />
            </div>
          )}

          {/* Semester */}
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">Semester *</label>
            <select
              value={semester}
              onChange={(e) => { setSemester(e.target.value); setErrorMsg(""); }}
              className={`${field} appearance-none`}
              required
            >
              <option value="" className="bg-[#13161f]">Select semester…</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1} className="bg-[#13161f]">
                  Semester {i + 1}
                </option>
              ))}
            </select>
          </div>

          {/* Roll number */}
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">Roll Number *</label>
            <input
              type="text"
              value={rollNumber}
              onChange={(e) => { setRollNumber(e.target.value); setErrorMsg(""); }}
              placeholder="e.g. B25210074"
              className={`${field} uppercase font-mono tracking-wider`}
              required
            />
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{errorMsg}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={state === "submitting"}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gold/90 hover:bg-gold py-4 text-base font-bold text-black transition-colors disabled:opacity-60 mt-2"
          >
            {state === "submitting" && <Loader2 className="h-5 w-5 animate-spin" />}
            {state === "submitting" ? "Submitting…" : "Submit Attendance"}
          </button>
        </form>

        <p className="text-center text-xs text-white/20 mt-6">
          Your information is securely stored and used only for attendance tracking.
        </p>
      </div>
    </div>
  );
}