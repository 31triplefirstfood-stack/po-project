const fs = require('fs');
const content = fs.readFileSync('d:/Workshop/po/src/components/pdf/CustomerOrderReportTemplate.tsx', 'utf8');
const lines = content.split('\n');
const line = lines[220]; // line 221
console.log('Line 221:', line);
for (let i = 0; i < line.length; i++) {
    console.log(line[i], line.charCodeAt(i));
}











