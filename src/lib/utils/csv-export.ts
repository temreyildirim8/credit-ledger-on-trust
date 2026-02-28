import type { Transaction } from '@/lib/services/transactions.service';

interface CustomerInfo {
  name: string;
  phone?: string;
}

interface CSVExportOptions {
  transactions: Transaction[];
  businessName?: string;
  currency: string;
  locale?: string;
  customerInfo?: CustomerInfo;
  dateRange?: {
    start: string;
    end: string;
  };
}

// Locale-specific headers
const csvHeaders: Record<string, Record<string, string>> = {
  en: {
    date: 'Date',
    customer: 'Customer',
    type: 'Type',
    description: 'Description',
    amount: 'Amount',
    balance: 'Running Balance',
    debt: 'Debt',
    payment: 'Payment',
  },
  tr: {
    date: 'Tarih',
    customer: 'Musteri',
    type: 'Tip',
    description: 'Aciklama',
    amount: 'Tutar',
    balance: 'Bakiye',
    debt: 'Borclanma',
    payment: 'Odeme',
  },
  es: {
    date: 'Fecha',
    customer: 'Cliente',
    type: 'Tipo',
    description: 'Descripcion',
    amount: 'Monto',
    balance: 'Saldo',
    debt: 'Deuda',
    payment: 'Pago',
  },
  id: {
    date: 'Tanggal',
    customer: 'Pelanggan',
    type: 'Jenis',
    description: 'Keterangan',
    amount: 'Jumlah',
    balance: 'Saldo',
    debt: 'Hutang',
    payment: 'Pembayaran',
  },
  hi: {
    date: 'तारीख',
    customer: 'ग्राहक',
    type: 'प्रकार',
    description: 'विवरण',
    amount: 'राशि',
    balance: 'शेष',
    debt: 'ऋण',
    payment: 'भुगतान',
  },
  ar: {
    date: 'التاريخ',
    customer: 'العميل',
    type: 'النوع',
    description: 'الوصف',
    amount: 'المبلغ',
    balance: 'الرصيد',
    debt: 'دين',
    payment: 'دفعة',
  },
  zu: {
    date: 'Usuku',
    customer: 'Ikhasimende',
    type: 'Uhlobo',
    description: 'Incazelo',
    amount: 'Inani',
    balance: 'Isisindo',
    debt: 'Isikweletu',
    payment: 'Inkokhelo',
  },
};

function getCurrencyLocale(currency: string): string {
  const currencyLocaleMap: Record<string, string> = {
    TRY: 'tr-TR',
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
    IDR: 'id-ID',
    NGN: 'en-NG',
    EGP: 'ar-EG',
    ZAR: 'en-ZA',
    INR: 'en-IN',
  };
  return currencyLocaleMap[currency] || 'en-US';
}

function formatCurrencyForCSV(amount: number, currency: string): string {
  const locale = getCurrencyLocale(currency);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDateForCSV(dateStr: string | null, locale: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const dateLocale = locale === 'ar' ? 'ar-EG' : locale === 'tr' ? 'tr-TR' : locale === 'id' ? 'id-ID' : 'en-US';
  return new Intl.DateTimeFormat(dateLocale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

/**
 * Escapes a value for CSV format
 * - Wraps values containing commas, quotes, or newlines in double quotes
 * - Escapes double quotes by doubling them
 */
function escapeCSVValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // If the value contains comma, newline, or double quote, wrap in quotes
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
    // Escape double quotes by doubling them
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Generates a CSV string from transaction data
 */
export function generateTransactionsCSV(options: CSVExportOptions): string {
  const { transactions, businessName, currency, locale = 'en', customerInfo, dateRange } = options;

  // Get locale-specific headers
  const t = csvHeaders[locale] || csvHeaders.en;

  const rows: string[] = [];

  // Add metadata header rows
  if (businessName) {
    rows.push(`# ${businessName}`);
  }
  rows.push(`# Export Date: ${new Date().toISOString().split('T')[0]}`);

  if (customerInfo) {
    rows.push(`# Customer: ${customerInfo.name}`);
    if (customerInfo.phone) {
      rows.push(`# Phone: ${customerInfo.phone}`);
    }
  }

  if (dateRange) {
    rows.push(`# Period: ${dateRange.start} to ${dateRange.end}`);
  }

  rows.push('#');

  // Add CSV header row
  const headerRow = [
    t.date,
    t.customer,
    t.type,
    t.description,
    t.amount,
    t.balance,
  ].map(escapeCSVValue).join(',');
  rows.push(headerRow);

  // Sort transactions by date (oldest first for running balance calculation)
  const sortedTransactions = [...transactions].sort((a, b) => {
    const dateA = new Date(a.transaction_date || a.created_at || 0).getTime();
    const dateB = new Date(b.transaction_date || b.created_at || 0).getTime();
    return dateA - dateB;
  });

  // Calculate running balance and add data rows
  let runningBalance = 0;

  for (const transaction of sortedTransactions) {
    const isDebt = transaction.type === 'debt';

    if (isDebt) {
      runningBalance += transaction.amount;
    } else {
      runningBalance -= transaction.amount;
    }

    const formattedDate = formatDateForCSV(transaction.transaction_date || transaction.created_at, locale);
    const formattedAmount = formatCurrencyForCSV(transaction.amount, currency);
    const amountWithSign = isDebt ? `-${formattedAmount}` : `+${formattedAmount}`;
    const formattedBalance = formatCurrencyForCSV(Math.abs(runningBalance), currency);
    const balanceWithSign = runningBalance >= 0 ? formattedBalance : `-${formattedBalance}`;
    const typeLabel = isDebt ? t.debt : t.payment;

    const dataRow = [
      formattedDate,
      transaction.customer_name || '',
      typeLabel,
      transaction.description || '',
      amountWithSign,
      balanceWithSign,
    ].map(escapeCSVValue).join(',');

    rows.push(dataRow);
  }

  // Add summary row
  if (transactions.length > 0) {
    rows.push('#');
    rows.push(`# Total Transactions: ${transactions.length}`);
    rows.push(`# Final Balance: ${formatCurrencyForCSV(Math.abs(runningBalance), currency)}${runningBalance < 0 ? ' (credit)' : ''}`);
  }

  return rows.join('\n');
}

/**
 * Downloads a CSV file to the user's device
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Add UTF-8 BOM for Excel compatibility
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates a filename for the CSV export
 */
export function generateCSVFilename(
  type: 'all' | 'customer',
  customerName?: string,
  dateRange?: { start: string; end: string }
): string {
  const dateStr = new Date().toISOString().split('T')[0];

  if (type === 'customer' && customerName) {
    // Sanitize customer name for filename
    const sanitizedName = customerName
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 30);
    return `transactions_${sanitizedName}_${dateStr}.csv`;
  }

  if (dateRange) {
    return `transactions_${dateRange.start}_to_${dateRange.end}.csv`;
  }

  return `transactions_${dateStr}.csv`;
}
