import PDFDocument from 'pdfkit';
import fs from 'fs';

async function testPdfGeneration() {
  console.log('Starting PDF generation test...');
  
  try {
    // Method 1: Direct pipe to file (original method)
    console.log('Testing direct pipe method...');
    const doc1 = new PDFDocument();
    const outputStream1 = fs.createWriteStream('direct-pipe-test.pdf');
    
    doc1.pipe(outputStream1);
    
    doc1.fontSize(25).text('Direct Pipe Test PDF', 100, 100);
    doc1.end();
    
    // Method 2: Buffer collection method (our new approach)
    console.log('Testing buffer collection method...');
    const doc2 = new PDFDocument();
    const chunks = [];
    
    doc2.on('data', chunk => chunks.push(chunk));
    
    doc2.fontSize(25).text('Buffer Collection Test PDF', 100, 100);
    
    await new Promise((resolve) => {
      doc2.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        fs.writeFileSync('buffer-test.pdf', pdfBuffer);
        console.log(`Buffer method PDF size: ${pdfBuffer.length} bytes`);
        resolve();
      });
      doc2.end();
    });
    
    console.log('PDF generation test completed successfully!');
    return true;
  } catch (error) {
    console.error('Error in PDF generation test:', error);
    return false;
  }
}

testPdfGeneration()
  .then(success => {
    console.log(`Test ${success ? 'succeeded' : 'failed'}`);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
  });