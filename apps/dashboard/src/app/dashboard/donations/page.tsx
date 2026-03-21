"use client";

import { useEffect, useState, useCallback } from "react";
import { adminFetch } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Hash,
  CreditCard,
  Wallet,
} from "lucide-react";

const PAGE_SIZE = 20;

interface Donation {
  id: string;
  reference: string;
  amount: number;
  email: string;
  donorName: string | null;
  provider: "PAYSTACK" | "FLUTTERWAVE";
  status: "PENDING" | "COMPLETED" | "FAILED";
  createdAt: string;
}

interface DonationStats {
  totalRaised: number;
  totalCount: number;
  paystackCount: number;
  paystackAmount: number;
  flutterwaveCount: number;
  flutterwaveAmount: number;
}

interface DonationsResponse {
  data: Donation[];
  total: number;
  page: number;
  limit: number;
}

function formatKobo(kobo: number): string {
  return new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(kobo / 100);
}

function StatusBadge({ status }: { status: Donation["status"] }) {
  const styles: Record<Donation["status"], string> = {
    COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    FAILED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };
  return (
    <Badge variant="outline" className={styles[status]}>
      {status}
    </Badge>
  );
}

function ProviderBadge({ provider }: { provider: Donation["provider"] }) {
  const styles: Record<Donation["provider"], string> = {
    PAYSTACK: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    FLUTTERWAVE: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  };
  return (
    <Badge variant="outline" className={styles[provider]}>
      {provider}
    </Badge>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  isCurrency = false,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  isCurrency?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground truncate">{label}</p>
          <p
            className={`text-xl font-semibold truncate ${
              isCurrency ? "font-mono" : ""
            }`}
          >
            {isCurrency ? `\u20A6${value}` : value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-10 rounded-lg" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-14 rounded-lg" />
      ))}
    </div>
  );
}

export default function DonationsPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [stats, setStats] = useState<DonationStats | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Filters
  const [status, setStatus] = useState<string>("ALL");
  const [provider, setProvider] = useState<string>("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await adminFetch("/donations/stats");
      setStats(res);
    } catch {
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchDonations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (status !== "ALL") params.set("status", status);
      if (provider !== "ALL") params.set("provider", provider);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res: DonationsResponse = await adminFetch(
        `/donations?${params}`
      );
      setDonations(res.data ?? []);
      setTotal(res.total ?? 0);
    } catch {
      setDonations([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, status, provider, startDate, endDate]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [status, provider, startDate, endDate]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold">Donations</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track and manage platform donations ({total.toLocaleString()} total)
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-0">
                <Skeleton className="h-16 rounded-lg" />
              </CardContent>
            </Card>
          ))
        ) : stats ? (
          <>
            <StatCard
              label="Total Raised"
              value={formatKobo(stats.totalRaised ?? 0)}
              icon={DollarSign}
              isCurrency
            />
            <StatCard
              label="Total Donations"
              value={(stats.totalCount ?? 0).toLocaleString()}
              icon={Hash}
            />
            <StatCard
              label="Paystack"
              value={`${(stats.paystackCount ?? 0).toLocaleString()} / \u20A6${formatKobo(stats.paystackAmount ?? 0)}`}
              icon={CreditCard}
            />
            <StatCard
              label="Flutterwave"
              value={`${(stats.flutterwaveCount ?? 0).toLocaleString()} / \u20A6${formatKobo(stats.flutterwaveAmount ?? 0)}`}
              icon={Wallet}
            />
          </>
        ) : (
          <p className="text-sm text-muted-foreground col-span-full">
            Failed to load stats.
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Status
          </label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Provider
          </label>
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="PAYSTACK">Paystack</SelectItem>
              <SelectItem value="FLUTTERWAVE">Flutterwave</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Start Date
          </label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-[160px]"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            End Date
          </label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-[160px]"
          />
        </div>
      </div>

      {/* Donations Table */}
      {loading ? (
        <TableSkeleton />
      ) : donations.length === 0 ? (
        <div className="flex items-center justify-center rounded-lg border border-dashed py-12">
          <p className="text-sm text-muted-foreground">No donations yet.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Donor Name</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {donations.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-mono text-xs">
                  {d.reference}
                </TableCell>
                <TableCell className="font-mono">
                  {"\u20A6"}
                  {formatKobo(d.amount)}
                </TableCell>
                <TableCell>{d.email}</TableCell>
                <TableCell>{d.donorName ?? "\u2014"}</TableCell>
                <TableCell>
                  <ProviderBadge provider={d.provider} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={d.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(d.createdAt).toLocaleDateString("en-NG", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
