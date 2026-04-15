import { useState } from "react";
import { useNavigate } from "react-router-dom";
import heroBpp from "@/assets/hero-bpp.webp";

const Index = () => {
  const [showInput, setShowInput] = useState(false);
  const [cedula, setCedula] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    if (cedula.trim().length > 0) {
      localStorage.setItem("cedula", cedula.trim());
      navigate("/menu");
    }
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col overflow-hidden select-none">
      {/* Hero — shrinks when input is shown */}
      <div
        className="w-full bg-background flex items-center justify-center overflow-hidden transition-all duration-500 ease-in-out"
        style={{ height: showInput ? "30dvh" : "80dvh" }}
      >
        <img
          src={heroBpp}
          alt="JPS Ganadería"
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>

      {/* Bottom — expands when input is shown */}
      <div
        className="w-full bg-primary flex flex-col items-center justify-start transition-all duration-500 ease-in-out"
        style={{ height: showInput ? "70dvh" : "20dvh" }}
      >
        <div className="w-full flex items-center justify-center px-6">
          {!showInput ? (
            <button
              onClick={() => setShowInput(true)}
              className="w-full max-w-sm h-14 rounded-xl bg-white text-black text-lg font-bold tracking-wider uppercase transition-all duration-300 hover:scale-[1.02] active:scale-95"
            >
              Iniciar Sesión
            </button>
          ) : (
            <div className="w-full max-w-sm flex gap-3 animate-fade-in">
              <input
                autoFocus
                type="text"
                inputMode="numeric"
                placeholder="Digite su cédula"
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="flex-1 h-14 rounded-xl bg-white text-black text-center text-lg font-medium placeholder:text-gray-400 px-4 outline-none ring-2 ring-white/50 focus:ring-black/30 transition-all"
              />
              <button
                onClick={handleLogin}
                className="h-14 px-6 rounded-xl bg-white text-black font-bold text-lg tracking-wide transition-all hover:scale-[1.02] active:scale-95"
              >
                →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
