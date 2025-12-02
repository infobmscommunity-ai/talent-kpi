
export const exportToCSV = <T extends object>(data: T[], filename: string) => {
  if (!data || data.length === 0) {
    alert("Tidak ada data untuk diexport");
    return;
  }

  // Get headers from first object keys
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const cell = (row as any)[header] === null || (row as any)[header] === undefined ? '' : (row as any)[header];
      // Handle strings with commas or quotes
      const stringCell = String(cell);
      return `"${stringCell.replace(/"/g, '""')}"`;
    }).join(','))
  ].join('\n');

  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const copyToClipboard = <T extends object>(data: T[]) => {
  if (!data || data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const tsvContent = [
    headers.join('\t'),
    ...data.map(row => headers.map(header => (row as any)[header]).join('\t'))
  ].join('\n');

  navigator.clipboard.writeText(tsvContent).then(() => {
    alert("Data berhasil disalin ke clipboard!");
  }).catch(err => {
    console.error('Failed to copy: ', err);
  });
};

export const printData = <T extends object>(data: T[], title: string) => {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  
  const printWindow = window.open('', '', 'height=600,width=800');
  if (!printWindow) return;

  printWindow.document.write('<html><head><title>' + title + '</title>');
  printWindow.document.write(`
    <style>
      body { font-family: sans-serif; padding: 20px; }
      h1 { text-align: center; color: #333; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background-color: #f2f2f2; color: #333; }
      tr:nth-child(even) { background-color: #f9f9f9; }
    </style>
  `);
  printWindow.document.write('</head><body>');
  printWindow.document.write(`<h1>${title}</h1>`);
  printWindow.document.write('<table><thead><tr>');
  headers.forEach(h => printWindow.document.write(`<th>${h}</th>`));
  printWindow.document.write('</tr></thead><tbody>');
  
  data.forEach(row => {
    printWindow.document.write('<tr>');
    headers.forEach(h => {
        const val = (row as any)[h];
        printWindow.document.write(`<td>${val !== undefined && val !== null ? val : ''}</td>`);
    });
    printWindow.document.write('</tr>');
  });

  printWindow.document.write('</tbody></table>');
  printWindow.document.write('</body></html>');
  printWindow.document.close();
  printWindow.print();
};
