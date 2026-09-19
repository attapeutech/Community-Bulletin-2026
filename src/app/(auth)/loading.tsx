// Mirrors AuthShell: centred single-column card on a dark ground.
export default function AuthLoading() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ce-ground px-6 py-10">
      <div
        className="pointer-events-none absolute -top-[220px] left-1/2 h-[520px] w-[min(820px,100vw)] -translate-x-1/2"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 50%, rgba(62,230,209,0.14), rgba(79,124,255,0.06) 55%, transparent 75%)",
        }}
      />
      <div className="relative w-full max-w-[440px]">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <div className="h-[26px] w-[26px] rounded-[7px] bg-ce-line4" />
          <div className="h-4 w-28 rounded bg-ce-line4" />
        </div>
        <div className="rounded-[20px] border border-ce-line3 bg-ce-surface/70 px-8 pb-8 pt-9">
          <div className="mb-3 h-8 w-48 rounded bg-ce-line4" />
          <div className="mb-8 h-4 w-64 rounded bg-ce-line3" />
          <div className="mb-2 h-3 w-24 rounded bg-ce-line3" />
          <div className="mb-5 h-[50px] w-full rounded-xl bg-ce-card" />
          <div className="mb-2 h-3 w-20 rounded bg-ce-line3" />
          <div className="mb-6 h-[50px] w-full rounded-xl bg-ce-card" />
          <div className="h-[52px] w-full rounded-xl bg-ce-line4" />
        </div>
      </div>
    </div>
  );
}
