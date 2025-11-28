"use client";

import React, { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";

type ParsedSheet = {
  name: string;
  headers: string[];
  rows: (string | number | null)[][];
};

type SortDirection = "asc" | "desc" | null;

export default function HomePage() {
  const [sheets, setSheets] = useState<ParsedSheet[]>([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumnIndex, setSortColumnIndex] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [columnVisibility, setColumnVisibility] = useState<boolean[]>([]);

  const activeSheet = sheets[activeSheetIndex];

  // When sheet changes, reset column visibility
  useEffect(() => {
    if (activeSheet) {
      setColumnVisibility(new Array(activeSheet.headers.length).fill(true));
    } else {
      setColumnVisibility([]);
    }
    setSearchQuery("");
    setSortColumnIndex(null);
    setSortDirection(null);
  }, [activeSheetIndex, sheets.length]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setError(null);

    if (!file) return;

    if (
      !file.name.endsWith(".xlsx") &&
      !file.name.endsWith(".xls") &&
      !file.name.endsWith(".csv")
    ) {
      setError("Please upload an Excel (.xlsx / .xls) or CSV file.");
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        if (!data) {
          throw new Error("Unable to read file.");
        }

        const workbook = XLSX.read(data, { type: "binary" });
        const parsedSheets: ParsedSheet[] = workbook.SheetNames.map(
          (sheetName) => {
            const worksheet = workbook.Sheets[sheetName];
            const sheetData: any[][] = XLSX.utils.sheet_to_json(worksheet, {
              header: 1,
              blankrows: false
            });

            const headers = (sheetData[0] || []).map((h) =>
              String(h ?? "").trim()
            );
            const rows = sheetData.slice(1).map((row) =>
              headers.map((_, index) => row[index] ?? null)
            );

            return {
              name: sheetName,
              headers,
              rows
            };
          }
        );

        setSheets(parsedSheets);
        setActiveSheetIndex(0);
      } catch (err: any) {
        console.error(err);
        setError("Failed to parse file. Please check the file format.");
      }
    };

    reader.readAsBinaryString(file);
  }

  const totalRows = activeSheet?.rows.length ?? 0;
  const totalColumns = activeSheet?.headers.length ?? 0;

  // Derived: filtered + sorted rows
  const processedRows = useMemo(() => {
    if (!activeSheet) return [];

    let rows = [...activeSheet.rows];

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter((row) =>
        row.some((cell) =>
          (cell ?? "")
            .toString()
            .toLowerCase()
            .includes(q)
        )
      );
    }

    // Sort
    if (sortColumnIndex !== null && sortDirection) {
      rows.sort((a, b) => {
        const aVal = a[sortColumnIndex];
        const bVal = b[sortColumnIndex];

        // Handle null/undefined
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return sortDirection === "asc" ? -1 : 1;
        if (bVal == null) return sortDirection === "asc" ? 1 : -1;

        // Try numeric sort first
        const aNum = Number(aVal);
        const bNum = Number(bVal);
        const bothNumeric = !Number.isNaN(aNum) && !Number.isNaN(bNum);

        if (bothNumeric) {
          return sortDirection === "asc" ? aNum - bNum : bNum - aNum;
        }

        const aStr = aVal.toString().toLowerCase();
        const bStr = bVal.toString().toLowerCase();
        if (aStr === bStr) return 0;
        if (sortDirection === "asc") {
          return aStr < bStr ? -1 : 1;
        } else {
          return aStr > bStr ? -1 : 1;
        }
      });
    }

    return rows;
  }, [activeSheet, searchQuery, sortColumnIndex, sortDirection]);

  const visibleHeaders = useMemo(() => {
    if (!activeSheet) return [];
    return activeSheet.headers.filter((_, i) => columnVisibility[i]);
  }, [activeSheet, columnVisibility]);

  const visibleRowCount = processedRows.length;
  const rowsToDisplay = processedRows.slice(0, 200); // cap for performance

  function toggleSort(index: number) {
    if (sortColumnIndex === index) {
      // cycle: asc -> desc -> none
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortColumnIndex(null);
        setSortDirection(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortColumnIndex(index);
      setSortDirection("asc");
    }
  }

  function toggleColumn(index: number) {
    setColumnVisibility((prev) => {
      if (!prev.length) {
        return columnVisibility;
      }
      const copy = [...prev];
      copy[index] = !copy[index];
      return copy;
    });
  }

  return (
    <main className="h-screen w-screen overflow-hidden flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-6 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-emerald-400 text-slate-950 text-xl">
            ✨
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              Excel Visualizer
            </h1>
            <p className="text-xs text-slate-400">
              Upload, explore, and interact with your spreadsheet visually.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {fileName && (
            <div className="hidden sm:flex flex-col text-right text-xs">
              <span className="text-slate-300 truncate max-w-xs">
                {fileName}
              </span>
              {activeSheet && (
                <span className="text-slate-500">
                  {sheets.length} sheet
                  {sheets.length !== 1 ? "s" : ""} ·{" "}
                  <span className="text-sky-300">{activeSheet.name}</span>
                </span>
              )}
            </div>
          )}
          <label className="relative inline-flex cursor-pointer items-center justify-center rounded-xl border border-sky-400/60 bg-sky-500/20 px-4 py-1.5 text-xs font-medium text-sky-50 shadow-sm shadow-sky-900/60 hover:bg-sky-500/30 transition">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <span>Upload Excel</span>
          </label>
        </div>
      </header>

      {/* Main content area: sidebar + table */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <aside className="w-72 border-r border-slate-800/80 bg-slate-950/70 backdrop-blur-xl px-4 py-4 flex flex-col gap-4">
          {/* Sheets */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                Sheets
              </h2>
              <span className="text-[10px] text-slate-500">
                {sheets.length || 0}
              </span>
            </div>
            <div className="space-y-1 max-h-40 overflow-auto custom-scroll">
              {sheets.length === 0 && (
                <p className="text-xs text-slate-500">
                  No sheets yet. Upload a file to begin.
                </p>
              )}
              {sheets.map((sheet, index) => (
                <button
                  key={sheet.name}
                  onClick={() => setActiveSheetIndex(index)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-xs transition ${
                    index === activeSheetIndex
                      ? "bg-sky-500/20 text-sky-100 border border-sky-500/60"
                      : "bg-slate-900/60 text-slate-200 hover:bg-slate-800/80"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate">{sheet.name}</span>
                    <span className="text-[10px] text-slate-400">
                      {sheet.rows.length}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Quick stats */}
          <section className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-emerald-500/20 bg-slate-900/70 p-3 text-xs">
              <p className="text-[10px] uppercase tracking-wide text-emerald-300/80">
                Rows
              </p>
              <p className="mt-1 text-lg font-semibold">
                {activeSheet ? totalRows : "—"}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Total records
              </p>
            </div>
            <div className="rounded-2xl border border-cyan-500/20 bg-slate-900/70 p-3 text-xs">
              <p className="text-[10px] uppercase tracking-wide text-cyan-300/80">
                Columns
              </p>
              <p className="mt-1 text-lg font-semibold">
                {activeSheet ? totalColumns : "—"}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Detected fields
              </p>
            </div>
          </section>

          {/* Search */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-300 mb-2">
              Search
            </p>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search across all columns"
                className="w-full rounded-xl bg-slate-900/80 border border-slate-700/80 px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400"
              />
              <span className="pointer-events-none absolute right-2 top-1.5 text-xs text-slate-500">
                ⌕
              </span>
            </div>
            {activeSheet && (
              <p className="mt-1 text-[10px] text-slate-500">
                Showing {visibleRowCount} row
                {visibleRowCount !== 1 ? "s" : ""} after filters.
              </p>
            )}
          </section>

          {/* Columns visibility */}
          <section className="flex-1 min-h-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-300 mb-2 flex items-center justify-between">
              Columns
              {activeSheet && (
                <button
                  type="button"
                  onClick={() =>
                    setColumnVisibility(
                      new Array(activeSheet.headers.length).fill(true)
                    )
                  }
                  className="text-[10px] text-sky-300 hover:text-sky-200"
                >
                  Show all
                </button>
              )}
            </p>
            <div className="max-h-40 overflow-auto custom-scroll space-y-1">
              {!activeSheet && (
                <p className="text-xs text-slate-500">
                  Load a sheet to manage columns.
                </p>
              )}
              {activeSheet &&
                activeSheet.headers.map((header, index) => (
                  <label
                    key={index}
                    className="flex items-center gap-2 rounded-lg bg-slate-900/70 px-2 py-1 text-[11px] text-slate-100"
                  >
                    <input
                      type="checkbox"
                      className="h-3 w-3 rounded border-slate-500 bg-slate-900"
                      checked={columnVisibility[index] ?? true}
                      onChange={() => toggleColumn(index)}
                    />
                    <span className="truncate">
                      {header || `Column ${index + 1}`}
                    </span>
                  </label>
                ))}
            </div>
          </section>

          {/* Info / error */}
          {error && (
            <div className="rounded-xl border border-rose-500/60 bg-rose-900/20 px-3 py-2 text-[11px] text-rose-100">
              {error}
            </div>
          )}
          {!error && !activeSheet && (
            <div className="rounded-xl border border-slate-700/70 bg-slate-900/60 px-3 py-2 text-[11px] text-slate-300">
              Start by uploading an Excel file from the top-right. All parsing
              happens in your browser.
            </div>
          )}
        </aside>

        {/* Main table area */}
        <section className="flex-1 flex flex-col bg-slate-950/60 backdrop-blur-xl">
          {!activeSheet ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center px-6">
              <div className="text-6xl">📊</div>
              <p className="text-sm text-slate-200">
                Upload an Excel file to see an interactive preview.
              </p>
              <p className="text-xs text-slate-400 max-w-md">
                The viewer auto-detects sheets and headers, lets you search,
                sort, and hide columns, and can handle up to a few thousand rows
                comfortably in your browser.
              </p>
            </div>
          ) : (
            <>
              {/* Table meta bar */}
              <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-2 text-[11px] text-slate-300">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-200">
                    {activeSheet.name}
                  </span>
                  <span>
                    {totalRows} row{totalRows !== 1 ? "s" : ""},{" "}
                    {totalColumns} column{totalColumns !== 1 ? "s" : ""}
                  </span>
                  <span className="text-slate-500">
                    Showing first {rowsToDisplay.length} row
                    {rowsToDisplay.length !== 1 ? "s" : ""}.
                  </span>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-slate-400">
                  {sortColumnIndex !== null && sortDirection && (
                    <span>
                      Sorted by{" "}
                      <span className="text-sky-300">
                        {activeSheet.headers[sortColumnIndex] ||
                          `Column ${sortColumnIndex + 1}`}
                      </span>{" "}
                      ({sortDirection === "asc" ? "A → Z" : "Z → A"})
                    </span>
                  )}
                </div>
              </div>

              {/* Table */}
              <div className="flex-1 overflow-auto">
                <table className="min-w-full border-collapse text-xs">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-slate-900/95 backdrop-blur-md">
                      {activeSheet.headers.map((header, index) => {
                        if (!columnVisibility[index]) return null;

                        const isSorted = sortColumnIndex === index;

                        return (
                          <th
                            key={index}
                            onClick={() => toggleSort(index)}
                            className="border-b border-slate-800/80 px-3 py-2 text-left font-semibold uppercase tracking-wide text-[10px] text-slate-200 cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-1">
                              <span>
                                {header || (
                                  <span className="italic text-slate-500">
                                    Column {index + 1}
                                  </span>
                                )}
                              </span>
                              <span className="text-[9px] text-slate-400">
                                {isSorted && sortDirection === "asc" && "▲"}
                                {isSorted && sortDirection === "desc" && "▼"}
                                {!isSorted && "⇵"}
                              </span>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {rowsToDisplay.map((row, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className={
                          rowIndex % 2 === 0
                            ? "bg-slate-900/40"
                            : "bg-slate-900/10"
                        }
                      >
                        {row.map((cell, cellIndex) => {
                          if (!columnVisibility[cellIndex]) return null;
                          return (
                            <td
                              key={cellIndex}
                              className="border-b border-slate-800/60 px-3 py-1.5 text-[11px] text-slate-100"
                            >
                              {cell === null ||
                              cell === undefined ||
                              cell === ""
                                ? "—"
                                : typeof cell === "number"
                                ? cell.toLocaleString()
                                : String(cell)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}

                    {rowsToDisplay.length === 0 && (
                      <tr>
                        <td
                          colSpan={visibleHeaders.length || 1}
                          className="px-3 py-4 text-center text-xs text-slate-400"
                        >
                          No rows match the current filters/search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
