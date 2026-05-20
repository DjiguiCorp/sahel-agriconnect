import PDFDocument from 'pdfkit';

function formatDate(d) {
  if (!d) return '—';
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

function formatMoney(n) {
  const v = Number(n) || 0;
  return `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function createPdfBuffer(buildFn) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: 'A4' });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    buildFn(doc);
    doc.end();
  });
}

function pdfHeader(doc, title, org, country) {
  doc.fillColor('#1a3c2e').fontSize(10).text('Sahel AgriConnect · AfriYield NGO Portal', { align: 'left' });
  doc.moveDown(0.3);
  doc.fillColor('#0d1f17').fontSize(18).font('Helvetica-Bold').text(title);
  doc.font('Helvetica').fontSize(10).fillColor('#555');
  doc.text(`${org || 'Organization'} · ${country || ''}`);
  doc.text(`Generated: ${new Date().toLocaleString('en-GB')}`);
  doc.moveDown(1);
  doc.strokeColor('#B5850A').lineWidth(2).moveTo(48, doc.y).lineTo(547, doc.y).stroke();
  doc.moveDown(0.8);
}

function pdfFooter(doc) {
  doc.fontSize(8).fillColor('#888').text(
    'Data sourced from your Sahel AgriConnect NGO portal. Projected figures are operational estimates.',
    48,
    doc.page.height - 60,
    { width: 500, align: 'center' }
  );
}

export async function buildBeneficiaryReportPdf({ org, country, beneficiaries, programs }) {
  return createPdfBuffer((doc) => {
    pdfHeader(doc, 'Beneficiary Report', org, country);
    doc.fontSize(11).fillColor('#222').text(`Total beneficiaries: ${beneficiaries.length}`);
    const byGender = beneficiaries.reduce((acc, b) => {
      const g = b.gender || 'unspecified';
      acc[g] = (acc[g] || 0) + 1;
      return acc;
    }, {});
    doc.text(`By gender: ${Object.entries(byGender).map(([k, v]) => `${k}: ${v}`).join(' · ')}`);
    doc.moveDown(0.8);

    doc.font('Helvetica-Bold').fontSize(12).text('Beneficiary register');
    doc.moveDown(0.4);
    doc.font('Helvetica').fontSize(9);
    for (const b of beneficiaries.slice(0, 120)) {
      if (doc.y > 700) {
        doc.addPage();
        pdfHeader(doc, 'Beneficiary Report (continued)', org, country);
        doc.font('Helvetica').fontSize(9);
      }
      doc.fillColor('#222').text(
        `• ${b.name} — ${b.programName || '—'} · ${b.region || '—'} · ${b.gender || '—'} · ${b.mainCrop || '—'}`
      );
    }
    if (beneficiaries.length > 120) {
      doc.text(`… and ${beneficiaries.length - 120} more (see web portal for full export).`);
    }
    doc.moveDown(1);
    doc.fontSize(10).text(`Programs tracked: ${programs.length}`);
    pdfFooter(doc);
  });
}

export async function buildProgramReportPdf({ org, country, programs }) {
  return createPdfBuffer((doc) => {
    pdfHeader(doc, 'Program Report', org, country);
    const active = programs.filter((p) => p.status === 'active').length;
    doc.fontSize(11).fillColor('#222').text(`Programs: ${programs.length} (${active} active)`);
    doc.moveDown(0.8);
    for (const p of programs) {
      if (doc.y > 680) {
        doc.addPage();
        pdfHeader(doc, 'Program Report (continued)', org, country);
        doc.font('Helvetica').fontSize(10);
      }
      const pct = p.target > 0 ? Math.round((p.beneficiaries / p.target) * 100) : 0;
      const budgetPct = p.budget > 0 ? Math.round((p.spent / p.budget) * 100) : 0;
      doc.font('Helvetica-Bold').fillColor('#1a3c2e').text(p.name);
      doc.font('Helvetica').fillColor('#444');
      doc.text(`${p.region || '—'} · ${p.type || '—'} · Status: ${p.status}`);
      doc.text(`Beneficiaries: ${p.beneficiaries}/${p.target} (${pct}%)`);
      doc.text(`Budget: ${formatMoney(p.spent)} / ${formatMoney(p.budget)} (${budgetPct}%)`);
      doc.text(`Timeline: ${p.startLabel || formatDate(p.startDate)} → ${p.endLabel || formatDate(p.endDate)}`);
      if (p.objectives) doc.text(`Objectives: ${p.objectives}`);
      doc.moveDown(0.6);
    }
    pdfFooter(doc);
  });
}

export async function buildCooperativeReportPdf({ org, country, cooperatives }) {
  return createPdfBuffer((doc) => {
    pdfHeader(doc, 'Cooperative Network Report', org, country);
    doc.fontSize(11).fillColor('#222').text(`Partner cooperatives in ${country}: ${cooperatives.length}`);
    doc.moveDown(0.8);
    for (const c of cooperatives) {
      doc.font('Helvetica-Bold').fillColor('#1a3c2e').text(c.cooperativeName || c.nomCooperative || 'Cooperative');
      doc.font('Helvetica').fillColor('#444');
      doc.text(`Region: ${c.region || c.zone || '—'} · Members: ${c.memberCount ?? c.members ?? '—'}`);
      if (c.email) doc.text(`Contact: ${c.email} ${c.phone || ''}`);
      doc.moveDown(0.5);
    }
    pdfFooter(doc);
  });
}

export async function buildImpactReportPdf({ org, country, insights }) {
  return createPdfBuffer((doc) => {
    pdfHeader(doc, 'Impact & KPI Report', org, country);
    doc.fontSize(11).fillColor('#222');
    doc.text(`Total beneficiaries reached: ${insights.totalBeneficiaries}`);
    doc.text(`Coverage rate: ${insights.coverageRate}%`);
    doc.text(`Active programs: ${insights.activePrograms}`);
    doc.text(`Budget utilization: ${insights.budgetUtilization}%`);
    doc.text(`Cooperatives linked: ${insights.cooperativesCount}`);
    doc.moveDown(0.8);
    doc.font('Helvetica-Bold').text('SDG alignment (estimated)');
    doc.font('Helvetica');
    for (const s of insights.sdgProgress || []) {
      doc.text(`SDG ${s.goal}: ${s.label} — ${s.percent}%`);
    }
    doc.moveDown(0.8);
    doc.font('Helvetica-Bold').text('Regional distribution');
    doc.font('Helvetica');
    for (const r of insights.byRegion || []) {
      doc.text(`${r.region}: ${r.count} beneficiaries`);
    }
    pdfFooter(doc);
  });
}

export function computeInsights(programs, beneficiaries, cooperatives) {
  const totalBeneficiaries = programs.reduce((s, p) => s + (Number(p.beneficiaries) || 0), 0);
  const totalTarget = programs.reduce((s, p) => s + (Number(p.target) || 0), 0);
  const coverageRate = totalTarget > 0 ? Math.round((totalBeneficiaries / totalTarget) * 100) : 0;
  const activePrograms = programs.filter((p) => p.status === 'active').length;
  const totalBudget = programs.reduce((s, p) => s + (Number(p.budget) || 0), 0);
  const totalSpent = programs.reduce((s, p) => s + (Number(p.spent) || 0), 0);
  const budgetUtilization = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const regionMap = {};
  for (const b of beneficiaries) {
    const r = b.region || 'Unknown';
    regionMap[r] = (regionMap[r] || 0) + 1;
  }
  const byRegion = Object.entries(regionMap)
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const genderMap = { female: 0, male: 0, other: 0, unspecified: 0 };
  for (const b of beneficiaries) {
    const g = genderMap[b.gender] !== undefined ? b.gender : 'unspecified';
    genderMap[g] = (genderMap[g] || 0) + 1;
  }

  const sdgProgress = [
    { goal: 1, label: 'No poverty', percent: Math.min(100, coverageRate) },
    { goal: 2, label: 'Zero hunger', percent: Math.min(100, Math.round(activePrograms * 25)) },
    { goal: 5, label: 'Gender equality', percent: Math.min(100, Math.round((genderMap.female / Math.max(1, beneficiaries.length)) * 100)) },
    { goal: 8, label: 'Decent work', percent: Math.min(100, budgetUtilization) },
  ];

  return {
    totalBeneficiaries,
    totalTarget,
    coverageRate,
    activePrograms,
    totalPrograms: programs.length,
    budgetUtilization,
    totalBudget,
    totalSpent,
    cooperativesCount: cooperatives.length,
    byRegion,
    genderBreakdown: genderMap,
    sdgProgress,
    registeredBeneficiaries: beneficiaries.length,
  };
}

export function programToClient(p) {
  return {
    id: p._id.toString(),
    name: p.name,
    status: p.status,
    beneficiaries: p.beneficiaries,
    target: p.target,
    region: p.region,
    type: p.type,
    startDate: p.startLabel || formatDate(p.startDate),
    endDate: p.endLabel || formatDate(p.endDate),
    budget: p.budget,
    spent: p.spent,
    objectives: p.objectives,
    sdgGoals: p.sdgGoals,
  };
}
