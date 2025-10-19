import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import ConfirmDialogService, {
  ConfirmDialogPayload,
} from "./ConfirmDialogService.ts";
import { cn } from "@/lib/utils";

export default function ConfirmDialogComponent() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<ConfirmDialogPayload>();

  const handleClose = () => {
    if (!loading) {
      setOpen(false);
    }
  };

  const submit = () => {
    const result = payload?.confirmCallback();

    if (result instanceof Promise) {
      setLoading(true);
      result
        .then(() => {
          setOpen(false);
        })
        .catch((error) => {
          console.error("Confirm dialog error:", error);
          setOpen(false);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setOpen(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    const subscription = ConfirmDialogService.onDialogRequest().subscribe(
      (payload) => {
        setPayload(payload);
        setOpen(true);
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  // Determine dialog variant based on title or confirmLabel
  const getDialogVariant = () => {
    const title = payload?.title?.toLowerCase() || '';
    const confirmLabel = payload?.confirmLabel?.toLowerCase() || '';
    
    if (title.includes('delete') || confirmLabel.includes('delete')) {
      return 'destructive';
    }
    if (title.includes('warning') || title.includes('caution')) {
      return 'warning';
    }
    if (title.includes('success') || confirmLabel.includes('confirm')) {
      return 'success';
    }
    return 'default';
  };

  const variant = getDialogVariant();

  const getIcon = () => {
    switch (variant) {
      case 'destructive':
        return <XCircle className="h-6 w-6 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-warning" />;
      case 'success':
        return <CheckCircle className="h-6 w-6 text-success" />;
      default:
        return <AlertCircle className="h-6 w-6 text-primary" />;
    }
  };

  const getConfirmButtonVariant = () => {
    switch (variant) {
      case 'destructive':
        return 'destructive' as const;
      case 'warning':
        return 'secondary' as const;
      case 'success':
        return 'primary' as const;
      default:
        return 'primary' as const;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-left">
          <div className="flex items-center gap-3 mb-2">
            {getIcon()}
            <DialogTitle className={cn(
              "text-xl font-semibold",
              variant === 'destructive' && "text-destructive",
              variant === 'warning' && "text-warning",
              variant === 'success' && "text-success"
            )}>
              {payload?.title || "Confirm Action"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-base text-muted-foreground leading-relaxed">
            {payload?.description || "Are you sure you want to proceed?"}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={loading}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            {payload?.cancelLabel || "Cancel"}
          </Button>
          
          <Button 
            variant={getConfirmButtonVariant()}
            onClick={submit}
            loading={loading}
            disabled={loading}
            className="w-full sm:w-auto order-1 sm:order-2"
          >
            {payload?.confirmLabel || "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}