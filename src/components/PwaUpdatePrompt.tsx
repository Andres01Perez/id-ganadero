import { useState } from "react";
import { registerSW } from "virtual:pwa-register";

const PwaUpdatePrompt = () => {
  const [needRefresh, setNeedRefresh] = useState(false);

  const updateServiceWorker = registerSW({
    onNeedRefresh() {
      setNeedRefresh(true);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 z-50 rounded-xl border-2 border-[#b79f60] bg-[#0a0a0a] p-4 shadow-2xl">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[#b79f60]">
          Nueva actualización disponible
        </p>
        <button
          onClick={() => updateServiceWorker(true)}
          className="shrink-0 rounded-lg bg-[#b79f60] px-4 py-2 text-sm font-bold text-[#0a0a0a] active:opacity-80"
        >
          Actualizar
        </button>
      </div>
    </div>
  );
};

export default PwaUpdatePrompt;
