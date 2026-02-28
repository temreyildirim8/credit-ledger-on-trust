import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { Customer } from '@/lib/services/customers.service';
import { getBrandName } from '@/lib/branding';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  transaction_date: string | null;
  created_at: string | null;
  description?: string | null;
}

interface BusinessInfo {
  name: string;
  currency: string;
  language: string;
}

interface PDFStatementOptions {
  customer: Customer;
  transactions: Transaction[];
  businessInfo: BusinessInfo;
  locale?: string;
}

interface PDFFormatters {
  currency: (amount: number) => string;
  date: (date: string | null) => string;
}

// Locale-specific labels
const labels: Record<string, Record<string, string>> = {
  en: {
    title: 'Account Statement',
    business: 'Business',
    customer: 'Customer',
    phone: 'Phone',
    address: 'Address',
    date: 'Date',
    description: 'Description',
    type: 'Type',
    amount: 'Amount',
    balance: 'Balance',
    debt: 'Debt',
    payment: 'Payment',
    totalOutstanding: 'Total Outstanding',
    generatedOn: 'Generated on',
    page: 'Page',
    noTransactions: 'No transactions recorded',
    footer: 'This is a computer-generated statement.',
  },
  tr: {
    title: 'Hesap Ozeti',
    business: 'Isletme',
    customer: 'Musteri',
    phone: 'Telefon',
    address: 'Adres',
    date: 'Tarih',
    description: 'Aciklama',
    type: 'Tip',
    amount: 'Tutar',
    balance: 'Bakiye',
    debt: 'Borclanma',
    payment: 'Odeme',
    totalOutstanding: 'Toplam Borc',
    generatedOn: 'Olusturulma tarihi',
    page: 'Sayfa',
    noTransactions: 'Henuz islem kaydi yok',
    footer: 'Bu belge bilgisayar tarafindan olusturulmustur.',
  },
  es: {
    title: 'Estado de Cuenta',
    business: 'Negocio',
    customer: 'Cliente',
    phone: 'Telefono',
    address: 'Direccion',
    date: 'Fecha',
    description: 'Descripcion',
    type: 'Tipo',
    amount: 'Monto',
    balance: 'Saldo',
    debt: 'Deuda',
    payment: 'Pago',
    totalOutstanding: 'Total Pendiente',
    generatedOn: 'Generado el',
    page: 'Pagina',
    noTransactions: 'Sin transacciones registradas',
    footer: 'Este es un documento generado por computadora.',
  },
  id: {
    title: 'Laporan Rekening',
    business: 'Bisnis',
    customer: 'Pelanggan',
    phone: 'Telepon',
    address: 'Alamat',
    date: 'Tanggal',
    description: 'Keterangan',
    type: 'Jenis',
    amount: 'Jumlah',
    balance: 'Saldo',
    debt: 'Hutang',
    payment: 'Pembayaran',
    totalOutstanding: 'Total Terutang',
    generatedOn: 'Dibuat pada',
    page: 'Halaman',
    noTransactions: 'Belum ada transaksi',
    footer: 'Ini adalah dokumen yang dihasilkan oleh komputer.',
  },
  hi: {
    title: 'खाता विवरण',
    business: 'व्यवसाय',
    customer: 'ग्राहक',
    phone: 'फोन',
    address: 'पता',
    date: 'तारीख',
    description: 'विवरण',
    type: 'प्रकार',
    amount: 'राशि',
    balance: 'शेष',
    debt: 'ऋण',
    payment: 'भुगतान',
    totalOutstanding: 'कुल बकाया',
    generatedOn: 'तैयार की गई तारीख',
    page: 'पृष्ठ',
    noTransactions: 'कोई लेनदेन नहीं',
    footer: 'यह कंप्यूटर द्वारा उत्पन्न दस्तावेज है।',
  },
  ar: {
    title: 'كشف حساب',
    business: 'العمل',
    customer: 'العميل',
    phone: 'الهاتف',
    address: 'العنوان',
    date: 'التاريخ',
    description: 'الوصف',
    type: 'النوع',
    amount: 'المبلغ',
    balance: 'الرصيد',
    debt: 'دين',
    payment: 'دفعة',
    totalOutstanding: 'المجموع المستحق',
    generatedOn: 'تم إنشاؤه في',
    page: 'صفحة',
    noTransactions: 'لا توجد معاملات',
    footer: 'هذا مستند مولد بالكمبيوتر.',
  },
  zu: {
    title: 'Isitatimende Se-akhawunti',
    business: 'Ibhizinisi',
    customer: 'Ikhasimende',
    phone: 'Ifoni',
    address: 'Ikheli',
    date: 'Usuku',
    description: 'Incazelo',
    type: 'Uhlobo',
    amount: 'Inani',
    balance: 'Isisindo',
    debt: 'Isikweletu',
    payment: 'Inkokhelo',
    totalOutstanding: 'Isamba Esisalele',
    generatedOn: 'Kwenziwe ngo',
    page: 'Ikhasi',
    noTransactions: 'Awekho ezinye izindlela',
    footer: 'Lesi yidokhumente elenziwe ngokhompyutha.',
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

function formatCurrencyForPDF(amount: number, currency: string): string {
  const locale = getCurrencyLocale(currency);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDateForPDF(dateStr: string | null, locale: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const dateLocale = locale === 'ar' ? 'ar-EG' : locale === 'tr' ? 'tr-TR' : locale === 'id' ? 'id-ID' : 'en-US';
  return new Intl.DateTimeFormat(dateLocale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export async function generateCustomerStatementPDF(options: PDFStatementOptions): Promise<Uint8Array> {
  const { customer, transactions, businessInfo, locale = 'en' } = options;

  const pdfDoc = await PDFDocument.create();
  const pageWidth = 595; // A4 width in points
  const pageHeight = 842; // A4 height in points
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;

  // Get locale-specific labels
  const t = labels[locale] || labels.en;

  // Embed fonts
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Colors
  const primaryColor = rgb(0.231, 0.510, 0.965); // #3B82F6 - Global Blue
  const textColor = rgb(0.2, 0.2, 0.2);
  const lightGray = rgb(0.6, 0.6, 0.6);
  const darkGray = rgb(0.4, 0.4, 0.4);
  const redColor = rgb(0.8, 0.2, 0.2);
  const greenColor = rgb(0.2, 0.6, 0.2);

  // Formatters
  const formatters: PDFFormatters = {
    currency: (amount) => formatCurrencyForPDF(amount, businessInfo.currency),
    date: (date) => formatDateForPDF(date, locale),
  };

  // Add first page
  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  // Helper function to check if we need a new page
  const checkNewPage = (requiredSpace: number) => {
    if (y - requiredSpace < margin + 50) {
      // Add footer to current page
      currentPage.drawText(`${t.page} ${pdfDoc.getPageCount()}`, {
        x: pageWidth / 2 - 20,
        y: 30,
        size: 9,
        font: helvetica,
        color: lightGray,
      });

      // Add new page
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
      return true;
    }
    return false;
  };

  // Header with business name
  currentPage.drawRectangle({
    x: margin,
    y: y - 40,
    width: contentWidth,
    height: 50,
    color: primaryColor,
  });

  currentPage.drawText(businessInfo.name || getBrandName(locale || 'en'), {
    x: margin + 15,
    y: y - 20,
    size: 22,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  });

  y -= 70;

  // Title
  currentPage.drawText(t.title, {
    x: margin,
    y: y,
    size: 18,
    font: helveticaBold,
    color: textColor,
  });

  y -= 30;

  // Generated date
  const today = new Date();
  const generatedDate = `${t.generatedOn}: ${formatters.date(today.toISOString())}`;
  currentPage.drawText(generatedDate, {
    x: margin,
    y: y,
    size: 10,
    font: helvetica,
    color: lightGray,
  });

  y -= 30;

  // Customer info section
  currentPage.drawRectangle({
    x: margin,
    y: y - 80,
    width: contentWidth,
    height: 90,
    color: rgb(0.96, 0.96, 0.96),
  });

  const customerInfoY = y - 15;

  // Customer name
  currentPage.drawText(t.customer + ':', {
    x: margin + 15,
    y: customerInfoY,
    size: 10,
    font: helvetica,
    color: darkGray,
  });
  currentPage.drawText(customer.name, {
    x: margin + 100,
    y: customerInfoY,
    size: 12,
    font: helveticaBold,
    color: textColor,
  });

  // Phone
  if (customer.phone) {
    currentPage.drawText(t.phone + ':', {
      x: margin + 15,
      y: customerInfoY - 20,
      size: 10,
      font: helvetica,
      color: darkGray,
    });
    currentPage.drawText(customer.phone, {
      x: margin + 100,
      y: customerInfoY - 20,
      size: 10,
      font: helvetica,
      color: textColor,
    });
  }

  // Address
  if (customer.address) {
    currentPage.drawText(t.address + ':', {
      x: margin + 15,
      y: customerInfoY - 40,
      size: 10,
      font: helvetica,
      color: darkGray,
    });
    // Truncate long addresses
    const maxAddressWidth = contentWidth - 130;
    let addressText = customer.address;
    while (helvetica.widthOfTextAtSize(addressText, 10) > maxAddressWidth && addressText.length > 10) {
      addressText = addressText.slice(0, -4) + '...';
    }
    currentPage.drawText(addressText, {
      x: margin + 100,
      y: customerInfoY - 40,
      size: 10,
      font: helvetica,
      color: textColor,
    });
  }

  // Total outstanding
  const balanceY = customerInfoY - 60;
  currentPage.drawText(t.totalOutstanding + ':', {
    x: margin + 15,
    y: balanceY,
    size: 12,
    font: helveticaBold,
    color: darkGray,
  });

  const balanceColor = customer.balance > 0 ? redColor : greenColor;
  currentPage.drawText(formatters.currency(Math.abs(customer.balance)), {
    x: margin + 150,
    y: balanceY,
    size: 14,
    font: helveticaBold,
    color: balanceColor,
  });

  y -= 110;

  // Transactions table header
  const colWidths = {
    date: 80,
    type: 70,
    description: 180,
    amount: 90,
  };

  const drawTableHeader = () => {
    const headerY = y + 5;
    const headerHeight = 25;

    // Header background
    currentPage.drawRectangle({
      x: margin,
      y: headerY - headerHeight,
      width: contentWidth,
      height: headerHeight,
      color: rgb(0.93, 0.93, 0.93),
    });

    // Header text
    let headerX = margin + 10;
    currentPage.drawText(t.date, { x: headerX, y: headerY - 15, size: 9, font: helveticaBold, color: darkGray });
    headerX += colWidths.date;
    currentPage.drawText(t.type, { x: headerX, y: headerY - 15, size: 9, font: helveticaBold, color: darkGray });
    headerX += colWidths.type;
    currentPage.drawText(t.description, { x: headerX, y: headerY - 15, size: 9, font: helveticaBold, color: darkGray });
    headerX += colWidths.description;
    currentPage.drawText(t.amount, { x: headerX, y: headerY - 15, size: 9, font: helveticaBold, color: darkGray });

    y -= 30;
  };

  drawTableHeader();

  // Transactions
  if (transactions.length === 0) {
    currentPage.drawText(t.noTransactions, {
      x: margin + 10,
      y: y,
      size: 10,
      font: helvetica,
      color: lightGray,
    });
    y -= 20;
  } else {
    const rowHeight = 22;
    let rowIndex = 0;

    for (const transaction of transactions) {
      checkNewPage(rowHeight + 10);

      // Alternate row background
      if (rowIndex % 2 === 0) {
        currentPage.drawRectangle({
          x: margin,
          y: y - rowHeight + 5,
          width: contentWidth,
          height: rowHeight,
          color: rgb(0.98, 0.98, 0.98),
        });
      }

      let colX = margin + 10;

      // Determine transaction type
      const isDebt = transaction.type === 'debt';

      // Date
      const dateText = formatters.date(transaction.transaction_date || transaction.created_at);
      currentPage.drawText(dateText, {
        x: colX,
        y: y - 8,
        size: 9,
        font: helvetica,
        color: textColor,
      });
      colX += colWidths.date;

      // Type badge
      const typeLabel = isDebt ? t.debt : t.payment;
      const typeColor = isDebt ? redColor : greenColor;

      // Draw type badge background
      const badgeWidth = helvetica.widthOfTextAtSize(typeLabel, 9) + 10;
      currentPage.drawRectangle({
        x: colX - 2,
        y: y - 14,
        width: badgeWidth,
        height: 14,
        color: isDebt ? rgb(0.95, 0.85, 0.85) : rgb(0.85, 0.95, 0.85),
      });
      currentPage.drawText(typeLabel, {
        x: colX + 3,
        y: y - 8,
        size: 9,
        font: helveticaBold,
        color: typeColor,
      });
      colX += colWidths.type;

      // Description
      let descText = transaction.description || '-';
      const maxDescWidth = colWidths.description - 10;
      while (helvetica.widthOfTextAtSize(descText, 9) > maxDescWidth && descText.length > 5) {
        descText = descText.slice(0, -4) + '...';
      }
      currentPage.drawText(descText, {
        x: colX,
        y: y - 8,
        size: 9,
        font: helvetica,
        color: textColor,
      });
      colX += colWidths.description;

      // Amount
      const amountStr = (isDebt ? '+' : '-') + formatters.currency(transaction.amount);
      currentPage.drawText(amountStr, {
        x: colX,
        y: y - 8,
        size: 9,
        font: helveticaBold,
        color: typeColor,
      });

      y -= rowHeight;
      rowIndex++;
    }
  }

  // Footer
  y -= 20;
  checkNewPage(40);

  // Draw line separator
  currentPage.drawLine({
    start: { x: margin, y: y },
    end: { x: margin + contentWidth, y: y },
    thickness: 0.5,
    color: lightGray,
  });

  y -= 20;

  // Footer text
  currentPage.drawText(t.footer, {
    x: margin,
    y: y,
    size: 8,
    font: helvetica,
    color: lightGray,
  });

  // Page number
  currentPage.drawText(`${t.page} 1`, {
    x: pageWidth / 2 - 20,
    y: 30,
    size: 9,
    font: helvetica,
    color: lightGray,
  });

  // Save and return
  return await pdfDoc.save();
}

export function downloadPDF(pdfBytes: Uint8Array, filename: string): void {
  // Convert Uint8Array to a regular ArrayBuffer for Blob compatibility
  const arrayBuffer = new ArrayBuffer(pdfBytes.length);
  const view = new Uint8Array(arrayBuffer);
  view.set(pdfBytes);
  const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Shop Report Labels
const shopReportLabels: Record<string, Record<string, string>> = {
  en: {
    title: 'Shop Summary Report',
    subtitle: 'Business Overview',
    generatedOn: 'Generated on',
    period: 'Period',
    page: 'Page',
    summary: 'Summary',
    totalOutstanding: 'Total Outstanding',
    totalCollected: 'Total Collected',
    newDebts: 'New Debts',
    paymentsReceived: 'Payments Received',
    activeCustomers: 'Active Customers',
    collectionRate: 'Collection Rate',
    debtAging: 'Debt Aging Analysis',
    current: 'Current (0-30 days)',
    days30: '31-60 days',
    days60: '61-90 days',
    days90: '91+ days',
    overdue: 'Overdue',
    customerBreakdown: 'Customer Breakdown',
    customerName: 'Customer',
    balance: 'Balance',
    lastActivity: 'Last Activity',
    footer: 'This is a computer-generated report from Ledgerly.',
    noData: 'No data available for this period',
  },
  tr: {
    title: 'Isletme Ozet Raporu',
    subtitle: 'Isletme Genel Gorunumu',
    generatedOn: 'Olusturulma tarihi',
    period: 'Donem',
    page: 'Sayfa',
    summary: 'Ozet',
    totalOutstanding: 'Toplam Alacak',
    totalCollected: 'Toplanan Toplam',
    newDebts: 'Yeni Borclar',
    paymentsReceived: 'Alinan Odemeler',
    activeCustomers: 'Aktif Musteriler',
    collectionRate: 'Tahsilat Orani',
    debtAging: 'Yaslanma Analizi',
    current: 'Gunluk (0-30 gun)',
    days30: '31-60 gun',
    days60: '61-90 gun',
    days90: '91+ gun',
    overdue: 'Gecikmis',
    customerBreakdown: 'Musteri Dagilimi',
    customerName: 'Musteri',
    balance: 'Bakiye',
    lastActivity: 'Son Islem',
    footer: 'Bu belge Veresiye-X tarafindan olusturulmustur.',
    noData: 'Bu donem icin veri bulunamadi',
  },
  es: {
    title: 'Informe Resumen de Negocio',
    subtitle: 'Vision General del Negocio',
    generatedOn: 'Generado el',
    period: 'Periodo',
    page: 'Pagina',
    summary: 'Resumen',
    totalOutstanding: 'Total Pendiente',
    totalCollected: 'Total Recaudado',
    newDebts: 'Nuevas Deudas',
    paymentsReceived: 'Pagos Recibidos',
    activeCustomers: 'Clientes Activos',
    collectionRate: 'Tasa de Cobranza',
    debtAging: 'Analisis de Antiguedad',
    current: 'Actual (0-30 dias)',
    days30: '31-60 dias',
    days60: '61-90 dias',
    days90: '91+ dias',
    overdue: 'Vencido',
    customerBreakdown: 'Desglose de Clientes',
    customerName: 'Cliente',
    balance: 'Saldo',
    lastActivity: 'Ultima Actividad',
    footer: 'Este es un informe generado por Fiado-X.',
    noData: 'Sin datos disponibles para este periodo',
  },
  id: {
    title: 'Laporan Ringkasan Toko',
    subtitle: 'Ikhtisar Bisnis',
    generatedOn: 'Dibuat pada',
    period: 'Periode',
    page: 'Halaman',
    summary: 'Ringkasan',
    totalOutstanding: 'Total Terutang',
    totalCollected: 'Total Terkumpul',
    newDebts: 'Hutang Baru',
    paymentsReceived: 'Pembayaran Diterima',
    activeCustomers: 'Pelanggan Aktif',
    collectionRate: 'Tingkat Penagihan',
    debtAging: 'Analisis Penuaan',
    current: 'Saat ini (0-30 hari)',
    days30: '31-60 hari',
    days60: '61-90 hari',
    days90: '91+ hari',
    overdue: 'Terlambat',
    customerBreakdown: 'Rincian Pelanggan',
    customerName: 'Pelanggan',
    balance: 'Saldo',
    lastActivity: 'Aktivitas Terakhir',
    footer: 'Ini adalah laporan yang dihasilkan oleh Hutang-Ku.',
    noData: 'Tidak ada data tersedia untuk periode ini',
  },
  hi: {
    title: 'दुकान सारांश रिपोर्ट',
    subtitle: 'व्यवसाय अवलोकन',
    generatedOn: 'तैयार की गई तारीख',
    period: 'अवधि',
    page: 'पृष्ठ',
    summary: 'सारांश',
    totalOutstanding: 'कुल बकाया',
    totalCollected: 'कुल एकत्रित',
    newDebts: 'नए ऋण',
    paymentsReceived: 'प्राप्त भुगतान',
    activeCustomers: 'सक्रिय ग्राहक',
    collectionRate: 'संग्रह दर',
    debtAging: 'उम्र विश्लेषण',
    current: 'वर्तमान (0-30 दिन)',
    days30: '31-60 दिन',
    days60: '61-90 दिन',
    days90: '91+ दिन',
    overdue: 'अतिदेय',
    customerBreakdown: 'ग्राहक विवरण',
    customerName: 'ग्राहक',
    balance: 'शेष',
    lastActivity: 'अंतिम गतिविधि',
    footer: 'यह Udhar-X द्वारा उत्पन्न रिपोर्ट है।',
    noData: 'इस अवधि के लिए कोई डेटा उपलब्ध नहीं है',
  },
  ar: {
    title: 'تقرير ملخص المتجر',
    subtitle: 'نظرة عامة على الأعمال',
    generatedOn: 'تم إنشاؤه في',
    period: 'الفترة',
    page: 'صفحة',
    summary: 'ملخص',
    totalOutstanding: 'المجموع المستحق',
    totalCollected: 'المجموع المحصل',
    newDebts: 'ديون جديدة',
    paymentsReceived: 'المدفوعات المستلمة',
    activeCustomers: 'العملاء النشطون',
    collectionRate: 'معدل التحصيل',
    debtAging: 'تحليل تقادم الديون',
    current: 'الحالي (0-30 يوم)',
    days30: '31-60 يوم',
    days60: '61-90 يوم',
    days90: '91+ يوم',
    overdue: 'متأخر',
    customerBreakdown: 'تفصيل العملاء',
    customerName: 'العميل',
    balance: 'الرصيد',
    lastActivity: 'آخر نشاط',
    footer: 'هذا تقرير مولد بواسطة Dayn-X.',
    noData: 'لا توجد بيانات متاحة لهذه الفترة',
  },
  zu: {
    title: 'Isibalo Esifushane Sevenkile',
    subtitle: 'Ukuhlola Ibhizinisi',
    generatedOn: 'Kwenziwe ngo',
    period: 'Isikhathi',
    page: 'Ikhasi',
    summary: 'Isifushaniso',
    totalOutstanding: 'Isamba Esisalele',
    totalCollected: 'Isamba Esiliqoqiwe',
    newDebts: 'Izikweletu Ezisha',
    paymentsReceived: 'Inkokhelo Ezamukelwe',
    activeCustomers: 'Abakhayeli Abasebenzayo',
    collectionRate: 'Inani Lokuthola',
    debtAging: 'Ukuhlazulwa Kokuguga',
    current: 'Okwamanje (0-30 izinsuku)',
    days30: '31-60 izinsuku',
    days60: '61-90 izinsuku',
    days90: '91+ izinsuku',
    overdue: 'Kuphelelwe isikhathi',
    customerBreakdown: 'Ukuhlazulwa Kabakhayeli',
    customerName: 'Ikhasimende',
    balance: 'Isisindo',
    lastActivity: 'Umsebenzi Wokugcina',
    footer: 'Lesi sibalo esenziwe ngokhompyutha ku-Mali-X.',
    noData: 'Awukho ulwazi olukhona lesi sikhathi',
  },
};

export interface ShopReportData {
  businessInfo: BusinessInfo;
  summary: {
    totalOutstanding: number;
    totalCollected: number;
    newDebts: number;
    paymentsReceived: number;
    activeCustomers: number;
    collectionRate: number;
  };
  debtAging: {
    current: number;
    days30: number;
    days60: number;
    days90: number;
    overdue: number;
  };
  customers: Array<{
    name: string;
    balance: number;
    lastActivity: string | null;
  }>;
  period: {
    start: string;
    end: string;
  };
}

export async function generateShopReportPDF(
  options: ShopReportData & { locale?: string }
): Promise<Uint8Array> {
  const { businessInfo, summary, debtAging, customers, period, locale = 'en' } = options;

  const pdfDoc = await PDFDocument.create();
  const pageWidth = 595; // A4 width in points
  const pageHeight = 842; // A4 height in points
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;

  const t = shopReportLabels[locale] || shopReportLabels.en;

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const primaryColor = rgb(0.231, 0.510, 0.965); // #3B82F6 - Global Blue
  const textColor = rgb(0.2, 0.2, 0.2);
  const lightGray = rgb(0.6, 0.6, 0.6);
  const darkGray = rgb(0.4, 0.4, 0.4);
  const redColor = rgb(0.8, 0.2, 0.2);
  const greenColor = rgb(0.2, 0.6, 0.2);

  const formatCurrencyLocal = (amount: number) => formatCurrencyForPDF(amount, businessInfo.currency);
  const formatDateLocal = (dateStr: string | null) => formatDateForPDF(dateStr, locale);

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;
  let pageNum = 1;

  const checkNewPage = (requiredSpace: number) => {
    if (y - requiredSpace < margin + 50) {
      // Add page number to current page
      currentPage.drawText(`${t.page} ${pageNum}`, {
        x: pageWidth / 2 - 20,
        y: 30,
        size: 9,
        font: helvetica,
        color: lightGray,
      });

      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
      pageNum++;
      return true;
    }
    return false;
  };

  // Header with business name
  currentPage.drawRectangle({
    x: margin,
    y: y - 40,
    width: contentWidth,
    height: 50,
    color: primaryColor,
  });

  currentPage.drawText(businessInfo.name || getBrandName(locale || 'en'), {
    x: margin + 15,
    y: y - 20,
    size: 22,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  });

  y -= 70;

  // Title
  currentPage.drawText(t.title, {
    x: margin,
    y: y,
    size: 18,
    font: helveticaBold,
    color: textColor,
  });

  y -= 25;

  // Subtitle and period
  currentPage.drawText(t.subtitle, {
    x: margin,
    y: y,
    size: 12,
    font: helvetica,
    color: darkGray,
  });

  const periodText = `${t.period}: ${formatDateLocal(period.start)} - ${formatDateLocal(period.end)}`;
  currentPage.drawText(periodText, {
    x: margin + 250,
    y: y,
    size: 10,
    font: helvetica,
    color: lightGray,
  });

  y -= 20;

  // Generated date
  const today = new Date();
  currentPage.drawText(`${t.generatedOn}: ${formatDateLocal(today.toISOString())}`, {
    x: margin,
    y: y,
    size: 9,
    font: helvetica,
    color: lightGray,
  });

  y -= 30;

  // Summary Section
  currentPage.drawText(t.summary, {
    x: margin,
    y: y,
    size: 14,
    font: helveticaBold,
    color: textColor,
  });

  y -= 15;

  // Summary cards grid (2x3)
  const cardWidth = (contentWidth - 20) / 2;
  const cardHeight = 50;
  const summaryItems = [
    { label: t.totalOutstanding, value: formatCurrencyLocal(summary.totalOutstanding), color: redColor },
    { label: t.totalCollected, value: formatCurrencyLocal(summary.totalCollected), color: greenColor },
    { label: t.newDebts, value: formatCurrencyLocal(summary.newDebts), color: redColor },
    { label: t.paymentsReceived, value: formatCurrencyLocal(summary.paymentsReceived), color: greenColor },
    { label: t.activeCustomers, value: summary.activeCustomers.toString(), color: textColor },
    { label: t.collectionRate, value: `${summary.collectionRate.toFixed(1)}%`, color: textColor },
  ];

  let cardY = y;
  for (let i = 0; i < summaryItems.length; i += 2) {
    checkNewPage(cardHeight + 20);

    // Left card
    const leftItem = summaryItems[i];
    currentPage.drawRectangle({
      x: margin,
      y: cardY - cardHeight,
      width: cardWidth,
      height: cardHeight,
      color: rgb(0.96, 0.96, 0.96),
    });
    currentPage.drawText(leftItem.label, {
      x: margin + 10,
      y: cardY - 18,
      size: 9,
      font: helvetica,
      color: darkGray,
    });
    currentPage.drawText(leftItem.value, {
      x: margin + 10,
      y: cardY - 35,
      size: 14,
      font: helveticaBold,
      color: leftItem.color,
    });

    // Right card
    if (summaryItems[i + 1]) {
      const rightItem = summaryItems[i + 1];
      currentPage.drawRectangle({
        x: margin + cardWidth + 20,
        y: cardY - cardHeight,
        width: cardWidth,
        height: cardHeight,
        color: rgb(0.96, 0.96, 0.96),
      });
      currentPage.drawText(rightItem.label, {
        x: margin + cardWidth + 30,
        y: cardY - 18,
        size: 9,
        font: helvetica,
        color: darkGray,
      });
      currentPage.drawText(rightItem.value, {
        x: margin + cardWidth + 30,
        y: cardY - 35,
        size: 14,
        font: helveticaBold,
        color: rightItem.color,
      });
    }

    cardY -= cardHeight + 10;
  }

  y = cardY - 20;

  checkNewPage(180);

  // Debt Aging Section
  currentPage.drawText(t.debtAging, {
    x: margin,
    y: y,
    size: 14,
    font: helveticaBold,
    color: textColor,
  });

  y -= 15;

  const agingItems = [
    { label: t.current, value: debtAging.current, color: textColor },
    { label: t.days30, value: debtAging.days30, color: textColor },
    { label: t.days60, value: debtAging.days60, color: rgb(0.7, 0.5, 0.1) },
    { label: t.days90, value: debtAging.days90, color: rgb(0.8, 0.4, 0.1) },
    { label: t.overdue, value: debtAging.overdue, color: redColor },
  ];

  for (const item of agingItems) {
    currentPage.drawText(item.label, {
      x: margin + 10,
      y: y - 5,
      size: 10,
      font: helvetica,
      color: darkGray,
    });
    currentPage.drawText(formatCurrencyLocal(item.value), {
      x: margin + contentWidth - 100,
      y: y - 5,
      size: 10,
      font: helveticaBold,
      color: item.color,
    });
    y -= 18;
  }

  y -= 20;

  checkNewPage(150);

  // Customer Breakdown Section
  currentPage.drawText(t.customerBreakdown, {
    x: margin,
    y: y,
    size: 14,
    font: helveticaBold,
    color: textColor,
  });

  y -= 20;

  // Table header
  const tableHeaderY = y + 5;
  currentPage.drawRectangle({
    x: margin,
    y: tableHeaderY - 20,
    width: contentWidth,
    height: 20,
    color: rgb(0.93, 0.93, 0.93),
  });

  currentPage.drawText(t.customerName, {
    x: margin + 10,
    y: tableHeaderY - 13,
    size: 9,
    font: helveticaBold,
    color: darkGray,
  });
  currentPage.drawText(t.balance, {
    x: margin + 250,
    y: tableHeaderY - 13,
    size: 9,
    font: helveticaBold,
    color: darkGray,
  });
  currentPage.drawText(t.lastActivity, {
    x: margin + 370,
    y: tableHeaderY - 13,
    size: 9,
    font: helveticaBold,
    color: darkGray,
  });

  y -= 25;

  // Customer rows
  if (customers.length === 0) {
    currentPage.drawText(t.noData, {
      x: margin + 10,
      y: y - 5,
      size: 10,
      font: helvetica,
      color: lightGray,
    });
    y -= 20;
  } else {
    const rowHeight = 18;
    for (let i = 0; i < Math.min(customers.length, 15); i++) {
      checkNewPage(rowHeight + 5);

      const customer = customers[i];

      // Alternate row background
      if (i % 2 === 0) {
        currentPage.drawRectangle({
          x: margin,
          y: y - rowHeight + 5,
          width: contentWidth,
          height: rowHeight,
          color: rgb(0.98, 0.98, 0.98),
        });
      }

      // Customer name (truncate if needed)
      let nameText = customer.name;
      while (helvetica.widthOfTextAtSize(nameText, 9) > 200 && nameText.length > 5) {
        nameText = nameText.slice(0, -4) + '...';
      }
      currentPage.drawText(nameText, {
        x: margin + 10,
        y: y - 3,
        size: 9,
        font: helvetica,
        color: textColor,
      });

      // Balance
      const balanceColor = customer.balance > 0 ? redColor : greenColor;
      currentPage.drawText(formatCurrencyLocal(Math.abs(customer.balance)), {
        x: margin + 250,
        y: y - 3,
        size: 9,
        font: helveticaBold,
        color: balanceColor,
      });

      // Last activity
      const lastActivity = customer.lastActivity ? formatDateLocal(customer.lastActivity) : '-';
      currentPage.drawText(lastActivity, {
        x: margin + 370,
        y: y - 3,
        size: 9,
        font: helvetica,
        color: darkGray,
      });

      y -= rowHeight;
    }

    if (customers.length > 15) {
      y -= 10;
      currentPage.drawText(`... and ${customers.length - 15} more customers`, {
        x: margin + 10,
        y: y - 3,
        size: 9,
        font: helvetica,
        color: lightGray,
      });
    }
  }

  // Footer
  y -= 30;
  checkNewPage(40);

  currentPage.drawLine({
    start: { x: margin, y: y },
    end: { x: margin + contentWidth, y: y },
    thickness: 0.5,
    color: lightGray,
  });

  y -= 20;

  currentPage.drawText(t.footer, {
    x: margin,
    y: y,
    size: 8,
    font: helvetica,
    color: lightGray,
  });

  // Final page number
  currentPage.drawText(`${t.page} ${pageNum}`, {
    x: pageWidth / 2 - 20,
    y: 30,
    size: 9,
    font: helvetica,
    color: lightGray,
  });

  return await pdfDoc.save();
}
