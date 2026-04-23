import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Building2, MapPin, Ruler } from "lucide-react";

type Finca = {
  id: string;
  nombre: string;
  ubicacion: string | null;
  hectareas: number | null;
  foto_url: string | null;
};

type Animal = {
  id: string;
  numero: string;
  nombre: string | null;
  tipo: string;
  raza: string | null;
  color: string | null;
  fecha_nacimiento: string | null;
  numero_registro: string | null;
  sexo: string | null;
  foto_principal_url: string | null;
};

const tipos = [
  { value: "macho", label: "Machos" },
  { value: "hembra", label: "Hembras" },
  { value: "cria", label: "Crías" },
  { value: "embrion", label: "Embriones" },
  { value: "otro", label: "Otros" },
];

const InformacionFinca = () => {
  const { fincaId } = useParams<{ fincaId?: string }>();
  const navigate = useNavigate();

  const [fincas, setFincas] = useState<(Finca & { animal_count: number })[]>([]);
  const [finca, setFinca] = useState<Finca | null>(null);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);

  useEffect(() => {
    (async () => {
      const [fincasRes, animsRes] = await Promise.all([
        supabase
          .from("fincas")
          .select("id, nombre, ubicacion, hectareas, foto_url")
          .eq("activo", true)
          .order("nombre"),
        supabase.from("animales").select("finca_id").eq("activo", true),
      ]);
      const counts: Record<string, number> = {};
      (animsRes.data ?? []).forEach((a) => {
        counts[a.finca_id] = (counts[a.finca_id] ?? 0) + 1;
      });
      setFincas(
        (fincasRes.data ?? []).map((f) => ({
          ...f,
          animal_count: counts[f.id] ?? 0,
        }))
      );
    })();
  }, []);

  useEffect(() => {
    if (!fincaId) {
      setFinca(null);
      setAnimals([]);
      return;
    }
    setLoading(true);
    (async () => {
      const [fRes, aRes] = await Promise.all([
        supabase
          .from("fincas")
          .select("id, nombre, ubicacion, hectareas, foto_url")
          .eq("id", fincaId)
          .maybeSingle(),
        supabase
          .from("animales")
          .select("id, numero, nombre, tipo, raza, color, fecha_nacimiento, numero_registro, sexo, foto_principal_url")
          .eq("finca_id", fincaId)
          .eq("activo", true)
          .order("numero"),
      ]);
      setFinca(fRes.data);
      setAnimals(aRes.data ?? []);
      setLoading(false);
    })();
  }, [fincaId]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Información finca</h1>
        <p className="text-sm text-muted-foreground">
          Selecciona una finca para ver todos sus animales y eventos.
        </p>
      </div>

      <div className="flex gap-6">
        <aside className="w-72 shrink-0 bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-secondary/40 text-xs uppercase tracking-wider font-semibold">
            Fincas
          </div>
          <div className="max-h-[70vh] overflow-y-auto">
            {fincas.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Sin fincas</p>
            ) : (
              fincas.map((f) => (
                <button
                  key={f.id}
                  onClick={() => navigate(`/superadmin/finca/${f.id}`)}
                  className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-secondary/40 transition-colors ${
                    fincaId === f.id ? "bg-primary/10 border-l-4 border-l-primary" : ""
                  }`}
                >
                  <p className="font-semibold text-sm">{f.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {f.animal_count} animal{f.animal_count !== 1 ? "es" : ""}
                  </p>
                </button>
              ))
            )}
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {!fincaId ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">
              <Building2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>Selecciona una finca de la lista</p>
            </div>
          ) : loading || !finca ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">
              Cargando…
            </div>
          ) : (
            <>
              <div className="bg-card border border-border rounded-xl overflow-hidden mb-4">
                {finca.foto_url && (
                  <img
                    src={finca.foto_url}
                    alt={finca.nombre}
                    className="w-full h-40 object-cover"
                  />
                )}
                <div className="p-5">
                  <h2 className="text-xl font-bold">{finca.nombre}</h2>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                    {finca.ubicacion && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {finca.ubicacion}
                      </span>
                    )}
                    {finca.hectareas && (
                      <span className="flex items-center gap-1.5">
                        <Ruler className="h-3.5 w-3.5" />
                        {finca.hectareas} ha
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <Tabs defaultValue="macho">
                <TabsList>
                  {tipos.map((t) => (
                    <TabsTrigger key={t.value} value={t.value}>
                      {t.label} ({animals.filter((a) => a.tipo === t.value).length})
                    </TabsTrigger>
                  ))}
                </TabsList>
                {tipos.map((t) => (
                  <TabsContent key={t.value} value={t.value} className="mt-4">
                    <AnimalsTable
                      rows={animals.filter((a) => a.tipo === t.value)}
                      onSelect={setSelectedAnimal}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </>
          )}
        </div>
      </div>

      <Sheet
        open={!!selectedAnimal}
        onOpenChange={(o) => !o && setSelectedAnimal(null)}
      >
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selectedAnimal && (
            <>
              <SheetHeader>
                <SheetTitle>
                  {selectedAnimal.nombre ?? selectedAnimal.numero}
                </SheetTitle>
                <p className="text-xs text-muted-foreground">
                  {selectedAnimal.numero} · {selectedAnimal.tipo}
                </p>
              </SheetHeader>
              <AnimalEvents animalId={selectedAnimal.id} />
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

const AnimalsTable = ({
  rows,
  onSelect,
}: {
  rows: Animal[];
  onSelect: (a: Animal) => void;
}) => {
  if (rows.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground text-sm">
        Sin animales en esta categoría
      </div>
    );
  }
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead></TableHead>
            <TableHead>Número</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Raza</TableHead>
            <TableHead>Color</TableHead>
            <TableHead>F. Nac.</TableHead>
            <TableHead>Registro</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((a) => (
            <TableRow
              key={a.id}
              className="cursor-pointer hover:bg-secondary/40"
              onClick={() => onSelect(a)}
            >
              <TableCell>
                <div className="h-9 w-9 rounded-full bg-muted overflow-hidden border border-border">
                  {a.foto_principal_url ? (
                    <img src={a.foto_principal_url} alt="" className="w-full h-full object-cover" />
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="font-mono text-xs">{a.numero}</TableCell>
              <TableCell className="font-medium">{a.nombre ?? "—"}</TableCell>
              <TableCell className="text-xs">{a.raza ?? "—"}</TableCell>
              <TableCell className="text-xs">{a.color ?? "—"}</TableCell>
              <TableCell className="text-xs">{a.fecha_nacimiento ?? "—"}</TableCell>
              <TableCell className="text-xs">{a.numero_registro ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const AnimalEvents = ({ animalId }: { animalId: string }) => {
  const [data, setData] = useState<Record<string, unknown[]> | null>(null);

  useEffect(() => {
    (async () => {
      const tables = [
        "vacunaciones",
        "pesajes",
        "palpaciones",
        "inseminaciones",
        "medicaciones",
        "dietas",
        "ciclos_calor",
        "chequeos_veterinarios",
        "aspiraciones",
        "embriones_detalle",
      ] as const;

      const partosRes = await supabase
        .from("partos")
        .select("*")
        .eq("animal_id_madre", animalId)
        .order("fecha", { ascending: false });

      const results = await Promise.all(
        tables.map((t) =>
          supabase
            .from(t)
            .select("*")
            .eq("animal_id", animalId)
            .order("fecha" in {} ? "fecha" : "created_at", { ascending: false } as never)
            .then((r) => ({ t, data: r.data ?? [] }))
        )
      );
      const map: Record<string, unknown[]> = {};
      results.forEach(({ t, data }) => (map[t] = data));
      map["partos"] = partosRes.data ?? [];
      setData(map);
    })();
  }, [animalId]);

  if (!data) {
    return <p className="text-sm text-muted-foreground mt-4">Cargando eventos…</p>;
  }

  const sections = [
    { key: "vacunaciones", label: "Vacunaciones" },
    { key: "pesajes", label: "Pesajes" },
    { key: "palpaciones", label: "Palpaciones" },
    { key: "inseminaciones", label: "Inseminaciones" },
    { key: "partos", label: "Partos" },
    { key: "medicaciones", label: "Medicaciones" },
    { key: "dietas", label: "Dietas" },
    { key: "ciclos_calor", label: "Ciclos de calor" },
    { key: "chequeos_veterinarios", label: "Chequeos veterinarios" },
    { key: "aspiraciones", label: "Aspiraciones" },
    { key: "embriones_detalle", label: "Detalle embrión" },
  ];

  return (
    <Accordion type="multiple" className="mt-4">
      {sections.map((s) => {
        const rows = (data[s.key] ?? []) as Record<string, unknown>[];
        return (
          <AccordionItem key={s.key} value={s.key}>
            <AccordionTrigger>
              {s.label} <span className="text-xs text-muted-foreground ml-2">({rows.length})</span>
            </AccordionTrigger>
            <AccordionContent>
              {rows.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sin registros</p>
              ) : (
                <div className="space-y-2">
                  {rows.map((r, i) => (
                    <div
                      key={i}
                      className="text-xs bg-secondary/40 rounded-md p-2 font-mono whitespace-pre-wrap break-all"
                    >
                      {JSON.stringify(r, null, 2)}
                    </div>
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};

export default InformacionFinca;
