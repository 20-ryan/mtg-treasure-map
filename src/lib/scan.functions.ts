import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const input = z.object({ image: z.string().min(64).max(8_000_000) });

export const identifyCard = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => input.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured.");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You identify Magic: The Gathering cards from photos. Reply with ONLY minified JSON: " +
              '{"card_name":string,"set_name":string,"set_code":string,"rarity":"common"|"uncommon"|"rare"|"mythic"|"special","collector_number":string|null,"confidence":number}. ' +
              'If the photo is not an MTG card, return {"card_name":""}.',
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Identify this Magic card." },
              { type: "image_url", image_url: { url: data.image } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429) throw new Error("Too many scans right now — try again in a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted. Top up to keep scanning.");
      throw new Error(`Card recognition failed [${res.status}]: ${body}`);
    }

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = json.choices?.[0]?.message?.content ?? "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Could not read that card. Try a sharper, straight-on photo.");
    const parsed = JSON.parse(match[0]) as {
      card_name?: string;
      set_name?: string;
      set_code?: string;
      rarity?: string;
      collector_number?: string | null;
    };
    if (!parsed.card_name) throw new Error("No Magic card detected in that image.");
    let cardName: string = parsed.card_name;

    // Enrich with official artwork + printing data from Scryfall.
    let image_url: string | null = null;
    let set_code = (parsed.set_code ?? "").toUpperCase();
    let set_name = parsed.set_name ?? "";
    let rarity = (parsed.rarity ?? "common").toLowerCase();
    let collector_number = parsed.collector_number ?? null;
    try {
      const sf = await fetch(
        `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(parsed.card_name)}` +
          (set_code ? `&set=${encodeURIComponent(set_code.toLowerCase())}` : ""),
      );
      if (sf.ok) {
        const card = (await sf.json()) as any;
        image_url = card.image_uris?.normal ?? card.card_faces?.[0]?.image_uris?.normal ?? null;
        set_code = (card.set ?? set_code).toUpperCase();
        set_name = card.set_name ?? set_name;
        rarity = card.rarity ?? rarity;
        collector_number = card.collector_number ?? collector_number;
        cardName = (card.name as string) ?? cardName;
      }
    } catch {
      /* Scryfall enrichment is best-effort. */
    }

    return {
      card_name: cardName,
      set_code,
      set_name,
      rarity,
      collector_number,
      image_url,
    };
  });

export type ReceiptLine = {
  product_description: string;
  quantity: number;
  price: number | null;
};

export const parseReceipt = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => input.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured.");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You read photos of retail receipts from Singapore game stores. Reply with ONLY minified JSON: " +
              '{"store_name":string|null,"items":[{"product_description":string,"quantity":number,"price":number|null}]}. ' +
              "Prices are SGD numbers without currency symbols. If nothing is readable return {\"store_name\":null,\"items\":[]}.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract the store name and purchased line items from this receipt." },
              { type: "image_url", image_url: { url: data.image } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429) throw new Error("Too many scans right now — try again in a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted. Top up to keep scanning.");
      throw new Error(`Receipt reading failed [${res.status}]: ${body}`);
    }

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const match = (json.choices?.[0]?.message?.content ?? "").match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Could not read that receipt. Try a flatter, brighter photo.");
    const parsed = JSON.parse(match[0]) as { store_name?: string | null; items?: ReceiptLine[] };
    const items = (parsed.items ?? [])
      .filter((i) => i && typeof i.product_description === "string" && i.product_description.trim())
      .map((i) => ({
        product_description: i.product_description.trim().slice(0, 120),
        quantity: Number.isFinite(i.quantity) && i.quantity > 0 ? Math.round(i.quantity) : 1,
        price: typeof i.price === "number" && Number.isFinite(i.price) ? i.price : null,
      }));
    if (!items.length) throw new Error("No purchase lines found on that receipt.");
    return { store_name: parsed.store_name ?? null, items };
  });
