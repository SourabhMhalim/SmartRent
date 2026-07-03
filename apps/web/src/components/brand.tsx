import Image from "next/image";
import Link from "next/link";

type BrandProps = {
  dark?: boolean;
  compact?: boolean;
};

export function Brand({ dark = false, compact = false }: BrandProps) {
  return (
    <Link
      className={`inline-flex items-center gap-2.5 ${dark ? "text-white" : "text-[#0F172A]"}`}
      href="/dashboard"
    >
      <span className={`grid h-10 w-12 shrink-0 place-items-center rounded-md ${dark ? "bg-white/10" : "bg-[#E6FFFB]"}`}>
        <Image
          alt=""
          aria-hidden="true"
          height={23}
          priority
          src="/smartrent-mark.png"
          width={46}
        />
      </span>
      {!compact ? (
        <span className="font-display text-[21px] font-extrabold tracking-normal">
          Smart<span className="text-[#14B8A6]">Rent</span>
        </span>
      ) : null}
    </Link>
  );
}
