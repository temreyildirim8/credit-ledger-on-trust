"use client";

import { useState, useEffect, useCallback } from "react";
import { useSubscription } from "./useSubscription";
import { customFieldsService } from "@/lib/services/custom-fields.service";
import type {
  CustomFieldDefinition,
  CustomFieldValues,
  CustomFieldErrors,
} from "@/lib/types/custom-fields";

export function useCustomFields() {
  const { hasFeature, loading: subscriptionLoading } = useSubscription();
  const [definitions, setDefinitions] = useState<CustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const canUseCustomFields = hasFeature("customFields");

  const fetchDefinitions = useCallback(async () => {
    if (subscriptionLoading) return;

    if (!canUseCustomFields) {
      setDefinitions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const fields = await customFieldsService.getFieldDefinitions();
      setDefinitions(fields);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch"));
    } finally {
      setLoading(false);
    }
  }, [canUseCustomFields, subscriptionLoading]);

  useEffect(() => {
    fetchDefinitions();
  }, [fetchDefinitions]);

  const validateValues = useCallback(
    (values: CustomFieldValues): CustomFieldErrors => {
      return customFieldsService.validateFieldValues(definitions, values);
    },
    [definitions],
  );

  return {
    definitions,
    loading: loading || subscriptionLoading,
    error,
    canUseCustomFields,
    refresh: fetchDefinitions,
    validateValues,
  };
}
