import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { acceptAttr, FORMATS, type FormatId } from "@/lib/formats";
import { cn } from "@/lib/utils";
import { FileIcon } from "./FileIcon";

type Props = {
  formats: FormatId[];
  multiple?: boolean | undefined;
  disabled?: boolean | undefined;
  compact?: boolean | undefined;
  onFiles: (files: File[]) => void;
  className?: string | undefined;
};

export function DropZone({ formats, multiple, disabled, compact, onFiles, className }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const labels = formats.map((f) => FORMATS[f].label).join(", ");

  const take = (list: FileList | null) => {
    if (!list || disabled) return;
    const files = Array.from(list);
    onFiles(multiple ? files : files.slice(0, 1));
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        take(e.dataTransfer.files);
      }}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-2xl border border-dashed border-input bg-surface text-center transition-all duration-200",
        compact ? "px-4 py-5" : "px-6 py-12 sm:py-16",
        over && "scale-[1.01] border-primary bg-accent",
        disabled && "pointer-events-none opacity-55",
        className,
      )}
    >
      {!compact && (
        <div className="relative mb-5 flex items-end">
          {formats.slice(0, 3).map((f, i) => (
            <FileIcon
              key={f}
              format={f}
              size="lg"
              className={cn(
                "transition-transform duration-300",
                i === 0 && formats.length > 1 && "-rotate-[8deg] translate-y-1",
                i === 1 && "z-10 -mx-3",
                i === 2 && "rotate-[8deg] translate-y-1",
                over && i === 0 && "-translate-x-1",
                over && i === 2 && "translate-x-1",
              )}
            />
          ))}
        </div>
      )}
      <div className={cn("flex items-center gap-2", compact ? "text-[13px]" : "text-[15px]")}>
        {compact && <UploadCloud className="size-4 text-muted-foreground" />}
        <span className="font-medium text-foreground">
          {over ? "Release to add" : `Drop ${labels} ${multiple ? "files" : "file"} here`}
        </span>
      </div>
      <p className="mt-1 text-[13px] text-muted-foreground">
        or{" "}
        <button
          type="button"
          disabled={disabled}
          onClick={() => input.current?.click()}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          choose {multiple ? "files" : "a file"}
        </button>{" "}
        from your device
      </p>
      <input
        ref={input}
        type="file"
        className="sr-only"
        tabIndex={-1}
        accept={acceptAttr(formats)}
        multiple={multiple}
        disabled={disabled}
        onChange={(e) => {
          take(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
