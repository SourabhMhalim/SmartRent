import { AlertCircle, CheckCircle2 } from "lucide-react";

export function FormNotice({
  children,
  variant = "success",
}: {
  children: React.ReactNode;
  variant?: "success" | "error";
}) {
  const isError = variant === "error";
  const Icon = isError ? AlertCircle : CheckCircle2;

  return (
    <div
      className={`flex gap-3 rounded-md border p-3 text-sm ${
        isError
          ? "border-[#FECACA] bg-[#FEF2F2] text-[#B42318]"
          : "border-[#99F6E4] bg-[#F0FDFA] text-[#0F766E]"
      }`}
    >
      <Icon className="mt-0.5 shrink-0" size={17} />
      <span>{children}</span>
    </div>
  );
}
