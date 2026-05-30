import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, FileSpreadsheet, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import BottomTabBar from "@/components/BottomTabBar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useFinca } from "@/contexts/FincaContext";
import { exportBloques, type ExportConfig, type BloqueSeleccion } from "@/lib/export-config";
import { exportarConfiguracion } from "@/lib/export-excel";
import { toast } from "sonner";

type Plantilla = {
  id: string;
  nombre: string;
  descripcion: string | null;
  compartida: boolean;
  config: ExportConfig;
  created_by: string;
};

const emptyConfig = (fincaIds: string[]): ExportConfig => ({
  fincaIds,
  bloques: [],
});

const ExportarInformacion = () => {
  const navigate = useNavigate();
  const { user, roles } = useAuth();
  const isAdmin = roles.includes("admin") || roles.includes("super_admin");
  const { fincasAccesibles } = useFinca();

  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [loadingPlantillas, setLoadingPlantillas] = useState(true);
  const [config, setConfig] = useState<ExportConfig>(() => emptyConfig([]));
  const [exporting, setExporting] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveDesc, setSaveDesc] = useState("");
  const [saveShared, setSaveShared] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Plantilla | null>(null);

  // Pre-seleccionar todas las fincas accesibles
  useEffect(() => {
    setConfig((c) =>
      c.fincaIds.length === 0 && fincasAccesibles.length > 0
        ? { ...c, fincaIds: fincasAccesibles.map((f) => f.id) }
        : c,
    );
  }, [fincasAccesibles]);

  const loadPlantillas = async () => {
    setLoadingPlantillas(true);
    const { data, error } = await supabase
      .from("export_plantillas")
      .select("id, nombre, descripcion, compartida, config, created_by")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setPlantillas((data ?? []) as unknown as Plantilla[]);
    setLoadingPlantillas(false);
  };

  useEffect(() => {
    loadPlantillas();
  }, []);

  const usarPlantilla = (p: Plantilla) => {
    // Filtrar fincaIds de la plantilla a las que el usuario aún tiene acceso
    const accesibles = new Set(fincasAccesibles.map((f) => f.id));
    const fincaIds = (p.config.fincaIds ?? []).filter((id) => accesibles.has(id));
    setConfig({
      fincaIds: fincaIds.length > 0 ? fincaIds : fincasAccesibles.map((f) => f.id),
      bloques: p.config.bloques ?? [],
    });
    toast.success(`Plantilla "${p.nombre}" cargada`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const eliminarPlantilla = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase
      .from("export_plantillas")
      .delete()
      .eq("id", deleteTarget.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Plantilla eliminada");
      setDeleteTarget(null);
      loadPlantillas();
    }
  };

  const toggleFinca = (id: string) => {
    setConfig((c) => ({
      ...c,
      fincaIds: c.fincaIds.includes(id) ? c.fincaIds.filter((x) => x !== id) : [...c.fincaIds, id],
    }));
  };

  const toggleBloque = (key: string) => {
    setConfig((c) => {
      const existing = c.bloques.find((b) => b.key === key);
      if (existing) return { ...c, bloques: c.bloques.filter((b) => b.key !== key) };
      const bloque = exportBloques.find((b) => b.key === key)!;
      const nuevo: BloqueSeleccion = {
        key,
        campos: bloque.fields.map((f) => f.key),
        filtroTipo: "todos",
        filtroActivo: "todos",
      };
      return { ...c, bloques: [...c.bloques, nuevo] };
    });
  };

  const updateBloque = (key: string, patch: Partial<BloqueSeleccion>) => {
    setConfig((c) => ({
      ...c,
      bloques: c.bloques.map((b) => (b.key === key ? { ...b, ...patch } : b)),
    }));
  };

  const toggleCampo = (bloqueKey: string, campoKey: string) => {
    setConfig((c) => ({
      ...c,
      bloques: c.bloques.map((b) =>
        b.key === bloqueKey
          ? {
              ...b,
              campos: b.campos.includes(campoKey)
                ? b.campos.filter((x) => x !== campoKey)
                : [...b.campos, campoKey],
            }
          : b,
      ),
    }));
  };

  const todosCampos = (bloqueKey: string) => {
    const bloque = exportBloques.find((b) => b.key === bloqueKey)!;
    updateBloque(bloqueKey, { campos: bloque.fields.map((f) => f.key) });
  };

  const ningunCampo = (bloqueKey: string) => {
    updateBloque(bloqueKey, { campos: [] });
  };

  const puedeExportar =
    config.fincaIds.length > 0 &&
    config.bloques.length > 0 &&
    config.bloques.every((b) => b.campos.length > 0);

  const handleExportar = async () => {
    if (!puedeExportar) return;
    setExporting(true);
    try {
      const result = await exportarConfiguracion(config);
      const total = result.sheets.reduce((s, x) => s + x.rowCount, 0);
      toast.success(`Exportado: ${total} filas en ${result.sheets.length} hojas`);
    } catch (err) {
      const e = err as { message?: string };
      toast.error(e.message ?? "No se pudo generar el archivo");
    } finally {
      setExporting(false);
    }
  };

  const abrirGuardar = () => {
    if (!puedeExportar) {
      toast.error("Completa la selección antes de guardar");
      return;
    }
    setSaveName("");
    setSaveDesc("");
    setSaveShared(false);
    setSaveOpen(true);
  };

  const guardarPlantilla = async () => {
    if (!user) return;
    if (!saveName.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("export_plantillas").insert({
      nombre: saveName.trim(),
      descripcion: saveDesc.trim() || null,
      compartida: saveShared,
      config: config as unknown as never,
      created_by: user.id,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Plantilla guardada");
    setSaveOpen(false);
    loadPlantillas();
  };

  const seleccionados = useMemo(
    () => new Set(config.bloques.map((b) => b.key)),
    [config.bloques],
  );

  return (
    <div className="min-h-[100dvh] bg-background pb-safe-plus">
      <header className="bg-gold-solid text-ink px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate("/menu/gestion")}
          className="h-9 w-9 rounded-full bg-black/10 flex items-center justify-center"
          aria-label="Volver"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="font-semibold uppercase tracking-jps text-sm">Exportar información</h1>
      </header>

      <div className="px-4 py-4 space-y-6">
        {/* Plantillas */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Plantillas guardadas
          </h2>
          {loadingPlantillas ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : plantillas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay plantillas. Configura una exportación abajo y guárdala para reutilizarla.
            </p>
          ) : (
            <div className="space-y-2">
              {plantillas.map((p) => {
                const canDelete = isAdmin || p.created_by === user?.id;
                return (
                  <div key={p.id} className="bg-card rounded-xl p-3 shadow-soft">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-ink truncate">{p.nombre}</p>
                        {p.descripcion && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{p.descripcion}</p>
                        )}
                        <p className="text-[10px] uppercase tracking-wider mt-1 text-muted-foreground">
                          {p.compartida ? "Compartida" : "Privada"} ·{" "}
                          {p.config.bloques?.length ?? 0} bloque
                          {(p.config.bloques?.length ?? 0) === 1 ? "" : "s"}
                        </p>
                      </div>
                      <button
                        onClick={() => usarPlantilla(p)}
                        className="bg-gold-solid text-ink rounded-full py-2 px-3 text-xs font-semibold uppercase tracking-wider shadow-gold active:scale-95"
                      >
                        Usar
                      </button>
                      {canDelete && (
                        <button
                          onClick={() => setDeleteTarget(p)}
                          className="h-9 w-9 rounded-full flex items-center justify-center text-destructive active:scale-95"
                          aria-label="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Fincas */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            1 · Fincas
          </h2>
          {fincasAccesibles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tienes acceso a ninguna finca.</p>
          ) : (
            <div className="bg-card rounded-xl p-3 shadow-soft space-y-2">
              {fincasAccesibles.map((f) => (
                <label key={f.id} className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={config.fincaIds.includes(f.id)}
                    onCheckedChange={() => toggleFinca(f.id)}
                  />
                  <span className="text-sm text-ink">{f.nombre}</span>
                </label>
              ))}
            </div>
          )}
        </section>

        {/* Bloques */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            2 · ¿Qué quieres exportar?
          </h2>
          <div className="bg-card rounded-xl p-3 shadow-soft space-y-2">
            {exportBloques.map((b) => (
              <label key={b.key} className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={seleccionados.has(b.key)}
                  onCheckedChange={() => toggleBloque(b.key)}
                />
                <span className="text-sm text-ink">{b.label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Configuración por bloque */}
        {config.bloques.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              3 · Detalles de cada bloque
            </h2>
            <div className="space-y-3">
              {config.bloques.map((sel) => {
                const bloque = exportBloques.find((b) => b.key === sel.key)!;
                return (
                  <div key={sel.key} className="bg-card rounded-xl p-3 shadow-soft space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm text-ink">{bloque.label}</p>
                      <button
                        onClick={() => toggleBloque(sel.key)}
                        className="text-xs text-muted-foreground active:opacity-70"
                      >
                        Quitar
                      </button>
                    </div>

                    {/* Filtros del bloque animales */}
                    {bloque.key === "animales" && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Tipo</Label>
                          <select
                            value={sel.filtroTipo ?? "todos"}
                            onChange={(e) =>
                              updateBloque(sel.key, {
                                filtroTipo: e.target.value as BloqueSeleccion["filtroTipo"],
                              })
                            }
                            className="w-full bg-background border border-input rounded-md px-2 py-2 text-sm"
                          >
                            <option value="todos">Todos</option>
                            <option value="macho">Machos</option>
                            <option value="hembra">Hembras</option>
                            <option value="cria">Crías</option>
                            <option value="embrion">Embriones</option>
                          </select>
                        </div>
                        <div>
                          <Label className="text-xs">Estado</Label>
                          <select
                            value={sel.filtroActivo ?? "todos"}
                            onChange={(e) =>
                              updateBloque(sel.key, {
                                filtroActivo: e.target.value as BloqueSeleccion["filtroActivo"],
                              })
                            }
                            className="w-full bg-background border border-input rounded-md px-2 py-2 text-sm"
                          >
                            <option value="todos">Todos</option>
                            <option value="si">Solo activos</option>
                            <option value="no">Solo inactivos</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Rango fechas */}
                    {bloque.fechaField && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Desde</Label>
                          <Input
                            type="date"
                            value={sel.fechaDesde ?? ""}
                            onChange={(e) =>
                              updateBloque(sel.key, { fechaDesde: e.target.value || undefined })
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Hasta</Label>
                          <Input
                            type="date"
                            value={sel.fechaHasta ?? ""}
                            onChange={(e) =>
                              updateBloque(sel.key, { fechaHasta: e.target.value || undefined })
                            }
                          />
                        </div>
                      </div>
                    )}

                    {/* Campos */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-xs">Campos a exportar</Label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => todosCampos(sel.key)}
                            className="text-[10px] uppercase tracking-wider text-gold-deep active:opacity-70"
                          >
                            Todos
                          </button>
                          <button
                            type="button"
                            onClick={() => ningunCampo(sel.key)}
                            className="text-[10px] uppercase tracking-wider text-muted-foreground active:opacity-70"
                          >
                            Ninguno
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {bloque.fields.map((f) => (
                          <label key={f.key} className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={sel.campos.includes(f.key)}
                              onCheckedChange={() => toggleCampo(sel.key, f.key)}
                            />
                            <span className="text-xs text-ink">{f.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Acciones */}
        <section className="space-y-3 pt-2">
          <button
            onClick={handleExportar}
            disabled={!puedeExportar || exporting}
            className="w-full bg-gold-solid text-ink rounded-xl py-3 font-semibold uppercase tracking-wider shadow-gold active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-5 w-5" />
            )}
            {exporting ? "Generando…" : "Exportar a Excel"}
          </button>
          <button
            onClick={abrirGuardar}
            disabled={!puedeExportar}
            className="w-full bg-card border border-gold/40 text-ink rounded-xl py-3 font-semibold uppercase tracking-wider active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="h-5 w-5" />
            Guardar como plantilla
          </button>
        </section>
      </div>

      {/* Guardar plantilla */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>Guardar plantilla</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="plantilla-nombre">Nombre *</Label>
              <Input
                id="plantilla-nombre"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Ej. Reporte mensual ganado"
              />
            </div>
            <div>
              <Label htmlFor="plantilla-desc">Descripción</Label>
              <Textarea
                id="plantilla-desc"
                value={saveDesc}
                onChange={(e) => setSaveDesc(e.target.value)}
                placeholder="Para qué sirve esta plantilla"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between gap-3 pt-1">
              <div>
                <Label htmlFor="plantilla-shared">Compartir con todos</Label>
                <p className="text-[11px] text-muted-foreground">
                  Otros usuarios podrán usarla también.
                </p>
              </div>
              <Switch
                id="plantilla-shared"
                checked={saveShared}
                onCheckedChange={setSaveShared}
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setSaveOpen(false)}
              className="px-4 py-2 text-sm text-muted-foreground"
            >
              Cancelar
            </button>
            <button
              onClick={guardarPlantilla}
              disabled={saving}
              className="bg-gold-solid text-ink rounded-md px-4 py-2 text-sm font-semibold uppercase tracking-wider shadow-gold flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Guardar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Eliminar plantilla */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar plantilla?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.nombre}" se eliminará para todos los usuarios.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={eliminarPlantilla}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomTabBar />
    </div>
  );
};

export default ExportarInformacion;
