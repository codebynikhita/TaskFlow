const PDFDocument = require('pdfkit');
const { createObjectCsvStringifier } = require('csv-writer');

const exportToCsv = (tasks) => {
  const csvStringifier = createObjectCsvStringifier({
    header: [
      { id: 'title', title: 'TITLE' },
      { id: 'description', title: 'DESCRIPTION' },
      { id: 'priority', title: 'PRIORITY' },
      { id: 'status', title: 'STATUS' },
      { id: 'dueDate', title: 'DUE DATE' },
      { id: 'tags', title: 'TAGS' },
      { id: 'createdAt', title: 'CREATED AT' },
    ]
  });

  const records = tasks.map(task => ({
    title: task.title,
    description: task.description || '',
    priority: task.priority,
    status: task.status,
    dueDate: new Date(task.dueDate).toISOString().split('T')[0],
    tags: task.tags ? task.tags.join(', ') : '',
    createdAt: new Date(task.createdAt).toISOString().split('T')[0]
  }));

  return csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
};

const exportToPdf = (tasks, res) => {
  const doc = new PDFDocument({ margin: 50 });

  // Stream directly to the response
  doc.pipe(res);

  // PDF Header Setup
  doc.fontSize(22).fillColor('#4f46e5').text('TaskFlow - Task Report', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor('#64748b').text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
  doc.moveDown();
  doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#cbd5e1').stroke();
  doc.moveDown();

  if (tasks.length === 0) {
    doc.moveDown(2);
    doc.fontSize(14).fillColor('#64748b').text('No tasks recorded for this report.', { align: 'center' });
  } else {
    tasks.forEach((task, index) => {
      // Keep sections together
      doc.fontSize(12).fillColor('#1e293b').text(`${index + 1}. ${task.title}`, { style: 'bold' });
      doc.moveDown(0.2);

      // Metadata
      doc.fontSize(9).fillColor('#475569')
         .text('Status: ', { continued: true }).fillColor('#0f172a').text(`${task.status}   |   `, { continued: true })
         .fillColor('#475569').text('Priority: ', { continued: true })
         .fillColor(task.priority === 'High' ? '#ef4444' : task.priority === 'Medium' ? '#f59e0b' : '#3b82f6')
         .text(`${task.priority}   |   `, { continued: true })
         .fillColor('#475569').text('Due Date: ', { continued: true })
         .fillColor('#0f172a').text(`${new Date(task.dueDate).toLocaleDateString()}`);
      doc.moveDown(0.3);

      // Description
      if (task.description) {
        doc.fontSize(9).fillColor('#64748b').text(task.description);
        doc.moveDown(0.3);
      }

      // Tags
      if (task.tags && task.tags.length > 0) {
        doc.fontSize(8).fillColor('#6366f1').text(`Tags: ${task.tags.join(', ')}`);
      }

      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#f1f5f9').stroke();
      doc.moveDown(0.5);
    });
  }

  doc.end();
};

module.exports = {
  exportToCsv,
  exportToPdf
};
