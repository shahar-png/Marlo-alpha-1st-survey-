// Idempotent production migration. Uses the existing Notion connection in Vercel;
// never downloads credentials, creates participant records, or sends email.
import { SUPPLEMENT_COUNT_OPTIONS } from "../src/lib/qualify";
import { supplementSuggestions } from "../src/lib/supplement-improvements";

async function setup() {
  if (process.env.NEXT_PUBLIC_MARLO_STAGING === "1") return;
  const token = process.env.NOTION_TOKEN, dbId = process.env.NOTION_PARTICIPANTS_DB;
  if (process.env.VERCEL_ENV !== "production") return;
  if (!token || !dbId) throw new Error("Supplement review requires the production Notion connection");
  const api = async (path: string, body?: unknown, method = body ? "POST" : "GET", version = "2022-06-28") => {
    // Stay below Notion's sustained three-requests-per-second limit.
    await new Promise(resolve => setTimeout(resolve, 360));
    const response = await fetch(`https://api.notion.com/v1/${path}`, {
      method, headers: { Authorization: `Bearer ${token}`, "Notion-Version": version, "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Supplement review setup: ${response.status} ${error.code || "request_failed"} ${error.message || ""}`);
    }
    return response.json();
  };
  const schema = await api(`databases/${dbId}`);
  const required = {
    "Supplement suggestions": { rich_text: {} },
    "Supplement review": { select: { options: [
      { name: "Needs review", color: "yellow" }, { name: "Reviewed", color: "blue" },
      { name: "Added to quiz", color: "green" }, { name: "Not needed", color: "gray" },
    ] } },
    "Supplement review notes": { rich_text: {} },
    "Supplement count": { select: { options: SUPPLEMENT_COUNT_OPTIONS.map((option, index) => ({
      name: option.id,
      color: (["gray", "blue", "green", "purple"] as const)[index] || "default",
    })) } },
    Attribution: { rich_text: {} },
  };
  const missing = Object.fromEntries(Object.entries(required).filter(([name, definition]) => {
    const existing = schema.properties[name];
    if (existing && existing.type !== Object.keys(definition)[0]) throw new Error(`Unexpected property type for ${name}`);
    return !existing;
  }));
  const updated = Object.keys(missing).length ? await api(`databases/${dbId}`, { properties: missing }, "PATCH") : schema;
  const database = await api(`databases/${dbId}`, undefined, "GET", "2026-03-11");
  const source = database.data_sources?.[0]?.id;
  if (!source) throw new Error("No participant data source found");
  const views = [];
  let cursor: string | undefined;
  do {
    const list = await api(`views?database_id=${dbId}&page_size=100${cursor ? `&start_cursor=${cursor}` : ""}`, undefined, "GET", "2026-03-11");
    views.push(...list.results); cursor = list.has_more ? list.next_cursor : undefined;
  } while (cursor);
  // List results may contain only IDs. Retrieve details before deciding whether to create.
  let reviewView;
  for (const item of views) {
    const view = item.name ? item : await api(`views/${item.id}`, undefined, "GET", "2026-03-11");
    if (view.name === "Supplement improvements") { reviewView = view; break; }
  }
  if (!reviewView) {
    const visible = ["Name", "Supplement suggestions", "Supplement review", "Supplement review notes", "Applied"];
    reviewView = await api("views", {
      database_id: dbId, data_source_id: source, name: "Supplement improvements", type: "table",
      filter: { property: "Supplement suggestions", rich_text: { is_not_empty: true } },
      sorts: [{ property: "Applied", direction: "descending" }],
      configuration: { type: "table", wrap_cells: true, properties: Object.entries(updated.properties).map(([name, prop]) => ({ property_id: (prop as { id: string }).id, visible: visible.includes(name), ...(visible.includes(name) ? { width: name === "Name" ? 180 : 250, wrap: true } : {}) })) },
    }, "POST", "2026-03-11");
  }
  // Bring existing written-in answers into the same queue without changing any answers or decisions.
  cursor = undefined;
  let added = 0;
  do {
    const list = await api(`databases/${dbId}/query`, { page_size: 100, filter: { and: [
      { property: "Supplements other", rich_text: { is_not_empty: true } },
      { property: "Supplement suggestions", rich_text: { is_empty: true } },
      { property: "Supplement review", select: { is_empty: true } },
    ] }, ...(cursor ? { start_cursor: cursor } : {}) });
    for (const page of list.results) {
      const raw = page.properties["Supplements other"].rich_text.map((t: { plain_text: string }) => t.plain_text).join("");
      const suggestions = supplementSuggestions(raw);
      if (!suggestions.length) continue;
      await api(`pages/${page.id}`, { properties: {
        "Supplement suggestions": { rich_text: [{ text: { content: suggestions.join("; ") } }] },
        "Supplement review": { select: { name: "Needs review" } },
      } }, "PATCH");
      added++;
    }
    cursor = list.has_more ? list.next_cursor : undefined;
  } while (cursor);
  console.log(`Supplement review ready: https://www.notion.so/${dbId.replaceAll("-", "")}?v=${reviewView.id.replaceAll("-", "")} (${added} existing responses queued)`);
}
setup().catch(error => { console.error(error.message); process.exitCode = 1; });
