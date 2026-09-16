// Server only. Renders the signed agreement as a PDF: the full text, the participant block,
// the signature image, and an audit block that says who signed which version, when, from where.
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
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
const INK = rgb(0.102, 0.102, 0.09);   // midnight
const MUTED = rgb(0.43, 0.416, 0.376); // slate
const LINE = rgb(0.894, 0.867, 0.808); // line

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

  let page: PDFPage = doc.addPage([PAGE.w, PAGE.h]);
  let y = PAGE.h - PAGE.m;
  let pageNo = 1;

  const footer = (pg: PDFPage, n: number) => {
    pg.drawLine({ start: { x: PAGE.m, y: 44 }, end: { x: PAGE.w - PAGE.m, y: 44 }, thickness: 0.5, color: LINE });
    pg.drawText(`Marlo Alpha Program — Participant Agreement · ${WAIVER_VERSION} · ${s.hash}`, { x: PAGE.m, y: 30, size: 8, font, color: MUTED });
    const t = `${n}`;
    pg.drawText(t, { x: PAGE.w - PAGE.m - font.widthOfTextAtSize(t, 8), y: 30, size: 8, font, color: MUTED });
  };
  const need = (h: number) => {
    if (y - h < PAGE.m + 20) { footer(page, pageNo); page = doc.addPage([PAGE.w, PAGE.h]); pageNo++; y = PAGE.h - PAGE.m; }
  };
  const para = (text: string, opts: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb>; indent?: number; after?: number; lead?: number } = {}) => {
    const size = opts.size ?? 10.5, f = opts.font ?? font, lead = opts.lead ?? size * 1.42, indent = opts.indent ?? 0;
    const lines = wrap(f, size, text, width - indent);
    for (const ln of lines) { need(lead); page.drawText(ln, { x: PAGE.m + indent, y: y - size, size, font: f, color: opts.color ?? INK }); y -= lead; }
    y -= opts.after ?? 6;
  };

  // Title block
  page.drawText("Marlo", { x: PAGE.m, y: y - 14, size: 14, font: bold, color: INK });
  page.drawText(".", { x: PAGE.m + bold.widthOfTextAtSize("Marlo", 14), y: y - 14, size: 14, font: bold, color: rgb(0.98, 0.54, 0.447) });
  y -= 34;
  para("Marlo Alpha Program — Participant Agreement", { size: 20, font: bold, lead: 24, after: 4 });
  para(`${WAIVER_VERSION} · ${COMPANY}`, { size: 10, color: MUTED, after: 14 });

  // Participant block
  need(70);
  page.drawRectangle({ x: PAGE.m, y: y - 62, width, height: 62, color: rgb(0.996, 0.992, 0.976), borderColor: LINE, borderWidth: 0.75 });
  const cell = (label: string, value: string, x: number) => {
    page.drawText(label.toUpperCase(), { x, y: y - 18, size: 7.5, font, color: MUTED });
    page.drawText(value, { x, y: y - 36, size: 11, font: bold, color: INK });
  };
  cell("Participant", s.name, PAGE.m + 14);
  cell("Email", s.email, PAGE.m + 14 + width * 0.38);
  cell("Date", s.signedAtLocal.split(",").slice(0, 2).join(",").trim() || s.signedAt.slice(0, 10), PAGE.m + 14 + width * 0.76);
  y -= 78;

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
  const sigH = 54, sigW = Math.min(width * 0.5, (sig.width / sig.height) * sigH);
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
