const fs = require('fs').promises;
const path = require('path');

async function parseDecisionAlgo() {
  const rootDir = path.join(__dirname);
  const files = await fs.readdir(rootDir);
  const mdFiles = files.filter((file) => file.endsWith('.md'));
  const libraries = [];

  for (const fileName of mdFiles) {
    const filePath = path.join(rootDir, fileName);
    const raw = await fs.readFile(filePath, 'utf8');
    const lines = raw.split(/\r?\n/);

    const library = path.basename(fileName, '.md');
    let currentSection = null;
    let currentNode = null;
    const nodes = [];

    const flushNode = () => {
      if (currentNode) {
        currentNode.choices = currentNode.choices || [];
        currentNode.children = currentNode.children || [];
        currentNode.conditions = currentNode.conditions || [];
        nodes.push(currentNode);
      }
      currentNode = null;
    };

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        continue;
      }

      if (line.startsWith('## ')) {
        currentSection = line.slice(3).trim();
        continue;
      }

      if (line.startsWith('### ')) {
        flushNode();
        const heading = line.slice(4).trim();
        const idMatch = heading.match(/^([A-Za-z0-9_-]+)\.\s*(.*)$/);
        let id = heading;
        let title = heading;
        if (idMatch) {
          id = idMatch[1].trim();
          title = idMatch[2].trim();
        }
        const conditions = [];
        const ifMatch = title.match(/IF\s+`([^`]+)`/i);
        if (ifMatch) {
          conditions.push(ifMatch[1].trim());
        }

        currentNode = {
          id,
          library,
          section: currentSection,
          depth: 1,
          title,
          question: null,
          choices: [],
          children: [],
          conditions,
          source: fileName,
        };
        continue;
      }

      if (!currentNode) {
        continue;
      }

      if (line.startsWith('- `Q:`')) {
        const question = line.replace(/^- `Q:`\s*/i, '').trim();
        currentNode.question = question;
        continue;
      }

      if (line.startsWith('- `Choices:`') || line.startsWith('- `Choice:`')) {
        continue;
      }

      if (line.startsWith('- ') && line.includes('`IF `')) {
        const ifMatch = line.match(/IF\s+`([^`]+)`/i);
        if (ifMatch && !currentNode.conditions.includes(ifMatch[1].trim())) {
          currentNode.conditions.push(ifMatch[1].trim());
        }
        continue;
      }

      if (line.startsWith('- ') && !line.startsWith('- `')) {
        const maybeChoice = line.slice(2).trim();
        if (maybeChoice) {
          currentNode.choices.push(maybeChoice);
        }
        continue;
      }

      if (line.startsWith('---')) {
        continue;
      }
    }

    flushNode();
    libraries.push({ library, file: fileName, nodes });
  }

  const output = {
    generatedAt: new Date().toISOString(),
    summary: {
      libraryCount: libraries.length,
      nodeCount: libraries.reduce((sum, lib) => sum + lib.nodes.length, 0),
    },
    libraries,
  };

  const outputPath = path.join(rootDir, 'nodes.json');
  await fs.writeFile(outputPath, JSON.stringify(output, null, 2), 'utf8');
  console.log(`Parsed ${output.summary.nodeCount} nodes from ${output.summary.libraryCount} markdown files.`);
  console.log(`Output written to ${outputPath}`);
}

parseDecisionAlgo().catch((error) => {
  console.error(error);
  process.exit(1);
});
