import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PlanningStatusPage } from "@/features/foundation/components/planning-status-page";

describe("PlanningStatusPage", () => {
  it("communicates the real delivery state and links to the project documentation", () => {
    render(<PlanningStatusPage />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Trusted answers begin with a deliberate foundation.",
    );

    const statusRegion = screen.getByRole("region", { name: "Building with review gates" });
    expect(within(statusRegion).getByText("Planning complete")).toBeInTheDocument();
    expect(within(statusRegion).getByText("Foundation in progress")).toBeInTheDocument();
    expect(
      within(statusRegion).getByText(/No authentication, document processing, retrieval, or AI/),
    ).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /Review the documentation/ })).toHaveAttribute(
      "href",
      "https://github.com/powelldevel/Nyla-AI/tree/main/docs",
    );
  });
});
