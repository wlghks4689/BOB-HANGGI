import fs from 'node:fs';
import path from 'node:path';

const file = path.resolve('src/data/valueQuestions.ts');
const source = fs.readFileSync(file, 'utf8');
const ids = [...source.matchAll(/id: '([^']+)', category:/g)].map((match) => match[1]);
const categories = [...source.matchAll(/category: '(values|lifestyle|love)'/g)].map((match) => match[1]);

if (ids.length !== 20) throw new Error(`Expected 20 questions, found ${ids.length}`);
if (new Set(ids).size !== ids.length) throw new Error('Question ids must be unique');

const counts = categories.reduce((result, category) => {
  result[category] = (result[category] ?? 0) + 1;
  return result;
}, {});

const expected = { values: 5, lifestyle: 8, love: 7 };
for (const [category, count] of Object.entries(expected)) {
  if (counts[category] !== count) {
    throw new Error(`Expected ${count} ${category} questions, found ${counts[category] ?? 0}`);
  }
}

console.log(`Validated ${ids.length} unique questions`, counts);
