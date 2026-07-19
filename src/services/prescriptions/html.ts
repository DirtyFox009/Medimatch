// Paper-prescription HTML used for printing / PDF export. Self-contained
// (inline styles only) so it renders identically in expo-print's native
// WebView and the web print iframe.

import type { Prescription } from '../../types/prescription';

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

export function buildPrescriptionHtml(p: Prescription): string {
  const itemRows = p.items
    .map(
      (item, i) => `
        <tr>
          <td class="num">${i + 1}</td>
          <td>
            <div class="med-name">${esc(item.medicineName)}</div>
            ${item.genericName ? `<div class="med-sub">${esc(item.genericName)}</div>` : ''}
            ${item.instructions ? `<div class="med-sub">${esc(item.instructions)}</div>` : ''}
          </td>
          <td class="dose">${esc(item.dosage || '—')}</td>
          <td class="dose">${item.durationDays > 0 ? `${item.durationDays} days` : '—'}</td>
          <td class="dose">${esc(item.timing || '—')}</td>
        </tr>`,
    )
    .join('');

  const patientBits = [
    p.patientName && `<b>${esc(p.patientName)}</b>`,
    p.patientAge && `Age: ${esc(p.patientAge)}`,
    p.patientGender && `Sex: ${esc(p.patientGender)}`,
    p.patientWeight && `Wt: ${esc(p.patientWeight)} kg`,
  ]
    .filter(Boolean)
    .join('&nbsp;&nbsp;·&nbsp;&nbsp;');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Noto Sans Bengali', 'DejaVu Sans', Arial, sans-serif;
    color: #1e293b; font-size: 12px; line-height: 1.45;
    background: #fff; color-scheme: light;
  }
  .head { display: flex; justify-content: space-between; align-items: flex-start;
    border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
  .dr-name { font-size: 19px; font-weight: 700; color: #1e293b; }
  .dr-name-bn { font-size: 13px; color: #334155; }
  .dr-meta { font-size: 11px; color: #64748b; margin-top: 2px; }
  .brand { text-align: right; color: #2563eb; font-weight: 700; font-size: 14px; }
  .brand small { display: block; color: #64748b; font-weight: 400; font-size: 10px; }
  .patient { display: flex; justify-content: space-between; background: #f8fafc;
    border-radius: 10px; padding: 8px 12px; margin: 12px 0; }
  .section { margin-top: 14px; }
  .section-title { font-size: 10px; font-weight: 600; letter-spacing: 1px;
    text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;
    color: #64748b; border-bottom: 1px solid #e2e8f0; padding: 4px 6px; }
  td { padding: 6px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
  td.num { width: 22px; color: #94a3b8; }
  td.dose { white-space: nowrap; }
  .med-name { font-weight: 600; }
  .med-sub { font-size: 10px; color: #64748b; }
  .advice { white-space: pre-wrap; }
  .footer { margin-top: 26px; display: flex; justify-content: space-between;
    align-items: flex-end; }
  .sign { border-top: 1px solid #94a3b8; padding-top: 4px; font-size: 11px;
    color: #475569; min-width: 160px; text-align: center; }
  .gen-note { font-size: 9px; color: #94a3b8; }
</style>
</head>
<body>
  <div class="head">
    <div>
      <div class="dr-name">${esc(p.doctorNameEn)}</div>
      ${p.doctorNameBn ? `<div class="dr-name-bn">${esc(p.doctorNameBn)}</div>` : ''}
      <div class="dr-meta">${esc(p.qualifications.join(', '))}</div>
      <div class="dr-meta">${esc(p.specialty)}${p.bmdcReg ? ` · BMDC Reg: ${esc(p.bmdcReg)}` : ''}</div>
      <div class="dr-meta">${esc(p.hospitalNameEn)}</div>
    </div>
    <div class="brand">MediMatch<small>Digital Prescription</small></div>
  </div>

  <div class="patient">
    <span>${patientBits}</span>
    <span>Date: ${formatDate(p.date)}</span>
  </div>

  ${p.complaint ? `<div class="section"><div class="section-title">Chief Complaint</div><div>${esc(p.complaint)}</div></div>` : ''}
  ${p.diagnosis ? `<div class="section"><div class="section-title">Diagnosis</div><div>${esc(p.diagnosis)}</div></div>` : ''}

  <div class="section"><div class="section-title">Medicines</div></div>
  <table>
    <thead>
      <tr><th></th><th>Medicine</th><th>Dose</th><th>Duration</th><th>Timing</th></tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  ${p.tests.length ? `<div class="section"><div class="section-title">Investigations</div><div>${esc(p.tests.join(', '))}</div></div>` : ''}
  ${p.advice ? `<div class="section"><div class="section-title">Advice</div><div class="advice">${esc(p.advice)}</div></div>` : ''}
  ${p.followUpDate ? `<div class="section"><div class="section-title">Follow-up</div><div>${formatDate(p.followUpDate)}</div></div>` : ''}

  <div class="footer">
    <div class="gen-note">Digitally generated via MediMatch · ${formatDate(p.date)}</div>
    <div class="sign">${esc(p.doctorNameEn)}</div>
  </div>
</body>
</html>`;
}
