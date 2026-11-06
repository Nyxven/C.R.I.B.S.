import Image from "next/image";

const RATIO = 439 / 640; // height / width of /brand/logo.png

/** `size` is the rendered width in px. */
export function Logo({ size = 40, animate = false, white = false, alt = "C.R.I.B.S. logo" }: { size?: number; animate?: boolean; white?: boolean; alt?: string }) {
  return (
    <Image
      src="/brand/logo.png"
      alt={alt}
      width={size}
      height={Math.round(size * RATIO)}
      priority={animate}
      className={animate ? "logo-float" : undefined}
      style={white ? { filter: "brightness(0) invert(1)" } : undefined}
    />
  );
}
