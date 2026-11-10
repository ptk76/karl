import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Home from "../src/marketing/Home";
import BlogIndex from "../src/marketing/BlogIndex";
import BlogPost from "../src/marketing/BlogPost";
import Privacy from "../src/marketing/Privacy";
import Terms from "../src/marketing/Terms";
import NotFound from "../src/marketing/NotFound";

describe("marketing pages", () => {
  it("renders the home hero and waitlist", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );
    expect(
      screen.getByText(/Your AI never sees your mailbox/i),
    ).toBeTruthy();
    expect(screen.getByText(/How it works/i)).toBeTruthy();
    expect(screen.getAllByText(/Join the waiting list/i).length).toBeGreaterThan(0);
  });

  it("renders the blog index", () => {
    render(
      <MemoryRouter>
        <BlogIndex />
      </MemoryRouter>,
    );
    expect(screen.getAllByText("Blog").length).toBeGreaterThan(0);
    expect(screen.getByText(/What can an AI learn about you from your email/i)).toBeTruthy();
  });

  it("renders a blog post", () => {
    render(
      <MemoryRouter initialEntries={["/blog/what-ai-knows-from-your-email"]}>
        <BlogPost />
      </MemoryRouter>,
    );
    expect(screen.getByText(/What can an AI learn about you from your email/i)).toBeTruthy();
  });

  it("renders privacy and terms", () => {
    render(
      <MemoryRouter>
        <Privacy />
      </MemoryRouter>,
    );
    expect(screen.getAllByText(/Privacy notice & imprint/i).length).toBeGreaterThan(0);

    render(
      <MemoryRouter>
        <Terms />
      </MemoryRouter>,
    );
    expect(screen.getAllByText(/Terms of use/i).length).toBeGreaterThan(0);
  });

  it("renders the not-found page", () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>,
    );
    expect(screen.getAllByText(/Nothing at this address/i).length).toBeGreaterThan(0);
  });
});
