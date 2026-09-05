"use client";

import { deleteWorkflowAction } from "@/lib/actions/workflow";
import { Button } from "@/components/ui/button";

export function DeleteWorkflowButton({ workflowId }: { workflowId: string }) {
  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={async () => {
        if (
          confirm("Delete this workflow and its questions? This cannot be undone.")
        ) {
          await deleteWorkflowAction(workflowId);
        }
      }}
    >
      Delete
    </Button>
  );
}