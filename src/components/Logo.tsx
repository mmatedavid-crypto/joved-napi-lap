import logoAsset from "@/assets/jovod-logo.png.asset.json";

export function Logo({ className }: { className?: string }) {
  return (
    <img
      src={logoAsset.url}
      className={className}
      alt=""
      aria-hidden="true"
    />
  );
}
