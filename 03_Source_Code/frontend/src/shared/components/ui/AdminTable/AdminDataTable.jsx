import React, { useEffect, useMemo, useState } from 'react';

export default function AdminDataTable({ columns, data, loading, emptyMessage = "Tidak ada data ditemukan.", pageSize = null }) {
  const [currentPage, setCurrentPage] = useState(1);

  const shouldPaginate = Number.isInteger(pageSize) && pageSize > 0;

  const totalPages = shouldPaginate ? Math.max(1, Math.ceil(data.length / pageSize)) : 1;

  const paginatedData = useMemo(() => {
    if (!shouldPaginate) {
      return data;
    }

    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * pageSize;
    return data.slice(startIndex, startIndex + pageSize);
  }, [currentPage, data, pageSize, shouldPaginate, totalPages]);

  const startItem = shouldPaginate && data.length > 0 ? ((Math.min(currentPage, totalPages) - 1) * pageSize) + 1 : 0;
  const endItem = shouldPaginate ? Math.min(Math.min(currentPage, totalPages) * pageSize, data.length) : data.length;

  useEffect(() => {
    if (!shouldPaginate) {
      setCurrentPage(1);
      return;
    }

    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, shouldPaginate, totalPages]);

  return (
    <div className="bg-white shadow-ambient rounded-card overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {columns.map((col, index) => (
                <th key={index} className={`py-4 px-6 font-semibold text-sm text-primary-container whitespace-nowrap ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-10 text-center text-slate-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto"></div>
                  <p className="mt-3 text-sm">Memuat data...</p>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-10 text-center text-slate-500">
                  <p className="text-sm">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-slate-50/50 transition-colors">
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className={`py-4 px-6 ${col.cellClassName || ''}`}>
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {!loading && data.length > 0 && shouldPaginate && (
        <div className="flex items-center justify-between p-4 px-6 border-t border-slate-100 bg-white">
          <span className="text-sm text-slate-500">
            Menampilkan {startItem}-{endItem} dari {data.length} data
          </span>
          <div className="flex gap-1">
            <button
              className="px-3 py-1 border border-slate-200 rounded text-sm text-slate-400 opacity-50 cursor-not-allowed disabled:opacity-50"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              Sebelumnnya
            </button>
            <button className="px-3 py-1 border border-accent bg-cyan-50 rounded text-sm text-cyan-700 font-medium">
              {Math.min(currentPage, totalPages)} / {totalPages}
            </button>
            <button
              className="px-3 py-1 border border-slate-200 rounded text-sm text-slate-500 hover:bg-slate-50 disabled:opacity-50"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
