import type { ScrapedPage } from "@shared/schema";

export async function exportToExcel(pages: ScrapedPage[]): Promise<void> {
  const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs');

  const worksheetData = [
    ['Page Title', 'URL', 'Content Preview', 'Scraped At'],
    ...pages.map(page => [
      page.title,
      page.url,
      page.content.substring(0, 200),
      new Date(page.scrapedAt).toLocaleString(),
    ]),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  worksheet['!cols'] = [
    { wch: 40 },
    { wch: 60 },
    { wch: 50 },
    { wch: 20 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'E-Invoicing Pages');

  const timestamp = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `e-invoicing-pages-${timestamp}.xlsx`);
}
