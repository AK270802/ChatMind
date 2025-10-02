#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class TestRunner {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      suites: {},
      duration: 0
    };
    this.startTime = Date.now();
  }

  async runAllTests() {
    console.log('🚀 Starting comprehensive test suite...\n');

    // Run server-side tests
    await this.runServerTests();

    // Run client-side tests
    await this.runClientTests();

    // Run integration tests
    await this.runIntegrationTests();

    // Run E2E tests
    await this.runE2ETests();

    // Generate report
    this.generateReport();
  }

  async runServerTests() {
    console.log('📦 Running Server-Side Tests...');
    console.log('=====================================');

    const testFiles = [
      'server/__tests__/services/compliance.test.ts',
      'server/__tests__/services/aiAnalysis.test.ts',
      'server/__tests__/services/csvParser.test.ts',
      'server/__tests__/routes/main.test.ts',
      'server/__tests__/routes/auth.test.ts',
      'server/__tests__/routes/compliance.test.ts',
      'server/__tests__/routes/security.test.ts',
      'server/__tests__/middleware/compliance.test.ts',
      'server/__tests__/middleware/security.test.ts',
      'server/__tests__/middleware/auth.test.ts'
    ];

    for (const testFile of testFiles) {
      if (fs.existsSync(testFile)) {
        await this.runTestFile(testFile, 'server');
      } else {
        console.log(`⚠️  Test file not found: ${testFile}`);
      }
    }

    console.log('');
  }

  async runClientTests() {
    console.log('🎨 Running Client-Side Tests...');
    console.log('=====================================');

    const testFiles = [
      'client/src/__tests__/components/TradeJournal.test.tsx',
      'client/src/__tests__/components/Dashboard.test.tsx',
      'client/src/__tests__/components/Analysis.test.tsx',
      'client/src/__tests__/hooks/useTrades.test.ts',
      'client/src/__tests__/hooks/useAIAnalysis.test.ts',
      'client/src/__tests__/hooks/useUsers.test.ts'
    ];

    for (const testFile of testFiles) {
      if (fs.existsSync(testFile)) {
        await this.runTestFile(testFile, 'client');
      } else {
        console.log(`⚠️  Test file not found: ${testFile}`);
      }
    }

    console.log('');
  }

  async runIntegrationTests() {
    console.log('🔗 Running Integration Tests...');
    console.log('=====================================');

    const testFiles = [
      'server/__tests__/integration/api.test.ts',
      'server/__tests__/integration/auth.test.ts',
      'server/__tests__/integration/compliance.test.ts',
      'server/__tests__/integration/security.test.ts'
    ];

    for (const testFile of testFiles) {
      if (fs.existsSync(testFile)) {
        await this.runTestFile(testFile, 'integration');
      } else {
        console.log(`⚠️  Test file not found: ${testFile}`);
      }
    }

    console.log('');
  }

  async runE2ETests() {
    console.log('🌐 Running End-to-End Tests...');
    console.log('=====================================');

    const testFiles = [
      'client/src/__tests__/e2e/app.test.tsx'
    ];

    for (const testFile of testFiles) {
      if (fs.existsSync(testFile)) {
        await this.runTestFile(testFile, 'e2e');
      } else {
        console.log(`⚠️  Test file not found: ${testFile}`);
      }
    }

    console.log('');
  }

  async runTestFile(testFile, category) {
    return new Promise((resolve) => {
      console.log(`📝 Running ${testFile}...`);

      const startTime = Date.now();
      const child = spawn('npx', ['jest', testFile, '--verbose', '--no-coverage'], {
        stdio: 'pipe',
        shell: true
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        const duration = Date.now() - startTime;
        const success = code === 0;

        if (!this.results.suites[category]) {
          this.results.suites[category] = {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            tests: []
          };
        }

        // Parse results
        const testResults = this.parseTestOutput(stdout, stderr);
        
        this.results.suites[category].total += testResults.total;
        this.results.suites[category].passed += testResults.passed;
        this.results.suites[category].failed += testResults.failed;
        this.results.suites[category].skipped += testResults.skipped;
        this.results.suites[category].tests.push({
          file: testFile,
          ...testResults,
          duration
        });

        this.results.total += testResults.total;
        this.results.passed += testResults.passed;
        this.results.failed += testResults.failed;
        this.results.skipped += testResults.skipped;

        if (success) {
          console.log(`✅ ${testFile} - ${testResults.passed} passed (${duration}ms)`);
        } else {
          console.log(`❌ ${testFile} - ${testResults.failed} failed (${duration}ms)`);
          if (stderr) {
            console.log(`   Error: ${stderr.trim()}`);
          }
        }

        resolve();
      });
    });
  }

  parseTestOutput(stdout, stderr) {
    const lines = stdout.split('\n');
    let total = 0;
    let passed = 0;
    let failed = 0;
    let skipped = 0;

    // Simple parsing - in real implementation, you'd want more sophisticated parsing
    for (const line of lines) {
      if (line.includes('Test Suites:')) {
        const match = line.match(/(\d+)\s+passed/);
        if (match) passed += parseInt(match[1]);
        
        const failedMatch = line.match(/(\d+)\s+failed/);
        if (failedMatch) failed += parseInt(failedMatch[1]);
        
        const skippedMatch = line.match(/(\d+)\s+skipped/);
        if (skippedMatch) skipped += parseInt(skippedMatch[1]);
      }
      
      if (line.includes('Tests:')) {
        const match = line.match(/(\d+)\s+passed/);
        if (match) total += parseInt(match[1]);
      }
    }

    return { total, passed, failed, skipped };
  }

  generateReport() {
    this.results.duration = Date.now() - this.startTime;

    console.log('📊 Test Results Summary');
    console.log('======================');
    console.log(`Total Duration: ${this.results.duration}ms`);
    console.log(`Total Tests: ${this.results.total}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`⏭️  Skipped: ${this.results.skipped}`);
    console.log('');

    // Detailed results by category
    for (const [category, results] of Object.entries(this.results.suites)) {
      console.log(`${category.toUpperCase()} Tests:`);
      console.log(`  Total: ${results.total}`);
      console.log(`  Passed: ${results.passed}`);
      console.log(`  Failed: ${results.failed}`);
      console.log(`  Skipped: ${results.skipped}`);
      console.log('');

      // Individual test results
      for (const test of results.tests) {
        const status = test.failed > 0 ? '❌' : '✅';
        console.log(`  ${status} ${test.file} (${test.duration}ms)`);
        if (test.failed > 0) {
          console.log(`     Failed: ${test.failed}`);
        }
      }
      console.log('');
    }

    // Generate HTML report
    this.generateHTMLReport();

    // Exit with appropriate code
    if (this.results.failed > 0) {
      console.log('❌ Some tests failed!');
      process.exit(1);
    } else {
      console.log('🎉 All tests passed!');
      process.exit(0);
    }
  }

  generateHTMLReport() {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Results Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .summary-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .summary-card h3 {
            margin: 0 0 10px 0;
            color: #333;
        }
        .summary-card .value {
            font-size: 24px;
            font-weight: bold;
        }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .skipped { color: #ffc107; }
        .category {
            margin-bottom: 30px;
        }
        .category h2 {
            color: #333;
            border-bottom: 2px solid #007bff;
            padding-bottom: 10px;
        }
        .test-item {
            background: #f8f9fa;
            padding: 15px;
            margin: 10px 0;
            border-radius: 4px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .test-item.failed {
            background: #f8d7da;
            border-left: 4px solid #dc3545;
        }
        .test-item.passed {
            background: #d4edda;
            border-left: 4px solid #28a745;
        }
        .test-info {
            flex: 1;
        }
        .test-status {
            font-size: 20px;
            margin-right: 10px;
        }
        .test-duration {
            color: #666;
            font-size: 14px;
        }
        .timestamp {
            text-align: center;
            color: #666;
            margin-top: 30px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Test Results Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
        </div>

        <div class="summary">
            <div class="summary-card">
                <h3>Total Duration</h3>
                <div class="value">${this.results.duration}ms</div>
            </div>
            <div class="summary-card">
                <h3>Total Tests</h3>
                <div class="value">${this.results.total}</div>
            </div>
            <div class="summary-card">
                <h3>Passed</h3>
                <div class="value passed">${this.results.passed}</div>
            </div>
            <div class="summary-card">
                <h3>Failed</h3>
                <div class="value failed">${this.results.failed}</div>
            </div>
            <div class="summary-card">
                <h3>Skipped</h3>
                <div class="value skipped">${this.results.skipped}</div>
            </div>
        </div>

        ${Object.entries(this.results.suites).map(([category, results]) => `
            <div class="category">
                <h2>${category.toUpperCase()} Tests</h2>
                <div class="summary">
                    <div class="summary-card">
                        <h3>Total</h3>
                        <div class="value">${results.total}</div>
                    </div>
                    <div class="summary-card">
                        <h3>Passed</h3>
                        <div class="value passed">${results.passed}</div>
                    </div>
                    <div class="summary-card">
                        <h3>Failed</h3>
                        <div class="value failed">${results.failed}</div>
                    </div>
                    <div class="summary-card">
                        <h3>Skipped</h3>
                        <div class="value skipped">${results.skipped}</div>
                    </div>
                </div>
                
                ${results.tests.map(test => `
                    <div class="test-item ${test.failed > 0 ? 'failed' : 'passed'}">
                        <div class="test-status">${test.failed > 0 ? '❌' : '✅'}</div>
                        <div class="test-info">
                            <div>${test.file}</div>
                            <div class="test-duration">${test.duration}ms</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `).join('')}

        <div class="timestamp">
            Report generated at ${new Date().toISOString()}
        </div>
    </div>
</body>
</html>
    `;

    fs.writeFileSync('test-results.html', html);
    console.log('📄 HTML report generated: test-results.html');
  }
}

// Run the test suite
if (require.main === module) {
  const runner = new TestRunner();
  runner.runAllTests().catch(console.error);
}

module.exports = TestRunner;
