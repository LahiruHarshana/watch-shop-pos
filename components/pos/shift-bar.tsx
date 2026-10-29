"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatLkr, parseLkrInput } from "@/lib/money/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ShiftState = {
  open: { _id: string; openingFloatCents: number } | null;
  expectedCashCents: number;
};

export function ShiftBar() {
  const [state, setState] = useState<ShiftState>({ open: null, expectedCashCents: 0 });
  const [openDialog, setOpenDialog] = useState<"open" | "close" | null>(null);
  const [floatInput, setFloatInput] = useState("0");
  const [countInput, setCountInput] = useState("0");

  const load = useCallback(async () => {
    const res = await fetch("/api/shifts");
    if (res.ok) {
      const json = await res.json();
      setState(json.data);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    fetch("/api/shifts")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!ignore && json) setState(json.data);
      });
    return () => {
      ignore = true;
    };
  }, []);

  async function openShift() {
    const res = await fetch("/api/shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ openingFloatCents: parseLkrInput(floatInput) }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error?.message ?? "Failed to open shift");
      return;
    }
    toast.success("Shift opened");
    setOpenDialog(null);
    load();
  }

  async function closeShift() {
    if (!state.open) return;
    const res = await fetch(`/api/shifts/${state.open._id}/close`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ countedCashCents: parseLkrInput(countInput) }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error?.message ?? "Failed to close shift");
      return;
    }
    const variance = json.data.varianceCents;
    toast.success(
      variance === 0
        ? "Shift closed — drawer balanced"
        : `Shift closed — variance ${formatLkr(variance)}`,
    );
    setOpenDialog(null);
    load();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (state.open) {
            setCountInput(String(state.expectedCashCents / 100));
            setOpenDialog("close");
          } else {
            setOpenDialog("open");
          }
        }}
        className={cn(
          "inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border bg-white px-3 text-sm font-medium transition hover:border-brand/30",
          state.open
            ? "bg-muted text-foreground hover:bg-accent"
            : "bg-primary text-primary-foreground hover:brightness-110",
        )}
      >
        {state.open ? (
          <>
            <span className="text-muted-foreground">Shift open</span>
            <span className="metric font-medium">{formatLkr(state.expectedCashCents)}</span>
          </>
        ) : (
          <span>No open shift — tap to open</span>
        )}
      </button>

      <Dialog open={openDialog === "open"} onOpenChange={(o) => !o && setOpenDialog(null)}>
        <DialogContent className="pos-surface border-0">
          <DialogHeader>
            <DialogTitle>Open shift</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Opening float (LKR)</Label>
            <Input value={floatInput} onChange={(e) => setFloatInput(e.target.value)} />
          </div>
          <DialogFooter>
            <Button onClick={openShift}>Open shift</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openDialog === "close"} onOpenChange={(o) => !o && setOpenDialog(null)}>
        <DialogContent className="pos-surface border-0">
          <DialogHeader>
            <DialogTitle>Close shift & reconcile</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Expected in drawer: {formatLkr(state.expectedCashCents)}
          </p>
          <div className="space-y-2">
            <Label>Counted cash (LKR)</Label>
            <Input value={countInput} onChange={(e) => setCountInput(e.target.value)} />
          </div>
          <DialogFooter>
            <Button onClick={closeShift}>Close shift</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
