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
type Persona = {
  id: number;
  persona: string;
  description: string;
};

export default function PersonasPage() {
  const queryClient = useQueryClient();
  async function fetchPersonas(): Promise<Persona[]> {
    const res = await fetch("/api/avatar/personas");
    const result = await res.json();
    if (!res.ok) throw new Error(result?.error || "Failed to fetch personas");
    return result.data;
  }
  const { data: personas = [], isLoading } = useQuery({
    queryKey: ["personas"],
    queryFn: fetchPersonas,
  });

  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState<Persona | null>(null);
  const [formData, setFormData] = useState({ persona: "", description: "" });
  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const method = editing ? "PUT" : "POST";
      const url = editing
        ? `/api/avatar/personas/${editing.id}`
        : "/api/avatar/personas";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["personas"]);
      setOpenDialog(false);
    },
  });
  const handleOpenDialog = (p?: Persona) => {
    if (p) {
      setEditing(p);
      setFormData({ persona: p.persona, description: p.description });
    } else {
      setEditing(null);
      setFormData({ persona: "", description: "" });
    }
    setOpenDialog(true);
  };

  const save = async () => {
    const method = editing ? "PUT" : "POST";
    const url = editing
      ? `/api/avatar/personas/${editing.id}`
      : "/api/avatar/personas";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    setOpenDialog(false);
    queryClient.invalidateQueries(["personas"]);
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
        <h2 className="text-3xl font-bold text-gray-900">Personas</h2>
        <Button onClick={() => handleOpenDialog()}>+ Create Persona</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {personas.map((p) => (
          <Card
            key={p.id}
            className="group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-0 overflow-hidden bg-white"
          >
            <CardHeader>
              <CardTitle>{p.persona}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{p.description}</p>
              <Button
                className="w-full mt-4"
                variant="outline"
                onClick={() => handleOpenDialog(p)}
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
            <DialogTitle>
              {editing ? "Edit Persona" : "Create Persona"}
            </DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Persona"
            value={formData.persona}
            onChange={(e) =>
              setFormData({ ...formData, persona: e.target.value })
            }
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
