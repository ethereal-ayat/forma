/** Browser-native image engine: decode with <img>/createImageBitmap, re-encode with canvas. */

export type ImageOutput = "png" | "jpg" | "webp";

export type ImageJob = {
  output: ImageOutput;
  quality: number; // 0–1, used for jpg/webp
  width?: number; // target width in px; height keeps aspect ratio
  background?: string; // fill for formats without transparency
};

export type ImageResult = {
  blob: Blob;
  width: number;
  height: number;
};

const MIME: Record<ImageOutput, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
};

export function mimeFor(output: ImageOutput) {
  return MIME[output];
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("This image couldn't be read. It may be damaged or in an unsupported format."));
    };
    img.src = url;
  });
}

export async function convertImage(file: File, job: ImageJob): Promise<ImageResult> {
  const img = await loadImage(file);
  let srcW = img.naturalWidth || img.width;
  let srcH = img.naturalHeight || img.height;
  // SVGs without intrinsic size
  if (!srcW || !srcH) {
    srcW = 1024;
    srcH = 1024;
  }
  const width = Math.max(1, Math.round(job.width ?? srcW));
  const height = Math.max(1, Math.round((srcH / srcW) * width));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser couldn't create a drawing surface.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  if (job.output === "jpg") {
    ctx.fillStyle = job.background ?? "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(img, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, MIME[job.output], job.output === "png" ? undefined : job.quality),
  );
  canvas.width = 0;
  canvas.height = 0;
  if (!blob) throw new Error(`Your browser can't export ${job.output.toUpperCase()} images.`);
  return { blob, width, height };
}

export async function readImageSize(file: File): Promise<{ width: number; height: number } | null> {
  try {
    const img = await loadImage(file);
    return { width: img.naturalWidth, height: img.naturalHeight };
  } catch {
    return null;
  }
}

export function outputForFile(file: File): ImageOutput {
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/webp") return "webp";
  return "png";
}
