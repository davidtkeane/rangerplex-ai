
import React from 'react';
import { downloadFile } from '../services/trainingService';

interface SmartTableProps {
    headers: string[];
    rows: string[][];
    isTron?: boolean;
}

const SmartTable: React.FC<SmartTableProps> = ({ headers, rows, isTron }) => {
    const handleExportCSV = () => {
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
        downloadFile(csvContent, 'data_export.csv', 'text/csv');
    };

    const borderColor = isTron ? 'border-tron-cyan/30' : 'border-gray-200 dark:border-zinc-700';
    const headerBg = isTron ? 'bg-tron-cyan/10' : 'bg-gray-100 dark:bg-zinc-800';
    const textCol = isTron ? 'text-tron-cyan' : 'text-gray-800 dark:text-zinc-200';

    return (
        <div className={`my-6 overflow-hidden rounded-xl border ${borderColor} bg-black/20`}>
            <div className="flex justify-between items-center px-4 py-2 bg-opacity-50 bg-black border-b border-inherit">
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-50">
                    <i className="fa-solid fa-table mr-2"></i> Data Grid
                </div>
                <button onClick={handleExportCSV} className="text-[10px] font-bold uppercase hover:text-teal-500 transition-colors">
                    <i className="fa-solid fa-download mr-1"></i> CSV
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className={`text-xs uppercase font-bold ${headerBg} ${textCol}`}>
                        <tr>
                            {headers.map((h, i) => (
                                <th key={i} className="px-6 py-3 whitespace-nowrap">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${borderColor}`}>
                        {rows.map((row, i) => (
                            <tr key={i} className="hover:bg-white/5 transition-colors">
                                {row.map((cell, j) => (
                                    <td key={j} className={`px-6 py-3 whitespace-pre-wrap ${textCol} opacity-90`}>{cell}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SmartTable;
