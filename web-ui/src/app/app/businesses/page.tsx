import Link from "next/link";

import { getBusinesses } from "@/lib/actions/business";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusIcon, Building03Icon } from "@hugeicons/core-free-icons";

export default async function BusinessesPage() {
  const businesses = await getBusinesses();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Businesses</h1>
          <p className="text-sm text-muted-foreground">
            Profiles that own missed-call workflows.
          </p>
        </div>
        <Link
          href="/app/businesses/new"
          className={cn(buttonVariants({ variant: "default", size: "default" }))}
        >
          <HugeiconsIcon icon={PlusIcon} className="size-4" />
          New business
        </Link>
      </div>

      {businesses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-muted">
              <HugeiconsIcon icon={Building03Icon} className="size-6 text-muted-foreground" />
            </span>
            <div className="space-y-1">
              <CardTitle>No businesses yet</CardTitle>
              <CardDescription>
                Create your first business to start building missed-call workflows.
              </CardDescription>
            </div>
            <Link
              href="/app/businesses/new"
              className={cn(buttonVariants({ variant: "default", size: "default" }))}
            >
              <HugeiconsIcon icon={PlusIcon} className="size-4" />
              Create business
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {businesses.map((b) => (
            <Link key={b.id} href={`/app/businesses/${b.id}`}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle>{b.name}</CardTitle>
                  <CardDescription>{b.industry}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {b.languages.map((l) => (
                      <span
                        key={l}
                        className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize text-muted-foreground"
                      >
                        {l}
                      </span>
                    ))}
                  </div>
                  {b.phone && (
                    <p className="mt-3 text-sm text-muted-foreground">{b.phone}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}