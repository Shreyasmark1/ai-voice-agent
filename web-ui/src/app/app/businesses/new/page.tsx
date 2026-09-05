import { BusinessForm } from "@/components/business-form";

export default function NewBusinessPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          New business
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a business profile to attach workflows to.
        </p>
      </div>
      <BusinessForm />
    </div>
  );
}