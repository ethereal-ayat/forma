import { createFileRoute } from "@tanstack/react-router";
import { Ban, Cpu, Download, FolderOpen, ShieldCheck, WifiOff } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy — Forma" },
      { name: "description", content: "How Forma converts files on your device without uploads, accounts, ads or tracking." },
      { property: "og:title", content: "Privacy — Forma" },
      { property: "og:description", content: "How Forma converts files on your device without uploads, accounts, ads or tracking." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Privacy,
});

const STEPS = [
  { icon: FolderOpen, title: "You choose a file", text: "It's opened in your browser's memory — not sent anywhere." },
  { icon: Cpu, title: "Your device converts it", text: "The engine runs on your own computer or phone." },
  { icon: Download, title: "You save the result", text: "The file goes to your Downloads, then memory is released." },
];

const STORED = [
  ["Your files", "Never stored or uploaded"],
  ["Settings (theme, quality)", "Saved only in this browser"],
  ["Recently used tools", "Saved only in this browser — can be turned off in Settings"],
];

function Privacy() {
  return (
    <div className="max-w-3xl space-y-10">
      <header>
        <ShieldCheck className="size-8 text-ready" />
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Your files stay on your device.</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          Forma converts files inside your browser. There is no conversion server, no account, and nothing to upload.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <div key={s.title} className="rounded-2xl bg-card p-4 shadow-card">
            <span className="font-mono text-[11px] text-muted-foreground">0{i + 1}</span>
            <s.icon className="mt-2 size-5 text-primary" />
            <h2 className="mt-2 text-[14px] font-semibold">{s.title}</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">{s.text}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-[15px] font-semibold">What Forma keeps</h2>
        <dl className="divide-y divide-border rounded-2xl bg-card shadow-card">
          {STORED.map(([k, v]) => (
            <div key={k} className="flex flex-col gap-1 px-4 py-3 text-[13.5px] sm:flex-row sm:justify-between">
              <dt className="font-medium">{k}</dt>
              <dd className="text-muted-foreground">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="rounded-2xl bg-card p-5 shadow-card">
        <div className="flex items-center gap-2 text-[14px] font-semibold"><Ban className="size-4 text-destructive" /> Forma never</div>
        <p className="mt-2 text-[13.5px] text-muted-foreground">Uploads your files · asks you to sign up · shows ads · uses tracking cookies or analytics · charges for conversions.</p>
      </section>

      <section className="rounded-2xl bg-ready-soft p-5">
        <div className="flex items-center gap-2 text-[14px] font-semibold"><WifiOff className="size-4 text-ready" /> Check it yourself</div>
        <p className="mt-2 text-[13.5px] text-foreground/80">
          Open a ready tool, then turn off Wi-Fi. Conversions keep working, because nothing needs the internet.
        </p>
      </section>

      <p className="text-[12.5px] text-muted-foreground">
        To be fully transparent: the website itself is delivered by a hosting provider, which — like any web server — sees standard
        connection details when the page loads. It never receives your files.
      </p>
    </div>
  );
}
