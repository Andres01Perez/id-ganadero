import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AssetLocationPreview from "./AssetLocationPreview";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetKey: string;
  imageUrl: string;
  label: string;
};

const AssetLocationDialog = ({ open, onOpenChange, assetKey, imageUrl, label }: Props) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Ubicación · {label}</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <AssetLocationPreview assetKey={assetKey} imageUrl={imageUrl} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssetLocationDialog;
