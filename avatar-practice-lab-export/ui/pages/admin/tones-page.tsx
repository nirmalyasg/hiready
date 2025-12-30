import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import ModernDashboardLayout from "@/components/layout/modern-dashboard-layout";
import { SquarePen } from "lucide-react";
type Tone = {
  id: number;
  tone: string;
  description: string;
};

export default function TonesPage() {
  const queryClient = useQueryClient();
  async function fetchTones(): Promise<Tone[]> {
    const res = await fetch("/api/avatar/tones");
    const result = await res.json();
    if (!res.ok) throw new Error(result?.error || "Failed to fetch tones");
    return result.data;
  }
  const { data: tones = [], isLoading } = useQuery({
    queryKey: ["tones"],
    queryFn: fetchTones,
  });

  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState<Tone | null>(null);
  const [formData, setFormData] = useState({ tone: "", description: "" });
  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const method = editing ? "PUT" : "POST";
      const url = editing
        ? `/api/avatar/tones/${editing.id}`
        : "/api/avatar/tones";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["tones"]);
      setOpenDialog(false);
    },
  });
  const handleOpenDialog = (t?: Tone) => {
    if (t) {
      setEditing(t);
      setFormData({ tone: t.tone, description: t.description });
    } else {
      setEditing(null);
      setFormData({ tone: "", description: "" });
    }
    setOpenDialog(true);
  };

  const save = async () => {
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/tones/${editing.id}` : "/api/tones";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    setOpenDialog(false);
    queryClient.invalidateQueries(["tones"]);
  };

  if (isLoading) {
    return (
      <ModernDashboardLayout>
        <div className="flex justify-center items-center h-screen">
          <LoadingSpinner />
        </div>
      </ModernDashboardLayout>
    );
  }

  return (
    <ModernDashboardLayout>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Tones</h2>
        <Button onClick={() => handleOpenDialog()}>+ Create Tone</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {tones.map((t) => (
          <Card
            key={t.id}
            className="group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-0 overflow-hidden bg-white"
          >
            <CardHeader>
              <CardTitle>{t.tone}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{t.description}</p>
              <Button
                className="w-full mt-4"
                variant="outline"
                onClick={() => handleOpenDialog(t)}
              >
                Edit
                <SquarePen className="" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Tone" : "Create Tone"}</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Tone"
            value={formData.tone}
            onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
          />
          <Textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
          <Button
            className="mt-4"
            onClick={() => mutation.mutate(formData)}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogContent>
      </Dialog>
    </ModernDashboardLayout>
  );
}
