/**
 * Client-side certificate rendering.
 *
 * Certificates are records (title, credential id, issue date), not stored PDFs,
 * so we render a self-contained SVG on the fly. SVG is crisp at any size,
 * printable, and needs no library. "Download all" zips these via lib/zip.
 *
 * If the backend later serves signed PDF certificates, replace the download
 * handlers with a fetch to that endpoint — the buttons/filenames stay ours.
 */

import type { Certificate } from "@/data/types";
import { formatDate } from "@/lib/format";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** A Clear Sky themed certificate as a standalone SVG string. */
export function certificateSvg(cert: Certificate, recipientName: string): string {
  const name = escapeXml(recipientName);
  const title = escapeXml(cert.title);
  const issued = escapeXml(formatDate(cert.issuedOn));
  const credential = escapeXml(cert.credentialId);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="850" viewBox="0 0 1200 850" font-family="Inter, ui-sans-serif, system-ui, sans-serif">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f0f9ff"/>
      <stop offset="1" stop-color="#ffffff"/>
    </linearGradient>
    <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#38bdf8"/>
      <stop offset="1" stop-color="#0ea5e9"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="850" fill="url(#sky)"/>
  <rect x="40" y="40" width="1120" height="770" rx="24" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
  <rect x="40" y="40" width="1120" height="10" rx="5" fill="url(#bar)"/>

  <!-- pencil-line doodles -->
  <g stroke="#bae6fd" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.9">
    <path d="M120 150 l14 -30 14 30 -14 12 z"/>
    <circle cx="1050" cy="170" r="26"/>
    <path d="M980 660 q30 -34 60 0 t60 0"/>
    <path d="M150 690 l10 -18 10 18 M150 690 h20"/>
  </g>

  <!-- graduation cap mark -->
  <g transform="translate(600,150)">
    <circle r="46" fill="#e0f2fe"/>
    <g transform="translate(-30,-24)" fill="none" stroke="#0284c7" stroke-width="3.4" stroke-linejoin="round" stroke-linecap="round">
      <path d="M30 6 L58 20 L30 34 L2 20 Z"/>
      <path d="M14 27 L14 40 Q30 50 46 40 L46 27"/>
      <path d="M58 20 L58 38"/>
    </g>
  </g>

  <text x="600" y="270" text-anchor="middle" font-size="20" letter-spacing="4" font-weight="600" fill="#0284c7">CERTIFICATE OF COMPLETION</text>
  <text x="600" y="312" text-anchor="middle" font-size="15" letter-spacing="2" fill="#64748b">NETSCRIBES · LESSONS</text>

  <text x="600" y="380" text-anchor="middle" font-size="17" fill="#3e4850">This certifies that</text>
  <text x="600" y="440" text-anchor="middle" font-size="52" font-weight="600" fill="#131b2e">${name}</text>
  <line x1="380" y1="466" x2="820" y2="466" stroke="#e2e8f0" stroke-width="1.5"/>

  <text x="600" y="516" text-anchor="middle" font-size="17" fill="#3e4850">has successfully completed</text>
  <text x="600" y="566" text-anchor="middle" font-size="34" font-weight="600" fill="#0369a1">${title}</text>

  <g font-size="15" fill="#64748b">
    <text x="230" y="700" text-anchor="middle" font-weight="600" fill="#131b2e">${issued}</text>
    <text x="230" y="726" text-anchor="middle">Date issued</text>
    <line x1="120" y1="676" x2="340" y2="676" stroke="#cbd5e1" stroke-width="1.2"/>

    <text x="970" y="700" text-anchor="middle" font-weight="600" fill="#131b2e" font-variant-numeric="tabular-nums">${credential}</text>
    <text x="970" y="726" text-anchor="middle">Credential ID</text>
    <line x1="860" y1="676" x2="1080" y2="676" stroke="#cbd5e1" stroke-width="1.2"/>
  </g>
</svg>`;
}

/** Safe file-name stem for a certificate download. */
export function certificateFilename(cert: Certificate): string {
  const slug = cert.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `certificate-${slug}-${cert.credentialId}.svg`;
}
