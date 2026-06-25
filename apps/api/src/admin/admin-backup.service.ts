export type BackupTypeInput = "FULL" | "RELATIONAL";

/** Build pg_dump CLI args. Pure — unit tested. */
export function buildPgDumpArgs(type: BackupTypeInput, databaseUrl: string): string[] {
  const args = [
    "--format=custom",
    "--no-owner",
    "--no-privileges",
    `--dbname=${databaseUrl}`,
  ];
  if (type === "RELATIONAL") {
    // Exclude DATA of vector tables (schema is still dumped so restores into a complete schema).
    args.push("--exclude-table-data=*_chunks", "--exclude-table-data=*_vectors");
  }
  return args;
}
