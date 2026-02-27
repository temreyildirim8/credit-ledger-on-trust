"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, GripVertical, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { UpgradePrompt } from "@/components/subscription/UpgradePrompt";
import { customFieldsService } from "@/lib/services/custom-fields.service";
import type {
  CustomFieldDefinition,
  CustomFieldType,
  SelectOption,
} from "@/lib/types/custom-fields";

const FIELD_TYPES: { value: CustomFieldType; labelKey: string }[] = [
  { value: "text", labelKey: "types.text" },
  { value: "number", labelKey: "types.number" },
  { value: "date", labelKey: "types.date" },
  { value: "select", labelKey: "types.select" },
  { value: "textarea", labelKey: "types.textarea" },
  { value: "checkbox", labelKey: "types.checkbox" },
];

export function CustomFieldManager() {
  const t = useTranslations("settings.customFields");
  const { hasFeature, plan, loading: subLoading } = useSubscription();

  const [fields, setFields] = useState<CustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingField, setEditingField] =
    useState<CustomFieldDefinition | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [fieldType, setFieldType] = useState<CustomFieldType>("text");
  const [options, setOptions] = useState<SelectOption[]>([]);
  const [isRequired, setIsRequired] = useState(false);
  const [newOptionLabel, setNewOptionLabel] = useState("");

  const canUseCustomFields = hasFeature("customFields");

  useEffect(() => {
    if (canUseCustomFields) {
      loadFields();
    } else {
      setLoading(false);
    }
  }, [canUseCustomFields]);

  const loadFields = async () => {
    try {
      setLoading(true);
      const data = await customFieldsService.getFieldDefinitions();
      setFields(data);
    } catch {
      toast.error(t("loadError"));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (field?: CustomFieldDefinition) => {
    if (field) {
      setEditingField(field);
      setName(field.name);
      setFieldType(field.field_type as CustomFieldType);
      setOptions(field.options || []);
      setIsRequired(field.is_required);
    } else {
      setEditingField(null);
      setName("");
      setFieldType("text");
      setOptions([]);
      setIsRequired(false);
    }
    setNewOptionLabel("");
    setDialogOpen(true);
  };

  const handleAddOption = () => {
    if (!newOptionLabel.trim()) return;

    const value = newOptionLabel
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/(^_|_$)/g, "");

    setOptions([
      ...options,
      {
        label: newOptionLabel.trim(),
        value: value || `option_${options.length}`,
      },
    ]);
    setNewOptionLabel("");
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(t("nameRequired"));
      return;
    }

    if (fieldType === "select" && options.length === 0) {
      toast.error(t("optionsRequired"));
      return;
    }

    try {
      setSaving(true);
      if (editingField) {
        await customFieldsService.updateField(editingField.id, {
          name,
          options: fieldType === "select" ? options : [],
          is_required: isRequired,
        });
        toast.success(t("updateSuccess"));
      } else {
        await customFieldsService.createField({
          name,
          field_type: fieldType,
          options: fieldType === "select" ? options : [],
          is_required: isRequired,
        });
        toast.success(t("createSuccess"));
      }
      setDialogOpen(false);
      loadFields();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirmDelete"))) return;

    try {
      await customFieldsService.deleteField(id);
      toast.success(t("deleteSuccess"));
      loadFields();
    } catch {
      toast.error(t("deleteError"));
    }
  };

  // Show upgrade prompt for non-Pro users
  if (!canUseCustomFields) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <UpgradePrompt variant="card" feature="Custom Fields" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t("title")}</CardTitle>
        <Button onClick={() => handleOpenDialog()} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {t("addField")}
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : fields.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">{t("noFields")}</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              {t("noFieldsDescription")}
            </p>
            <Button onClick={() => handleOpenDialog()} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {t("addField")}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {fields.map((field) => (
              <div
                key={field.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-surface-alt"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                <div className="flex-1">
                  <p className="font-medium">{field.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t(
                      FIELD_TYPES.find((ft) => ft.value === field.field_type)
                        ?.labelKey || field.field_type,
                    )}
                    {field.is_required && (
                      <span className="ml-2 text-destructive">*</span>
                    )}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleOpenDialog(field)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(field.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-1/2">
          <DialogHeader>
            <DialogTitle>
              {editingField ? t("editField") : t("addField")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("fieldName")}</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("fieldNamePlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("fieldType")}</Label>
              <Select
                value={fieldType}
                onValueChange={(v) => setFieldType(v as CustomFieldType)}
                disabled={!!editingField}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {t(type.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editingField && (
                <p className="text-xs text-muted-foreground">
                  {t("fieldTypeLocked")}
                </p>
              )}
            </div>

            {fieldType === "select" && (
              <div className="space-y-2">
                <Label>{t("options")}</Label>
                <div className="flex gap-2">
                  <Input
                    value={newOptionLabel}
                    onChange={(e) => setNewOptionLabel(e.target.value)}
                    placeholder={t("optionPlaceholder")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddOption();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddOption}
                    disabled={!newOptionLabel.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {options.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {options.map((option, index) => (
                      <div
                        key={option.value}
                        className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-sm"
                      >
                        {option.label}
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(index)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Switch checked={isRequired} onCheckedChange={setIsRequired} />
              <Label>{t("isRequired")}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
