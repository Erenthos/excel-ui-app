"use client";

import React, { useState } from "react";
import * as XLSX from "xlsx";

type ParsedSheet = {
  name: string;
  headers: string[];
  rows: (string | number | null)[][];
};

export default function HomePage() {
  const [sheets, setSheets] = useState<ParsedSheet[]>([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeSheet = sheets[activeSheetIndex];

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

  return (
    <main className="w-full max-w-6xl">
      <div className="mb-6 text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight">
          Excel <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-300">Visualizer</span>
        </h1>
        <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
          Upload an Excel file and instantly explore it in a glassy, animated
          interface. No backend. No friction.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)]">
        {/* Left side: uploader + stats */}
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-3xl border border-sky-500/30 bg-slate-900/60 p-5 shadow-xl shadow-sky-900/40 backdrop-blur-lg">
            <div className="pointer-events-none absolute inset-0 opacity-60">
              <div className="absolute -top-20 -right-24 h-48 w-48 rounded-full bg-sky-500/20 blur-3xl" />
              <div className="absolute -bottom-16 -left-20 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />
            </div>

            <div className="relative space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky-500/20 text-sky-300 text-sm">
                  1
                </span>
                Upload Excel
              </h2>

              <label className="group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-sky-400/40 bg-slate-900/70 px-4 py-6 text-center transition hover:border-sky-300 hover:bg-slate-900/90">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="text-4xl">📂</div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    <span className="text-sky-200 group-hover:text-sky-100">
                      Click to browse
                    </span>{" "}
                    or drop a file here
                  </p>
                  <p className="text-xs text-slate-400">
                    Supports .xlsx, .xls, .csv
                  </p>
                </div>
              </label>

              {fileName && (
                <div className="rounded-2xl border border-slate-700/80 bg-slate-900/80 px-4 py-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-200">
                      {fileName}
                    </span>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                      Loaded
                    </span>
                  </div>
                  {activeSheet && (
                    <p className="mt-1 text-slate-400">
                      {sheets.length} sheet
                      {sheets.length !== 1 ? "s" : ""} detected · Showing{" "}
                      <span className="text-sky-300">{activeSheet.name}</span>
                    </p>
                  )}
                </div>
              )}

              {error && (
                <div className="rounded-2xl border border-rose-500/50 bg-rose-900/20 px-4 py-3 text-xs text-rose-100">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-3xl border border-emerald-500/20 bg-slate-900/60 p-4 backdrop-blur-md">
              <p className="text-[11px] uppercase tracking-wide text-emerald-300/80">
                Rows
              </p>
              <p className="mt-1 text-2xl font-semibold">
                {activeSheet ? totalRows : "—"}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                {activeSheet ? "Detected records" : "Upload a file to see stats"}
              </p>
            </div>
            <div className="rounded-3xl border border-cyan-500/20 bg-slate-900/60 p-4 backdrop-blur-md">
              <p className="text-[11px] uppercase tracking-wide text-cyan-300/80">
                Columns
              </p>
              <p className="mt-1 text-2xl font-semibold">
                {activeSheet ? totalColumns : "—"}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                {activeSheet
                  ? "Detected fields"
                  : "Headers are auto-detected from row 1"}
              </p>
            </div>
          </div>
        </div>

        {/* Right side: sheet selector + table */}
        <div className="relative overflow-hidden rounded-3xl border border-sky-500/30 bg-slate-950/70 shadow-2xl shadow-sky-950/60 backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 opacity-50">
            <div className="absolute -top-24 left-10 h-40 w-40 rounded-full bg-sky-500/20 blur-3xl" />
            <div className="absolute bottom-[-60px] right-[-40px] h-44 w-44 rounded-full bg-indigo-500/20 blur-3xl" />
          </div>

          <div className="relative flex flex-col h-[480px]">
            <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-100">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/25 text-xs text-sky-100">
                  2
                </span>
                Preview & Explore
              </div>
              {sheets.length > 0 && (
                <div className="flex gap-2 overflow-x-auto max-w-xs">
                  {sheets.map((sheet, index) => (
                    <button
                      key={sheet.name}
                      onClick={() => setActiveSheetIndex(index)}
                      className={`whitespace-nowrap rounded-full px-3 py-1 text-xs transition ${
                        index === activeSheetIndex
                          ? "bg-sky-500 text-slate-950 shadow-sm shadow-sky-700"
                          : "bg-slate-900/80 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      {sheet.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!activeSheet ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                <div className="text-5xl">✨</div>
                <p className="text-sm text-slate-200">
                  No data loaded yet.
                </p>
                <p className="text-xs text-slate-400 max-w-xs">
                  Upload an Excel file on the left to see a live, interactive
                  preview of your data here.
                </p>
              </div>
            ) : (
              <div className="flex flex-1 flex-col">
                {/* Meta bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 px-4 py-2 text-[11px] text-slate-300">
                  <div>
                    <span className="font-semibold text-sky-200">
                      {activeSheet.name}
                    </span>{" "}
                    · {totalRows} row{totalRows !== 1 ? "s" : ""},{" "}
                    {totalColumns} column{totalColumns !== 1 ? "s" : ""}
                  </div>
                  <div className="text-slate-400">
                    Showing first{" "}
                    <span className="text-sky-300">
                      {Math.min(totalRows, 50)}
                    </span>{" "}
                    rows for performance
                  </div>
                </div>

                {/* Table area */}
                <div className="relative flex-1 overflow-auto">
                  <table className="min-w-full border-collapse text-xs">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-slate-900/95 backdrop-blur-md">
                        {activeSheet.headers.map((header, index) => (
                          <th
                            key={index}
                            className="border-b border-slate-800/80 px-3 py-2 text-left font-semibold uppercase tracking-wide text-[10px] text-slate-300"
                          >
                            {header || <span className="italic text-slate-500">Column {index + 1}</span>}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {activeSheet.rows.slice(0, 50).map((row, rowIndex) => (
                        <tr
                          key={rowIndex}
                          className={
                            rowIndex % 2 === 0
                              ? "bg-slate-900/40"
                              : "bg-slate-900/10"
                          }
                        >
                          {row.map((cell, cellIndex) => (
                            <td
                              key={cellIndex}
                              className="border-b border-slate-800/60 px-3 py-1.5 text-[11px] text-slate-100"
                            >
                              {cell === null || cell === undefined || cell === ""
                                ? "—"
                                : typeof cell === "number"
                                ? cell.toLocaleString()
                                : String(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}

                      {totalRows === 0 && (
                        <tr>
                          <td
                            colSpan={totalColumns || 1}
                            className="px-3 py-4 text-center text-xs text-slate-400"
                          >
                            This sheet is empty.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

