import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ThemeToggle } from "@/components/forma/ThemeToggle";
import { useSettings } from "@/lib/settings";
import { outputFileName } from "@/lib/formats";
import { TOOLS } from "@/lib/tools";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Forma" },
      { name: "description", content: "Choose Forma's appearance, conversion defaults and what this browser remembers." },
      { property: "og:title", content: "Settings — Forma" },
      { property: "og:description", content: "Choose Forma's appearance, conversion defaults and what this browser remembers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-[12px] font-medium uppercase tracking-wider text-muted-foreground">{title}</h2>
      <div className="divide-y divide-border rounded-2xl bg-card shadow-card">{children}</div>
    </section>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[13.5px] font-medium">{label}</p>
        {hint && <p className="text-[12.5px] text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function SettingsPage() {
  const { settings, update, reset, clearRecent, recent } = useSettings();
  const ready = TOOLS.filter((t) => t.status === "ready").length;
  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-3xl font-semibold tracking-[-0.03em]">Settings</h1>
      <Group title="Appearance">
        <Row label="Theme" hint="Light, dark, or follow your device."><ThemeToggle /></Row>
        <Row label="Reduce motion" hint="Turn off animations and transitions.">
          <Switch checked={settings.reduceMotion} onCheckedChange={(v) => update({ reduceMotion: v })} />
        </Row>
      </Group>
      <Group title="Conversion defaults">
        <Row label="Image quality" hint={`${settings.imageQuality}% — used for JPG and WebP.`}>
          <Slider className="w-full sm:w-48" value={[settings.imageQuality]} min={40} max={100} step={1} onValueChange={(v) => update({ imageQuality: v[0] ?? settings.imageQuality })} />
        </Row>
        <Row label="File name ending" hint={`Example: ${outputFileName("holiday-photo.png", "jpg", settings.filenameSuffix)}`}>
          <input
            value={settings.filenameSuffix}
            onChange={(e) => update({ filenameSuffix: e.target.value })}
            placeholder="e.g. -forma"
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-[13px] outline-none focus:border-ring sm:w-48"
          />
        </Row>
      </Group>
      <Group title="Privacy">
        <Row label="Remember recently used tools" hint="Stored only in this browser.">
          <Switch checked={settings.rememberRecent} onCheckedChange={(v) => update({ rememberRecent: v })} />
        </Row>
        <Row label="Clear recent tools" hint={`${recent.length} saved`}>
          <button onClick={() => { clearRecent(); toast.success("Recent tools cleared"); }} className="h-9 rounded-lg bg-secondary px-3 text-[13px] font-medium shadow-[inset_0_0_0_1px_var(--hairline)]">Clear</button>
        </Row>
      </Group>
      <Group title="About">
        <Row label="Forma 0.1 · Phase 1" hint={`${ready} of ${TOOLS.length} tools ready. More engines arrive in Phases 2 and 3.`}>
          <button onClick={() => { reset(); toast.success("Settings reset"); }} className="h-9 rounded-lg px-3 text-[13px] font-medium text-destructive hover:bg-destructive/10">Reset all settings</button>
        </Row>
      </Group>
    </div>
  );
}
