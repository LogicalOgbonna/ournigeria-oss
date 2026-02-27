"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { S3Browser } from "@/components/ingestion/s3-browser";
import { NewRunForm } from "@/components/ingestion/new-run-form";

export default function NewRunPage() {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">New Ingestion Run</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Select files from S3 and configure the pipeline
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">S3 File Browser</CardTitle>
          </CardHeader>
          <CardContent>
            <S3Browser
              selectedFiles={selectedFiles}
              onSelectionChange={setSelectedFiles}
            />
          </CardContent>
        </Card>

        <NewRunForm
          selectedFiles={selectedFiles}
          onRemoveFile={(key) =>
            setSelectedFiles((f) => f.filter((k) => k !== key))
          }
        />
      </div>
    </div>
  );
}
