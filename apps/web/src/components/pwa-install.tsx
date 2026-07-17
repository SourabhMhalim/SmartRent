"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaInstall({ basePath }: { basePath: string }) {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register(`${basePath}/sw.js`, { scope: `${basePath || ""}/` });
    }

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
      setHidden(false);
    };
    const onInstalled = () => setPromptEvent(null);

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [basePath]);

  if (!promptEvent || hidden) return null;

  const install = async () => {
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") setPromptEvent(null);
  };

  return (
    <aside className="fixed inset-x-3 bottom-3 z-[100] mx-auto flex max-w-md items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xl" role="status">
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm font-extrabold text-slate-900">Install SmartRent</p>
        <p className="text-xs text-slate-600">Add the app to your home screen for quick access.</p>
      </div>
      <button className="inline-flex items-center gap-1.5 rounded-lg bg-[#0f172a] px-3 py-2 text-sm font-bold text-white" onClick={install} type="button">
        <Download aria-hidden="true" size={16} /> Install
      </button>
      <button aria-label="Dismiss install message" className="rounded-md p-1 text-slate-500" onClick={() => setHidden(true)} type="button">
        <X aria-hidden="true" size={18} />
      </button>
    </aside>
  );
}
