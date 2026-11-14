import { renderAppIcon } from "@/lib/app-icon";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
  return renderAppIcon({ size: size.width, glyphRatio: 0.6, cornerRatio: 0 });
}
