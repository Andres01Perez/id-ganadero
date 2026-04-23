import { useEffect, useMemo, useState } from "react";
import { Loader2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SeguimientoConfig } from "@/lib/seguimiento-config";
import { addDays } from "@/lib/seguimiento-config";

type AnimalOption = { id: string; label: string };

type Props = {
  config: SeguimientoConfig;
  initialRow: Record<string, unknown> | null;
  animalOptions: AnimalOption[];
  saving: boolean;
  onCancel: () => void;
  onSubmit: (values: Record<string, string>, file: File | null) => void;
};

const today = () => new Date().toISOString().slice(0, 10);

const SeguimientoForm = ({ config, initialRow, animalOptions, saving, onCancel, onSubmit }: Props) => {
  const initialValues = useMemo(() => {
    const values: Record<string, string> = {};
    config.fields.forEach((field) => {
      const value = initialRow?.[field.name];
      values[field.name] = value === null || value === undefined ? "" : String(value).slice(0, field.type === "date" ? 10 : undefined);
    });
    if (!initialRow) {
      config.fields.forEach((field) => {
        if (field.type === "date" && field.required && !values[field.name]) values[field.name] = today();
      });
    }
    return values;
  }, [config.fields, initialRow]);

  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    setValues(initialValues);
    setFile(null);
  }, [initialValues]);

  const setValue = (name: string, value: string) => {
    setValues((current) => {
      const next = { ...current, [name]: value };
      if (config.tipo === "calor" && name === "fecha" && !current.fecha_proximo_estimado) {
        next.fecha_proximo_estimado = addDays(value, 21);
      }
      return next;
    });
  };

  return (
    <form
      className="bg-card border border-border rounded-lg p-4 space-y-4 shadow-soft"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values, file);
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{initialRow ? "Editar registro" : "Nuevo registro"}</h2>
        <Button type="button" variant="ghost" size="icon" onClick={onCancel} aria-label="Cancelar" className="rounded-full">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {config.fields.map((field) => (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name}>{field.label}{field.required ? " *" : ""}</Label>
          {field.type === "textarea" ? (
            <Textarea id={field.name} value={values[field.name] ?? ""} placeholder={field.placeholder} onChange={(e) => setValue(field.name, e.target.value)} />
          ) : field.type === "select" ? (
            <Select value={values[field.name] || undefined} onValueChange={(value) => setValue(field.name, value)}>
              <SelectTrigger id={field.name}>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : field.type === "animal" ? (
            <Select value={values[field.name] || undefined} onValueChange={(value) => setValue(field.name, value)}>
              <SelectTrigger id={field.name}>
                <SelectValue placeholder="Seleccionar animal" />
              </SelectTrigger>
              <SelectContent>
                {animalOptions.map((animal) => (
                  <SelectItem key={animal.id} value={animal.id}>{animal.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : field.type === "file" ? (
            <div className="space-y-2">
              <Input id={field.name} type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              {values[field.name] ? <p className="text-xs text-muted-foreground truncate">Evidencia actual guardada</p> : null}
            </div>
          ) : (
            <Input id={field.name} type={field.type} step={field.type === "number" ? "0.01" : undefined} required={field.required} value={values[field.name] ?? ""} placeholder={field.placeholder} onChange={(e) => setValue(field.name, e.target.value)} />
          )}
        </div>
      ))}

      <div className="grid grid-cols-2 gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>Cancelar</Button>
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar
        </Button>
      </div>
    </form>
  );
};

export default SeguimientoForm;
