"use client";

import { deleteBusinessAction } from "@/lib/actions/business";
import { Button } from "@/components/ui/button";

export function DeleteBusinessButton({ businessId }: { businessId: string }) {
  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={async () => {
        if (
          confirm(
            "Delete this business and all its workflows? This cannot be undone."
          )
        ) {
          await deleteBusinessAction(businessId);
        }
      }}
    >
      Delete
    </Button>
  );
}