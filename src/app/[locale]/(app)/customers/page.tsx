"use client";

import { useState } from "react";
import { useCustomers } from "@/lib/hooks/useCustomers";
import { useTransactions } from "@/lib/hooks/useTransactions";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { CustomerTable } from "@/components/customers/CustomerTable";
import { CustomerCard } from "@/components/customers/CustomerCard";
import { CustomerDetailsModal } from "@/components/customers/CustomerDetailsModal";
import { AddCustomerModal } from "@/components/customers/AddCustomerModal";
import { EditCustomerModal } from "@/components/customers/EditCustomerModal";
import { DestructiveActionModal } from "@/components/customers/DestructiveActionModal";
import { AddTransactionModal } from "@/components/transactions/AddTransactionModal";
import { Button } from "@/components/ui/button";
import { Plus, Search, Loader2, LayoutGrid, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { usePathname } from "@/routing";
import { useTranslations } from "next-intl";
import { Customer } from "@/lib/services/customers.service";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import { toast } from "sonner";

export default function CustomersPage() {
  const [showArchived, setShowArchived] = useState(false);
  const {
    customers,
    totalCount,
    loading,
    createCustomer,
    updateCustomer,
    refreshCustomers,
    archiveCustomer,
    deleteCustomer,
  } = useCustomers(showArchived);
  const { createTransaction } = useTransactions();
  const { isPaidPlan } = useSubscription();
  const { currency } = useUserProfile();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [destructiveModalOpen, setDestructiveModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  );
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [transactionType, setTransactionType] = useState<"debt" | "payment">(
    "debt",
  );
  const [destructiveActionType, setDestructiveActionType] = useState<
    "archive" | "delete"
  >("archive");
  const [destructiveLoading, setDestructiveLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "hasDebt" | "paidUp" | "archived"
  >("all");
  const [viewMode, setViewMode] = useState<"table" | "cards">(
    typeof window !== "undefined" && window.innerWidth < 1024
      ? "cards"
      : "table",
  );
  const [sortColumn, setSortColumn] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const t = useTranslations("customers");

  const filteredCustomers = customers.filter((customer) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      customer.name.toLowerCase().includes(q) ||
      customer.phone?.includes(searchQuery) ||
      customer.id.toLowerCase().includes(q) ||
      (customer.national_id ?? "").toLowerCase().includes(q);

    // When showing archived, only show archived customers
    if (filterType === "archived")
      return customer.is_deleted === true && matchesSearch;
    if (filterType === "hasDebt")
      return (
        customer.balance > 0 &&
        customer.is_deleted !== true &&
        matchesSearch
      );
    if (filterType === "paidUp")
      return (
        customer.balance <= 0 &&
        customer.is_deleted !== true &&
        matchesSearch
      );
    // "all" filter - exclude archived unless showArchived is true
    if (!showArchived && filterType === "all") {
      return customer.is_deleted !== true && matchesSearch;
    }
    return matchesSearch;
  });

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    let aValue: string | number = "";
    let bValue: string | number = "";

    switch (sortColumn) {
      case "name":
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case "balance":
        aValue = a.balance;
        bValue = b.balance;
        break;
      case "last_transaction":
        aValue = a.last_transaction_date
          ? new Date(a.last_transaction_date).getTime()
          : 0;
        bValue = b.last_transaction_date
          ? new Date(b.last_transaction_date).getTime()
          : 0;
        break;
      case "created_at":
      default:
        aValue = a.created_at ? new Date(a.created_at).getTime() : 0;
        bValue = b.created_at ? new Date(b.created_at).getTime() : 0;
        break;
    }

    if (sortDirection === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    }
    return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
  });

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleRowClick = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
    setDetailsModalOpen(true);
  };

  const handleAddDebt = (customer: Customer) => {
    setSelectedCustomer(customer);
    setTransactionType("debt");
    setTransactionModalOpen(true);
  };

  const handleRecordPayment = (customer: Customer) => {
    setSelectedCustomer(customer);
    setTransactionType("payment");
    setTransactionModalOpen(true);
  };

  const handleTransactionSave = async (transaction: {
    customerId: string;
    type: "debt" | "payment";
    amount: number;
    note?: string;
  }) => {
    await createTransaction(transaction);
    // Refresh customer list to update balances
    refreshCustomers();
  };

  // Pass national_id from modal to hook
  const handleAddCustomer = async (customer: {
    national_id?: string;
    name: string;
    phone?: string;
    address?: string;
    notes?: string;
  }) => {
    return createCustomer({
      national_id: customer.national_id || undefined,
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      notes: customer.notes,
    });
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setEditModalOpen(true);
  };

  const handleEditSave = async (
    customerId: string,
    updates: {
      national_id?: string | null;
      name: string;
      phone?: string;
      address?: string;
      notes?: string;
    },
  ) => {
    await updateCustomer(customerId, updates);
    refreshCustomers();
  };

  const handleArchive = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDestructiveActionType("archive");
    setDestructiveModalOpen(true);
  };

  const handleDelete = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDestructiveActionType("delete");
    setDestructiveModalOpen(true);
  };

  const handleDestructiveConfirm = async () => {
    if (!selectedCustomer) return;
    setDestructiveLoading(true);
    try {
      if (destructiveActionType === "archive") {
        await archiveCustomer(selectedCustomer.id);
        toast.success(`${selectedCustomer.name} has been archived`);
      } else {
        await deleteCustomer(selectedCustomer.id);
        toast.success(`${selectedCustomer.name} has been deleted`);
      }
    } catch (error) {
      toast.error(`Failed to ${destructiveActionType} customer`);
      console.error(`Error ${destructiveActionType}ing customer:`, error);
    } finally {
      setDestructiveLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-hover)] rounded-2xl p-6 text-white dark:bg-none dark:p-0 dark:text-foreground">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-display">{t("title")}</h1>
            <p className="text-white/90 mt-1 dark:text-muted-foreground">
              {t("countWithTotal", {
                active: customers.filter((c) => !c.is_deleted).length,
                total: totalCount,
              })}
            </p>
          </div>
          <Button
            onClick={() => setAddModalOpen(true)}
            className="bg-white text-[var(--color-accent)] hover:bg-white/90 dark:bg-accent dark:text-white dark:hover:bg-accent-hover"
          >
            <Plus className="h-4 w-4" />
            {t("addCustomer")}
          </Button>
        </div>
      </div>

      {/* Search, Filters, and View Toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filterType === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setFilterType("all");
              setShowArchived(false);
            }}
          >
            {t("filter.all")}
          </Button>
          <Button
            variant={filterType === "hasDebt" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setFilterType("hasDebt");
              setShowArchived(false);
            }}
            className={
              filterType === "hasDebt" ? "bg-red-500 hover:bg-red-600" : ""
            }
          >
            {t("filter.hasDebt")}
          </Button>
          <Button
            variant={filterType === "paidUp" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setFilterType("paidUp");
              setShowArchived(false);
            }}
            className={
              filterType === "paidUp" ? "bg-green-500 hover:bg-green-600" : ""
            }
          >
            {t("filter.paidUp")}
          </Button>
          <Button
            variant={filterType === "archived" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setFilterType("archived");
              setShowArchived(true);
            }}
            className={
              filterType === "archived" ? "bg-gray-500 hover:bg-gray-600" : ""
            }
          >
            {t("filter.archived")}
          </Button>
        </div>
        {/* View Toggle — desktop only (lg and above) */}
        <div className="hidden lg:flex gap-1 border border-[var(--color-border)] rounded-lg p-1">
          <Button
            variant={viewMode === "table" ? "default" : "ghost"}
            size="icon"
            onClick={() => setViewMode("table")}
            className="h-8 w-8"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "cards" ? "default" : "ghost"}
            size="icon"
            onClick={() => setViewMode("cards")}
            className="h-8 w-8"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Customer List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
        </div>
      ) : sortedCustomers.length === 0 ? (
        <div className="text-center py-12 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center">
            <Plus className="h-8 w-8 text-[var(--color-accent)]" />
          </div>
          <p className="text-[var(--color-text-secondary)] text-lg font-medium">
            {searchQuery ? t("empty.noSearchResults") : t("empty.noCustomers")}
          </p>
          <p className="text-[var(--color-text-tertiary)] mt-2">
            {searchQuery
              ? t("empty.noSearchResultsDesc")
              : t("empty.description")}
          </p>
          {!searchQuery && (
            <Button
              onClick={() => setAddModalOpen(true)}
              className="mt-6 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("empty.addFirst")}
            </Button>
          )}
        </div>
      ) : viewMode === "table" ? (
        /* Desktop table view (lg and above) */
        <div className="hidden lg:block">
          <CustomerTable
            customers={sortedCustomers}
            locale={locale}
            currency={currency}
            onRowClick={handleRowClick}
            onAddDebt={handleAddDebt}
            onRecordPayment={handleRecordPayment}
            onEdit={handleEdit}
            onArchive={handleArchive}
            onDelete={handleDelete}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        </div>
      ) : null}
      {/* Card view: always on mobile/tablet (below lg), optional on desktop */}
      {!loading && sortedCustomers.length > 0 && (
        <div className={viewMode === "cards" ? "block" : "lg:hidden"}>
          <div className="grid gap-3 sm:grid-cols-1">
            {sortedCustomers.map((customer) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                locale={locale}
                currency={currency}
                onClick={() => handleRowClick(customer)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      <AddCustomerModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onSave={handleAddCustomer}
        currentCustomerCount={totalCount}
        isPaidPlan={isPaidPlan}
      />

      {/* Edit Customer Modal */}
      <EditCustomerModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSave={handleEditSave}
        customer={selectedCustomer}
      />

      {/* Customer Details Modal */}
      <CustomerDetailsModal
        customerId={selectedCustomerId}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        onAddDebt={handleAddDebt}
        onRecordPayment={handleRecordPayment}
        onEdit={handleEdit}
        locale={locale}
      />

      {/* Add Transaction Modal */}
      <AddTransactionModal
        open={transactionModalOpen}
        onOpenChange={setTransactionModalOpen}
        onSave={handleTransactionSave}
        preselectedCustomerId={selectedCustomer?.id}
        preselectedType={transactionType}
      />

      {/* Destructive Action Modal (Archive/Delete) */}
      <DestructiveActionModal
        open={destructiveModalOpen}
        onOpenChange={setDestructiveModalOpen}
        customerName={selectedCustomer?.name || ""}
        onConfirm={handleDestructiveConfirm}
        actionType={destructiveActionType}
        loading={destructiveLoading}
      />
    </div>
  );
}
