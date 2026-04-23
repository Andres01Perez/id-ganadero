import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SeguimientoConfig } from "@/lib/seguimiento-config";

type Props = {
  animalName: string;
  animalNumber: string;
  config: SeguimientoConfig;
  onBack: () => void;
};

const SeguimientoHeader = ({ animalName, animalNumber, config, onBack }: Props) => {
  const Icon = config.icon;

  return (
    <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border pt-safe">
      <div className="px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Volver" className="shrink-0 rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground truncate">{animalName} {animalNumber}</p>
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-gold-deep" />
            <h1 className="text-xl font-semibold truncate">{config.title}</h1>
          </div>
        </div>
      </div>
    </header>
  );
};

export default SeguimientoHeader;
