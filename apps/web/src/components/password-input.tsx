"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

type PasswordInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function PasswordInput(props: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        className={`field field-with-icon ${props.className ?? ""}`}
        type={visible ? "text" : "password"}
      />
      <button
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-1 top-1 grid size-10 place-items-center rounded-md text-[#64748B] hover:bg-[#f1f4f2] hover:text-[#0F766E]"
        onClick={() => setVisible((value) => !value)}
        title={visible ? "Hide password" : "Show password"}
        type="button"
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
