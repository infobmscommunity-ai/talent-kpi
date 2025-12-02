
import React, { useState, useRef, useEffect } from 'react';
import { Download, Printer, Copy, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { exportToCSV, printData, copyToClipboard } from '../services/exportService';

interface ExportMenuProps {
  data: any[];
  filename: string;
  label?: string;
}

const ExportMenu: React.FC<ExportMenuProps> = ({ data, filename, label = "Export" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportCSV = () => {
    exportToCSV(data, filename);
    setIsOpen(false);
  };

  const handlePrint = () => {
    printData(data, filename.replace(/-/g, ' ').toUpperCase());
    setIsOpen(false);
  };

  const handleCopy = () => {
    copyToClipboard(data);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-slate-800 text-slate-200 border border-slate-700 px-4 py-2 rounded-lg hover:bg-slate-700 hover:border-amber-500/50 transition-all shadow-sm text-sm font-medium"
      >
        <Download size={16} className="text-amber-500" />
        <span>{label}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 py-1 animate-in fade-in slide-in-from-top-2">
          <button
            onClick={handleExportCSV}
            className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-amber-500 flex items-center gap-2 transition-colors"
          >
            <FileSpreadsheet size={16} />
            <span>Unduh CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-amber-500 flex items-center gap-2 transition-colors"
          >
            <Printer size={16} />
            <span>Cetak / PDF</span>
          </button>
          <button
            onClick={handleCopy}
            className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-amber-500 flex items-center gap-2 transition-colors"
          >
            <Copy size={16} />
            <span>Salin Clipboard</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportMenu;
