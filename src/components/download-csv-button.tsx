import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { downloadCsv, toCsv } from "@/lib/csv";

export function datedCsvFilename(slug: string) {
  return `lessons-${slug}-${new Date().toISOString().slice(0, 10)}.csv`;
}

export function DownloadCsvButton({
  slug,
  headers,
  rows,
  disabled,
}: {
  slug: string;
  headers: string[];
  rows: (string | number | null)[][];
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      disabled={disabled || rows.length === 0}
      onClick={() => downloadCsv(datedCsvFilename(slug), toCsv(headers, rows))}
    >
      <Download className="size-4" strokeWidth={1.75} />
      Download CSV
    </Button>
  );
}