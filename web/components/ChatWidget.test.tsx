import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { dict } from "@/lib/i18n";
import ChatWidget from "./ChatWidget";

const t = dict.fa;
const setup = () =>
  render(<ChatWidget t={t} lang="fa" name="سارا" welcome="خوش آمدید" suggestions={["سؤال یک", "سؤال دو"]} />);

describe("ChatWidget", () => {
  it("opens and closes the chat window", async () => {
    setup();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: t.openChat }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("خوش آمدید")).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole("button", { name: t.closeChat })[0]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("sends a message and renders the markdown reply", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ reply: "**بله** حتماً" }));
    vi.stubGlobal("fetch", fetchMock);
    setup();
    await userEvent.click(screen.getByRole("button", { name: t.openChat }));
    await userEvent.type(screen.getByLabelText(t.placeholder), "سلام{Enter}");

    expect(await screen.findByText("بله")).toHaveProperty("tagName", "STRONG");
    expect(screen.getByText("سلام")).toBeInTheDocument();
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ messages: [{ role: "user", content: "سلام" }], lang: "fa" });
    expect(screen.getByLabelText(t.placeholder)).toHaveValue("");
  });

  it("sends a suggestion when clicked and hides the suggestions", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ reply: "پاسخ" })));
    setup();
    await userEvent.click(screen.getByRole("button", { name: t.openChat }));
    await userEvent.click(screen.getByRole("button", { name: "سؤال یک" }));
    expect(await screen.findByText("پاسخ")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "سؤال دو" })).not.toBeInTheDocument();
  });

  it("shows an error message when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 500 })));
    setup();
    await userEvent.click(screen.getByRole("button", { name: t.openChat }));
    await userEvent.type(screen.getByLabelText(t.placeholder), "سلام{Enter}");
    expect(await screen.findByRole("alert")).toHaveTextContent(t.error);
  });
});
