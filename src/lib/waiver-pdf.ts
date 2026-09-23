// Server only. Renders the signed agreement as a PDF: the full text, the participant block,
// the signature image, and an audit block that says who signed which version, when, from where.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, BlendMode, pushGraphicsState, popGraphicsState, rectangle, clip, endPath, type PDFImage, type PDFFont, type PDFPage } from "pdf-lib";
import { WAIVER, WAIVER_VERSION, COMPANY, SIGNER } from "./waiver";

export type Signed = {
  name: string;
  email: string;
  signedAt: string;      // ISO UTC
  signedAtLocal: string; // as shown to the signer
  ip: string;
  userAgent: string;
  pageId: string;
  hash: string;
  signaturePng: Uint8Array;
  typedSignature: boolean;
};

const PAGE = { w: 612, h: 792, m: 64 }; // US Letter, 64pt margins
const INK = rgb(25/255, 25/255, 24/255);
const MUTED = rgb(62/255, 81/255, 89/255);
const LINE = rgb(0.75, 0.73, 0.68);
const CREAM = rgb(242/255, 233/255, 221/255);
const LIME = rgb(230/255, 1, 179/255);

function wrap(font: PDFFont, size: number, text: string, width: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (font.widthOfTextAtSize(t, size) <= width) cur = t;
    else { if (cur) lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

export async function buildWaiverPdf(s: Signed): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle("Marlo Alpha Program — Participant Agreement");
  doc.setAuthor(COMPANY);
  doc.setSubject(`Signed by ${s.name} · ${s.signedAt}`);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const mono = await doc.embedFont(StandardFonts.Courier);
  const width = PAGE.w - PAGE.m * 2;

  const wordmark = await doc.embedPng(await readFile(path.join(process.cwd(), "public/brand/marlo-wordmark.png")));
  const icon = await doc.embedJpg(await readFile(path.join(process.cwd(), "public/brand/marlo-icon.jpg")));
  const newPage = () => {
    const pg = doc.addPage([PAGE.w, PAGE.h]);
    pg.drawRectangle({ x: 0, y: 0, width: PAGE.w, height: PAGE.h, color: CREAM });
    return pg;
  };
  const brand = (pg: PDFPage, img: PDFImage, crop: number[], x: number, y: number, w: number) => {
    const [cx, cy, cw, ch] = crop, scale = w / cw;
    pg.pushOperators(pushGraphicsState(), rectangle(x, y, w, ch * scale), clip(), endPath());
    pg.drawImage(img, { x: x - cx * scale, y: y - (img.height - cy - ch) * scale, width: img.width * scale, height: img.height * scale, blendMode: BlendMode.Multiply });
    pg.pushOperators(popGraphicsState());
  };
  let page: PDFPage = newPage();
  let y = PAGE.h - PAGE.m;
  let pageNo = 1;

  const footer = (pg: PDFPage, n: number) => {
    pg.drawLine({ start: { x: PAGE.m, y: 44 }, end: { x: PAGE.w - PAGE.m, y: 44 }, thickness: 0.5, color: LINE });
    pg.drawText(`Marlo Alpha Program — Participant Agreement · ${WAIVER_VERSION} · ${s.hash}`, { x: PAGE.m, y: 30, size: 8, font, color: MUTED });
    const t = `${n}`;
    pg.drawText(t, { x: PAGE.w - PAGE.m - font.widthOfTextAtSize(t, 8), y: 30, size: 8, font, color: MUTED });
  };
  const need = (h: number) => {
    if (y - h < PAGE.m + 20) { footer(page, pageNo); page = newPage(); pageNo++; y = PAGE.h - PAGE.m; }
  };
  const para = (text: string, opts: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb>; indent?: number; after?: number; lead?: number } = {}) => {
    const size = opts.size ?? 10.5, f = opts.font ?? font, lead = opts.lead ?? size * 1.42, indent = opts.indent ?? 0;
    const lines = wrap(f, size, text, width - indent);
    for (const ln of lines) { need(lead); page.drawText(ln, { x: PAGE.m + indent, y: y - size, size, font: f, color: opts.color ?? INK }); y -= lead; }
    y -= opts.after ?? 6;
  };

  // Use the same supplied artwork and palette as the web agreement.
  brand(page, wordmark, [123, 138, 1055, 283], PAGE.m, y - 26, 100);
  brand(page, icon, [28, 46, 229, 102], PAGE.w - PAGE.m - 46, y - 24, 46);
  y -= 64;
  page.drawRectangle({ x: PAGE.m, y: y - 25, width: 250, height: 10, color: LIME });
  para("Participant agreement.", { size: 26, lead: 32, after: 10 });
  para(`${WAIVER_VERSION} · ${COMPANY}`, { size: 10, color: MUTED, after: 18 });

  // Wrap identity fields so long names and addresses cannot overlap.
  para("PARTICIPANT", { size: 8, color: MUTED, after: 2 });
  para(s.name, { size: 12, font: bold, after: 8 });
  para("EMAIL", { size: 8, color: MUTED, after: 2 });
  para(s.email, { size: 11, after: 8 });
  para("SIGNED", { size: 8, color: MUTED, after: 2 });
  para(s.signedAtLocal, { size: 10, after: 18 });
  page.drawLine({ start: { x: PAGE.m, y }, end: { x: PAGE.w - PAGE.m, y }, thickness: .75, color: LINE });
  y -= 20;

  // Sections
  for (const sec of WAIVER) {
    need(40);
    para(`${sec.n}. ${sec.title}`, { size: 12.5, font: bold, lead: 16, after: 4 });
    for (const b of sec.blocks) {
      if (b.kind === "p") para(b.text);
      else for (const it of b.items) {
        const size = 10.5, lead = size * 1.42;
        const lines = wrap(font, size, it, width - 18);
        for (let i = 0; i < lines.length; i++) {
          need(lead);
          if (i === 0) page.drawText("•", { x: PAGE.m + 6, y: y - size, size, font, color: INK });
          page.drawText(lines[i], { x: PAGE.m + 18, y: y - size, size, font, color: INK });
          y -= lead;
        }
        y -= 3;
      }
    }
    y -= 6;
  }

  // Signature block — keep together
  need(200);
  y -= 4;
  page.drawLine({ start: { x: PAGE.m, y }, end: { x: PAGE.w - PAGE.m, y }, thickness: 0.75, color: LINE });
  y -= 18;
  para("Signed", { size: 12.5, font: bold, lead: 16, after: 8 });

  const sig = await doc.embedPng(s.signaturePng);
  const sigScale = Math.min(54 / sig.height, (width * 0.5) / sig.width);
  const sigH = sig.height * sigScale, sigW = sig.width * sigScale;
  page.drawImage(sig, { x: PAGE.m, y: y - sigH, width: sigW, height: sigH });
  y -= sigH + 6;
  page.drawLine({ start: { x: PAGE.m, y }, end: { x: PAGE.m + width * 0.5, y }, thickness: 0.75, color: INK });
  y -= 14;
  page.drawText(s.name, { x: PAGE.m, y, size: 11, font: bold, color: INK });
  y -= 14;
  page.drawText(`${s.email} · ${s.signedAtLocal}`, { x: PAGE.m, y, size: 9.5, font, color: MUTED });
  y -= 24;

  page.drawText(COMPANY, { x: PAGE.m, y, size: 11, font: bold, color: INK });
  y -= 14;
  page.drawText(`By ${SIGNER.name}, ${SIGNER.title} · accepted on issue of this agreement`, { x: PAGE.m, y, size: 9.5, font, color: MUTED });
  y -= 26;

  // Audit block
  const auditLines = [
    "ELECTRONIC SIGNATURE RECORD",
    ...wrap(mono, 8, `Signed ${s.signedAt} (UTC) · ${s.typedSignature ? "typed" : "drawn"} signature · agreement ${WAIVER_VERSION} · text sha256 ${s.hash}`, width - 24),
    ...wrap(mono, 8, `Network address ${s.ip || "unknown"} · participant record ${s.pageId}`, width - 24),
    ...wrap(mono, 8, `Device ${s.userAgent || "unknown"}`, width - 24),
  ];
  const boxH = 16 + auditLines.length * 12;
  need(boxH + 10);
  page.drawRectangle({ x: PAGE.m, y: y - boxH, width, height: boxH, color: rgb(0.973, 0.965, 0.945), borderColor: LINE, borderWidth: 0.75 });
  auditLines.forEach((t, i) => page.drawText(t, { x: PAGE.m + 12, y: y - 16 - i * 12, size: 8, font: mono, color: MUTED }));
  y -= boxH + 10;

  footer(page, pageNo);
  return doc.save();
}
