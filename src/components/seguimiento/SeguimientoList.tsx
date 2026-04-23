import { Edit, Image, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SeguimientoConfig } from "@/lib/seguimiento-config";

type Props = {
  config: SeguimientoConfig;
  rows: Record<string, unknown>[];
  onEdit: (row: Record<string, unknown>) => void;
  onDelete: (row: Record<string, unknown>) => void;
};

const SeguimientoList = ({ config, rows, onEdit, onDelete }: Props) => {
  if (!rows.length) {
    return (
      <div className="border border-border bg-card rounded-lg p-5 text-center">
        <p className="font-semibold">Sin registros todavía</p>
        <p className="text-sm text-muted-foreground mt-1">Crea el primer registro para iniciar el historial.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const details = config.details(row).filter(Boolean);
        return (
          <article key={String(row.id)} className="bg-card border border-border rounded-lg p-4 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-base leading-tight break-words">{config.primary(row)}</h3>
                <div className="mt-2 space-y-1">
                  {details.map((detail) => (
                    <p key={detail} className="text-sm text-muted-foreground break-words">{detail}</p>
                  ))}
                </div>
                {row.evidencia_url ? (
                  <a href={String(row.evidencia_url)} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-gold-deep">
                    <Image className="h-4 w-4" /> Ver evidencia
                  </a>
                ) : null}
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => onEdit(row)} aria-label="Editar registro" className="rounded-full">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(row)} aria-label="Eliminar registro" className="rounded-full text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default SeguimientoList;
