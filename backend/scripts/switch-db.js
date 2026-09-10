const fs = require('fs');
const path = require('path');

const target = process.argv[2] || 'sqlite';
const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const pgSchemaPath = path.join(__dirname, '..', 'prisma', 'schema.postgresql.prisma');

if (target === 'postgres' || target === 'postgresql') {
  if (fs.existsSync(pgSchemaPath)) {
    fs.copyFileSync(pgSchemaPath, schemaPath);
    console.log('Switched prisma/schema.prisma to PostgreSQL provider.');
  }
} else {
  let content = fs.readFileSync(schemaPath, 'utf8');
  content = content.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
  fs.writeFileSync(schemaPath, content, 'utf8');
  console.log('Switched prisma/schema.prisma to SQLite provider.');
}
