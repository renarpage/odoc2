'use strict';
const PDFDocument = require('pdfkit');

// Streams a generated PDF straight to the HTTP response (no temp files).
function pipePdf(res, filename, build) {
  const doc = new PDFDocument({ margin: 48, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);
  doc.fillColor('#3155E7').fontSize(20).text('ODOC - OSIS SMAVO', { align: 'left' });
  doc.moveDown(0.3).fillColor('#666').fontSize(10).text(`Digenerate ${new Date().toLocaleString('id-ID')}`);
  doc.moveDown().fillColor('#111');
  build(doc);
  doc.end();
}

class ExportService {
  activityReport(res, activity) {
    pipePdf(res, `activity-${activity.slug}.pdf`, (doc) => {
      doc.fontSize(16).text(activity.title);
      doc.moveDown(0.3).fontSize(10).fillColor('#666').text(`Status: ${activity.status}  |  ${activity.division || '-'}`);
      doc.moveDown().fillColor('#111').fontSize(11).text(activity.summary || '');
      doc.moveDown().text(activity.description || '', { align: 'justify' });
      doc.moveDown().fontSize(10).fillColor('#666')
        .text(`Lokasi: ${activity.location || '-'}`)
        .text(`Waktu: ${activity.startDate ? new Date(activity.startDate).toLocaleDateString('id-ID') : '-'} - ${activity.endDate ? new Date(activity.endDate).toLocaleDateString('id-ID') : '-'}`)
        .text(`Galeri: ${(activity.gallery || []).length} file  |  Dokumen: ${(activity.documents || []).length} file`);
    });
  }

  statisticsReport(res, stats) {
    pipePdf(res, 'statistics-report.pdf', (doc) => {
      doc.fontSize(16).text('Laporan Statistik');
      doc.moveDown().fontSize(11)
        .text(`Total Activity: ${stats.totalActivity}`)
        .text(`Upcoming: ${stats.status.upcoming}   Ongoing: ${stats.status.ongoing}   Completed: ${stats.status.completed}`)
        .text(`Total Galeri: ${stats.totalGallery}   Total Dokumen: ${stats.totalDocs}`)
        .text(`Storage: ${(stats.storage.usedBytes / 1048576).toFixed(1)} MB / ${(stats.storage.quotaBytes / 1073741824).toFixed(0)} GB (${stats.storage.percent}%)`)
        .text(`Pengunjung - Hari ini: ${stats.visitors.today}  Bulan ini: ${stats.visitors.month}  Total: ${stats.visitors.total}`);
    });
  }

  galleryReport(res, activity, items) {
    pipePdf(res, `gallery-${activity ? activity.slug : 'all'}.pdf`, (doc) => {
      doc.fontSize(16).text(`Laporan Galeri${activity ? ` - ${activity.title}` : ''}`);
      doc.moveDown().fontSize(11).text(`Total item: ${items.length}`);
      items.forEach((it, i) => doc.fontSize(10).fillColor('#333').text(`${i + 1}. ${it.name} (${it.kind}, ${(it.size / 1024).toFixed(0)} KB)`));
    });
  }
}
module.exports = new ExportService();
