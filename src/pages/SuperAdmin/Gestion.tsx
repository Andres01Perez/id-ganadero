import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AnimalForm from "@/components/AnimalForm";
import FincaForm from "@/components/FincaForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Plus, RotateCcw, Search, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";

type AnimalTipo = "macho" | "hembra" | "cria" | "embrion";
type StatusFilter = "activos" | "inactivos" | "todos";

type FincaRow = {
  id: string;
  nombre: string;
  ubicacion: string | null;
  hectareas: number | null;
  activo: boolean;
  operarios: number;
};

type AnimalRow = {
  id: string;
  numero: string;
  nombre: string | null;
  tipo: AnimalTipo;
  sexo: "M" | "H" | null;
  raza: string | null;
  color: string | null;
  fecha_nacimiento: string | null;
  numero_registro: string | null;
  foto_principal_url: string | null;
  activo: boolean;
  finca_id: string;
  fincas?: { nombre: string } | null;
};

const animalTabs: { value: AnimalTipo; label: string; singular: string }[] = [
  { value: "macho", label: "Machos", singular: "macho" },
  { value: "hembra", label: "Hembras", singular: "hembra" },
  { value: "cria", label: "Crías", singular: "cría" },
  { value: "embrion", label: "Embriones", singular: "embrión" },
];

const statusLabel = (active: boolean) => (
  <Badge variant={active ? "default" : "secondary"}>{active ? "Activo" : "Inactivo"}</Badge>
);

const matchesStatus = (active: boolean, filter: StatusFilter) =>
  filter === "todos" || (filter === "activos" ? active : !active);

const Gestion = () => {
  const [fincas, setFincas] = useState<FincaRow[]>([]);
  const [animals, setAnimals] = useState<AnimalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("activos");
  const [fincaFormOpen, setFincaFormOpen] = useState(false);
  const [selectedFincaId, setSelectedFincaId] = useState<string | null>(null);
  const [animalFormOpen, setAnimalFormOpen] = useState(false);
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);
  const [selectedAnimalTipo, setSelectedAnimalTipo] = useState<AnimalTipo>("macho");

  const load = async () => {
    setLoading(true);
    const [fincasRes, accesosRes, animalsRes] = await Promise.all([
      supabase
        .from("fincas")
        .select("id, nombre, ubicacion, hectareas, activo")
        .order("nombre"),
      supabase.from("user_finca_acceso").select("finca_id"),
      supabase
        .from("animales")
        .select("id, numero, nombre, tipo, sexo, raza, color, fecha_nacimiento, numero_registro, foto_principal_url, activo, finca_id, fincas(nombre)")
        .in("tipo", ["macho", "hembra", "cria", "embrion"])
        .order("numero"),
    ]);

    if (fincasRes.error || accesosRes.error || animalsRes.error) {
      toast.error("No se pudo cargar la gestión");
    }

    const counts = new Map<string, number>();
    (accesosRes.data ?? []).forEach((row) => {
      counts.set(row.finca_id, (counts.get(row.finca_id) ?? 0) + 1);
    });

    setFincas(
      (fincasRes.data ?? []).map((f) => ({
        ...f,
        operarios: counts.get(f.id) ?? 0,
      })),
    );
    setAnimals((animalsRes.data ?? []) as AnimalRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const normalizedSearch = search.trim().toLowerCase();

  const filteredFincas = useMemo(
    () =>
      fincas.filter((f) => {
        const text = `${f.nombre} ${f.ubicacion ?? ""}`.toLowerCase();
        return matchesStatus(f.activo, status) && (!normalizedSearch || text.includes(normalizedSearch));
      }),
    [fincas, normalizedSearch, status],
  );

  const animalsByTipo = (tipo: AnimalTipo) =>
    animals.filter((a) => {
      const text = `${a.numero} ${a.nombre ?? ""} ${a.fincas?.nombre ?? ""} ${a.raza ?? ""}`.toLowerCase();
      return a.tipo === tipo && matchesStatus(a.activo, status) && (!normalizedSearch || text.includes(normalizedSearch));
    });

  const openNewFinca = () => {
    setSelectedFincaId(null);
    setFincaFormOpen(true);
  };

  const openEditFinca = (id: string) => {
    setSelectedFincaId(id);
    setFincaFormOpen(true);
  };

  const openNewAnimal = (tipo: AnimalTipo) => {
    setSelectedAnimalTipo(tipo);
    setSelectedAnimalId(null);
    setAnimalFormOpen(true);
  };

  const openEditAnimal = (animal: AnimalRow) => {
    setSelectedAnimalTipo(animal.tipo);
    setSelectedAnimalId(animal.id);
    setAnimalFormOpen(true);
  };

  const toggleFinca = async (finca: FincaRow) => {
    const { error } = await supabase.from("fincas").update({ activo: !finca.activo }).eq("id", finca.id);
    if (error) {
      toast.error("No se pudo actualizar la finca");
      return;
    }
    toast.success(finca.activo ? "Finca desactivada" : "Finca reactivada");
    load();
  };

  const toggleAnimal = async (animal: AnimalRow) => {
    const { error } = await supabase.from("animales").update({ activo: !animal.activo }).eq("id", animal.id);
    if (error) {
      toast.error("No se pudo actualizar el animal");
      return;
    }
    toast.success(animal.activo ? "Animal desactivado" : "Animal reactivado");
    load();
  };

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestión</h1>
          <p className="text-sm text-muted-foreground">
            Administra fincas, machos, hembras, crías y embriones.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o número"
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={(value) => setStatus(value as StatusFilter)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="activos">Activos</SelectItem>
              <SelectItem value="inactivos">Inactivos</SelectItem>
              <SelectItem value="todos">Todos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="fincas" className="w-full">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="fincas">Fincas</TabsTrigger>
          {animalTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="fincas" className="mt-6">
          <div className="mb-4 flex justify-end">
            <Button onClick={openNewFinca}>
              <Plus className="h-4 w-4" />
              Agregar finca
            </Button>
          </div>
          <FincasTable rows={filteredFincas} loading={loading} onEdit={openEditFinca} onToggle={toggleFinca} />
        </TabsContent>

        {animalTabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-6">
            <div className="mb-4 flex justify-end">
              <Button onClick={() => openNewAnimal(tab.value)}>
                <Plus className="h-4 w-4" />
                Agregar {tab.singular}
              </Button>
            </div>
            <AnimalsTable rows={animalsByTipo(tab.value)} loading={loading} onEdit={openEditAnimal} onToggle={toggleAnimal} />
          </TabsContent>
        ))}
      </Tabs>

      <FincaForm
        open={fincaFormOpen}
        onOpenChange={setFincaFormOpen}
        fincaId={selectedFincaId}
        onSaved={load}
      />
      <AnimalForm
        open={animalFormOpen}
        onOpenChange={setAnimalFormOpen}
        tipo={selectedAnimalTipo}
        animalId={selectedAnimalId}
        onSaved={load}
      />
    </div>
  );
};

const FincasTable = ({
  rows,
  loading,
  onEdit,
  onToggle,
}: {
  rows: FincaRow[];
  loading: boolean;
  onEdit: (id: string) => void;
  onToggle: (row: FincaRow) => void;
}) => (
  <div className="overflow-x-auto rounded-lg border border-border bg-card">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Ubicación</TableHead>
          <TableHead>Hectáreas</TableHead>
          <TableHead>Operarios</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow><TableCell colSpan={6}>Cargando…</TableCell></TableRow>
        ) : rows.length === 0 ? (
          <TableRow><TableCell colSpan={6}>No hay fincas para mostrar.</TableCell></TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.nombre}</TableCell>
              <TableCell>{row.ubicacion ?? "—"}</TableCell>
              <TableCell>{row.hectareas ?? "—"}</TableCell>
              <TableCell>{row.operarios}</TableCell>
              <TableCell>{statusLabel(row.activo)}</TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => onEdit(row.id)}>
                    <Edit className="h-4 w-4" />
                    Editar
                  </Button>
                  <Button variant={row.activo ? "destructive" : "secondary"} size="sm" onClick={() => onToggle(row)}>
                    {row.activo ? <ToggleLeft className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
                    {row.activo ? "Desactivar" : "Reactivar"}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);

const AnimalsTable = ({
  rows,
  loading,
  onEdit,
  onToggle,
}: {
  rows: AnimalRow[];
  loading: boolean;
  onEdit: (row: AnimalRow) => void;
  onToggle: (row: AnimalRow) => void;
}) => (
  <div className="overflow-x-auto rounded-lg border border-border bg-card">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Foto</TableHead>
          <TableHead>Número</TableHead>
          <TableHead>Nombre</TableHead>
          <TableHead>Finca</TableHead>
          <TableHead>Sexo</TableHead>
          <TableHead>Raza</TableHead>
          <TableHead>Color</TableHead>
          <TableHead>F. nacimiento</TableHead>
          <TableHead>Registro</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow><TableCell colSpan={11}>Cargando…</TableCell></TableRow>
        ) : rows.length === 0 ? (
          <TableRow><TableCell colSpan={11}>No hay animales para mostrar.</TableCell></TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <div className="h-10 w-10 overflow-hidden rounded-full border border-border bg-muted">
                  {row.foto_principal_url ? (
                    <img src={row.foto_principal_url} alt={row.numero} className="h-full w-full object-cover" />
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="font-medium">{row.numero}</TableCell>
              <TableCell>{row.nombre ?? "—"}</TableCell>
              <TableCell>{row.fincas?.nombre ?? "—"}</TableCell>
              <TableCell>{row.sexo ?? "—"}</TableCell>
              <TableCell>{row.raza ?? "—"}</TableCell>
              <TableCell>{row.color ?? "—"}</TableCell>
              <TableCell>{row.fecha_nacimiento ?? "—"}</TableCell>
              <TableCell>{row.numero_registro ?? "—"}</TableCell>
              <TableCell>{statusLabel(row.activo)}</TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => onEdit(row)}>
                    <Edit className="h-4 w-4" />
                    Editar
                  </Button>
                  <Button variant={row.activo ? "destructive" : "secondary"} size="sm" onClick={() => onToggle(row)}>
                    {row.activo ? <ToggleRight className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
                    {row.activo ? "Desactivar" : "Reactivar"}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);

export default Gestion;