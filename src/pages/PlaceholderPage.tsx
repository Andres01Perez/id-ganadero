import { useNavigate } from "react-router-dom";

const PlaceholderPage = ({ title }: { title: string }) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-2xl font-bold text-primary">{title}</h1>
      <p className="text-muted-foreground">Próximamente</p>
      <button
        onClick={() => navigate("/menu")}
        className="mt-4 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium active:scale-95 transition-all"
      >
        ← Volver al menú
      </button>
    </div>
  );
};

export default PlaceholderPage;
