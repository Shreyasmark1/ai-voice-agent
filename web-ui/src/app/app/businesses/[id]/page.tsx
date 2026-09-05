import { notFound } from "next/navigation";
import Link from "next/link";
import { getBusiness } from "@/lib/actions/business";
import { BusinessForm } from "@/components/business-form";
import { DeleteBusinessButton } from "@/components/delete-business-button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";

export default async function BusinessViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const business = await getBusiness(id);

  if (!business) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/app/businesses"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "mb-1 -ml-2"
            )}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
            Back
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            Edit business
          </h1>
        </div>

        <DeleteBusinessButton businessId={business.id} />
      </div>

      <BusinessForm business={business} />
    </div>
  );
}