import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import jpsLogo from "@/assets/jps-logo.webp";
import BottomTabBar from "@/components/BottomTabBar";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

type Animal = {
  id: string;
  codigo: string;
  nombre: string | null;
  tipo: string;
  sexo: string | null;
  fecha_nacimiento: string | null;
  numero_registro: string | null;
  color: string | null;
  raza: string | null;
  foto_principal_url: string | null;
};

const pills = [
  { label: "Control de calor", slug: "calor" },
  { label: "Aspiraciones", slug: "aspiraciones" },
  { label: "Embriones", slug: "embriones" },
  { label: "Palpaciones", slug: "palpaciones" },
  { label: "Cruces", slug: "cruces" },
  { label: "Dieta", slug: "dieta" },
  { label: "Peso", slug: "peso" },
  { label: "Partos", slug: "partos" },
  { label: "Chequeo", slug: "chequeo" },
  { label: "Campeonatos", slug: "campeonatos" },
];

const formatDate = (d: string | null) => {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
};

const HojaVidaAnimal = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase
        .from("animales")
        .select("id, codigo, nombre, tipo, sexo, fecha_nacimiento, numero_registro, color, raza, foto_principal_url")
        .eq("id", id)
        .maybeSingle();
      if (error || !data) {
        toast.error("No se encontró el animal");
        navigate("/menu");
        return;
      }
      setAnimal(data);
      setLoading(false);
    })();
  }, [id, navigate]);

  if (loading || !animal) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background pb-20">
      {/* Foto grande */}
      <header className="relative h-64 bg-neutral-200 overflow-hidden">
        {animal.foto_principal_url ? (
          <img
            src={animal.foto_principal_url}
            alt={animal.nombre ?? animal.codigo}
            className="w-full h-full object-cover"
            loading="eager"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <img src={jpsLogo} alt="" className="h-24 w-24 object-contain opacity-50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent pointer-events-none" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-3 left-3 h-9 w-9 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white"
          aria-label="Volver"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      </header>

      {/* Banda dorada con código */}
      <div className="bg-gold-solid text-ink py-3 px-4 text-center tracking-jps font-semibold uppercase text-base">
        {animal.nombre ?? "Sin nombre"} {animal.codigo}
      </div>

      {/* Información general */}
      <section className="px-5 py-5">
        <h2 className="text-sm font-semibold tracking-jps uppercase text-gold-deep mb-3">
          Información General
        </h2>
        <dl className="grid grid-cols-[110px_1fr] gap-y-2 text-sm">
          <dt className="text-muted-foreground">Nombre</dt>
          <dd className="font-semibold">{animal.nombre ?? "—"}</dd>

          <dt className="text-muted-foreground">Código</dt>
          <dd className="font-semibold">{animal.codigo}</dd>

          <dt className="text-muted-foreground">F. nacimiento</dt>
          <dd className="font-semibold">{formatDate(animal.fecha_nacimiento)}</dd>

          <dt className="text-muted-foreground">Registro</dt>
          <dd className="font-semibold">{animal.numero_registro ?? "—"}</dd>

          <dt className="text-muted-foreground">Color</dt>
          <dd className="font-semibold">{animal.color ?? "—"}</dd>

          <dt className="text-muted-foreground">Raza</dt>
          <dd className="font-semibold">{animal.raza ?? "—"}</dd>

          <dt className="text-muted-foreground">Sexo</dt>
          <dd className="font-semibold">
            {animal.sexo === "M" ? "Macho" : animal.sexo === "H" ? "Hembra" : "—"}
          </dd>
        </dl>
      </section>

      {/* Pills de eventos */}
      <section className="px-4 pb-6">
        <div className="grid grid-cols-2 gap-3">
          {pills.map((p) => (
            <button
              key={p.slug}
              onClick={() => toast.info(`Próximamente: ${p.label}`)}
              className="bg-gold-solid text-ink rounded-full py-3 px-4 text-sm font-semibold uppercase tracking-wider shadow-gold active:scale-95 transition-transform"
            >
              {p.label}
            </button>
          ))}
        </div>
      </section>

      <BottomTabBar />
    </div>
  );
};

export default HojaVidaAnimal;
