import { renderAppIcon } from "@/lib/app-icon";

const PWA_ICONS = {
  "icon-192.png": { size: 192, framed: true },
  "icon-512.png": { size: 512, framed: true },
  "maskable-512.png": { size: 512, framed: false },
} as const;

type PwaIconName = keyof typeof PWA_ICONS;

function isPwaIconName(name: string): name is PwaIconName {
  return Object.hasOwn(PWA_ICONS, name);
}

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(PWA_ICONS).map((name) => ({ name }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  if (!isPwaIconName(name)) {
    return new Response("Not Found", { status: 404 });
  }
  return renderAppIcon(PWA_ICONS[name]);
}
