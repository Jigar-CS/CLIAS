const fs = require('fs');
const readline = require('readline');

async function main() {
  const fileStream = fs.createReadStream('C:\\Users\\ADMIN\\.gemini\\antigravity-ide\\brain\\3af2fbfb-9fdd-4284-ab11-2444102a9b60\\.system_generated\\logs\\transcript.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.includes('gateway01') || (line.includes('DATABASE_URL') && line.includes('tidb'))) {
      const match = line.match(/mysql:\/\/[^"'\s\\]+/);
      if (match) {
        console.log('FOUND DATABASE_URL:', match[0]);
      }
    }
  }
}

main().catch(console.error);
