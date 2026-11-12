import { afterEach, describe, it, expect } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Home from "../src/marketing/Home";
import BlogIndex from "../src/marketing/BlogIndex";
import BlogPost from "../src/marketing/BlogPost";
import Privacy from "../src/marketing/Privacy";
import Terms from "../src/marketing/Terms";
import NotFound from "../src/marketing/NotFound";

// No vitest globals here, so Testing Library cannot unmount on its own; without
// this, every render piles up in one document and ids like #faq repeat.
afterEach(cleanup);

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

  it("puts the primary CTA in the hero and links privacy doubts to the FAQ", () => {
    const { container } = render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );
    const heroCta = container.querySelector(".hero .btn");
    expect(heroCta?.textContent).toBe("Get your address");
    expect(heroCta?.getAttribute("href")).toBe("/app");
    expect(container.querySelector("#faq")).toBeTruthy();
    const faqLinks = [...container.querySelectorAll('a[href="#faq"]')];
    expect(faqLinks.length).toBeGreaterThan(0);
    expect(container.textContent).not.toMatch(/Two more questions/);
    expect(container.textContent).not.toMatch(/no token is ever shown/);
    expect(container.textContent).toMatch(/claude mcp add/);
  });

  it("shows Register / Log in in the top bar, both to the account app", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );
    const nav = screen.getByRole("navigation", { name: "Account" });
    const links = [...nav.querySelectorAll("a")];
    expect(links.map((a) => a.textContent)).toEqual(["Register", "Log in"]);
    expect(links.every((a) => a.getAttribute("href") === "/app")).toBe(true);
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
        <Routes>
          <Route path="/blog/:slug" element={<BlogPost />} />
        </Routes>
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
