import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getAssumptions, createAssumption, updateAssumption } from "../api/assumptions";
import GlassCard from "../components/ui/GlassCard";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import TextArea from "../components/ui/TextArea";
import Select from "../components/ui/Select";
import Spinner from "../components/ui/Spinner";
import ThresholdBar from "../components/ui/ThresholdBar";
import EmptyState from "../components/ui/EmptyState";
import { SENSOR_CONFIG } from "../utils/constants";
import { formatDate } from "../utils/format";
import { List, Plus, X } from "lucide-react";
import type { Assumption, SensorType } from "../types";

export default function AssumptionsPage() {
  const { id } = useParams<{ id: string }>();
  const [assumptions, setAssumptions] = useState<Assumption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ category: "", description: "", sensor_type: "", threshold_value: "", threshold_unit: "" });

  const loadData = async () => {
    if (!id) return;
    try {
      const data = await getAssumptions(id);
      setAssumptions(data);
    } catch (err) {
      console.error("Failed to load assumptions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id]);

  const handleCreate = async () => {
    if (!id) return;
    try {
      await createAssumption(id, {
        category: formData.category,
        description: formData.description,
        sensor_type: formData.sensor_type || undefined,
        threshold_value: formData.threshold_value ? parseFloat(formData.threshold_value) : undefined,
        threshold_unit: formData.threshold_unit || undefined,
      });
      setShowForm(false);
      setFormData({ category: "", description: "", sensor_type: "", threshold_value: "", threshold_unit: "" });
      loadData();
    } catch (err) {
      console.error("Failed to create assumption:", err);
    }
  };

  const handleStatusChange = async (assumption: Assumption, status: string) => {
    if (!id) return;
    try {
      await updateAssumption(id, assumption.id, { status });
      loadData();
    } catch (err) {
      console.error("Failed to update assumption:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size={32} className="text-accent" />
      </div>
    );
  }

  const sensorOptions = Object.entries(SENSOR_CONFIG).map(([value, cfg]) => ({
    value,
    label: cfg.label,
  }));

  const statusBadge = (status: string) => {
    if (status === "validated") return "chain-verified";
    if (status === "invalidated") return "chain-failed";
    return "chain-pending";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>
          {assumptions.length} assumption{assumptions.length !== 1 ? "s" : ""}
        </span>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? "Cancel" : "Add Assumption"}
        </Button>
      </div>

      {showForm && (
        <GlassCard padding="md">
          <div className="space-y-3">
            <Input
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData((d) => ({ ...d, category: e.target.value }))}
              placeholder="e.g., Material Cost, Weather, Labour"
            />
            <TextArea
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData((d) => ({ ...d, description: e.target.value }))}
              placeholder="Describe the assumption..."
            />
            <div className="grid grid-cols-3 gap-3">
              <Select
                label="Sensor Type"
                options={sensorOptions}
                value={formData.sensor_type}
                onChange={(e) => setFormData((d) => ({ ...d, sensor_type: e.target.value }))}
              />
              <Input
                label="Threshold"
                type="number"
                value={formData.threshold_value}
                onChange={(e) => setFormData((d) => ({ ...d, threshold_value: e.target.value }))}
              />
              <Input
                label="Unit"
                value={formData.threshold_unit}
                onChange={(e) => setFormData((d) => ({ ...d, threshold_unit: e.target.value }))}
                placeholder={formData.sensor_type ? SENSOR_CONFIG[formData.sensor_type as SensorType]?.unit : ""}
              />
            </div>
            <Button onClick={handleCreate}>Save Assumption</Button>
          </div>
        </GlassCard>
      )}

      {assumptions.length === 0 ? (
        <EmptyState icon={List} title="No assumptions" description="Add assumptions to monitor with IoT sensors." />
      ) : (
        <div className="space-y-3">
          {assumptions.map((a) => (
            <GlassCard key={a.id} padding="md">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={statusBadge(a.status) as any}>{a.status}</Badge>
                    <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
                      {a.category}
                    </span>
                  </div>
                  <p className="text-[13px]" style={{ color: "var(--text-primary)" }}>
                    {a.description}
                  </p>
                  {a.sensor_type && a.threshold_value && (
                    <div className="mt-2 flex items-center gap-3">
                      <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                        {SENSOR_CONFIG[a.sensor_type]?.label}: ≤ {a.threshold_value} {a.threshold_unit}
                      </span>
                      <div className="w-32">
                        <ThresholdBar value={SENSOR_CONFIG[a.sensor_type]?.base ?? 0} threshold={a.threshold_value} />
                      </div>
                    </div>
                  )}
                  <p className="text-[10px] mt-2" style={{ color: "var(--text-muted)" }}>
                    Created {formatDate(a.created_at)}
                  </p>
                </div>
                {a.status === "active" && (
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleStatusChange(a, "validated")}>
                      Validate
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleStatusChange(a, "invalidated")}>
                      Invalidate
                    </Button>
                  </div>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
