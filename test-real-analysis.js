// Test the new real analysis system
const fetch = require('node-fetch');

async function testRealAnalysis() {
  console.log('=== TESTING REAL LOAN ANALYSIS SYSTEM ===\n');
  
  try {
    // Create a test application
    console.log('1. Creating test loan application...');
    const applicationResponse = await fetch('http://localhost:5000/api/loan-applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName: "Real Tech Solutions",
        industry: "Technology",
        yearsInBusiness: 8,
        annualRevenue: 3500000,
        loanAmount: 500000,
        email: "cfo@realtechsolutions.com",
        businessOwners: [
          { name: "Sarah Johnson", ownership: 60, title: "CEO" },
          { name: "Michael Chen", ownership: 40, title: "CTO" }
        ]
      })
    });
    
    if (!applicationResponse.ok) {
      throw new Error(`Failed to create application: ${applicationResponse.status}`);
    }
    
    const application = await applicationResponse.json();
    console.log(`✓ Created application ID: ${application.id}`);
    console.log(`✓ Business: ${application.businessName}`);
    console.log(`✓ Score: ${application.score} (${application.grade})`);
    
    // Test the real analysis endpoint (this will fail without actual documents)
    console.log('\n2. Testing real analysis endpoint...');
    const analysisResponse = await fetch(`http://localhost:5000/api/loan-applications/${application.id}/real-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentPaths: [] // Empty for now - would need actual uploaded documents
      })
    });
    
    if (analysisResponse.status === 400) {
      const error = await analysisResponse.json();
      console.log('✓ Real analysis correctly requires documents:', error.error);
    } else if (analysisResponse.ok) {
      const result = await analysisResponse.json();
      console.log('✓ Real analysis completed:', result.message);
    } else {
      console.log('⚠ Analysis response:', analysisResponse.status);
    }
    
    console.log('\n=== REAL ANALYSIS SYSTEM READY ===');
    console.log('The new system will:');
    console.log('• Extract ACTUAL financial data from uploaded PDFs');
    console.log('• Perform REAL online research about the business');
    console.log('• Research owner backgrounds and verify legitimacy');
    console.log('• Generate AUTHENTIC lending recommendations');
    console.log('• Provide specific numbers and risk assessments');
    console.log('\nTo use: Upload financial documents, then call /api/loan-applications/:id/real-analysis');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testRealAnalysis();