export function urgencyBadge(u: string | null | undefined) {
  switch (u) {
    case "urgent":
      return {
        label: "urgent",
        className:
          "rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-600",
      };
    case "moderate":
      return {
        label: "moderate",
        className:
          "rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600",
      };
    default:
      return {
        label: u ?? "normal",
        className:
          "rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground",
      };
  }
}

export function urgencyTextClass(u: string | null | undefined): string {
  switch (u) {
    case "urgent":
      return "font-medium text-red-600";
    case "moderate":
      return "font-medium text-amber-600";
    default:
      return "";
  }
}