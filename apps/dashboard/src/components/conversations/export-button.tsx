"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, FileJson } from "lucide-react";

interface ExportableMessage {
  role: string;
  content: string;
  createdAt: string;
}

export function ExportButton({
  conversationId,
  title,
  messages,
}: {
  conversationId: string;
  title: string;
  messages: ExportableMessage[];
}) {
  function downloadFile(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportCSV() {
    const header = "Role,Content,Timestamp\n";
    const rows = messages
      .map(
        (m) =>
          `"${m.role}","${m.content.replace(/"/g, '""')}","${m.createdAt}"`,
      )
      .join("\n");
    downloadFile(header + rows, `conversation-${conversationId}.csv`, "text/csv");
  }

  function exportJSON() {
    const data = { id: conversationId, title, messages };
    downloadFile(
      JSON.stringify(data, null, 2),
      `conversation-${conversationId}.json`,
      "application/json",
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportCSV}>
          <FileText className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportJSON}>
          <FileJson className="h-4 w-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
