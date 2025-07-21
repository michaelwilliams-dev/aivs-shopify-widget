import fs from 'fs';

let index = [];

export async function createIndex(embeddedChunks) {
  index = embeddedChunks;
}

export async function saveIndex(embeddedChunks) {
  fs.writeFileSync('vector_index.json', JSON.stringify(embeddedChunks));
}

export async function loadIndex() {
  if (fs.existsSync('vector_index.json')) {
    const raw = fs.readFileSync('vector_index.json');
    index = JSON.parse(raw);
    return index;
  }
  return [];
}

export async function searchIndex(queryEmbedding, topK = 3) {
  function cosineSim(a, b) {
    const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    return dot / (normA * normB);
  }

  const scored = index.map(item => ({
    text: item.text,
    score: cosineSim(item.embedding, queryEmbedding)
  }));

  return scored.sort((a, b) => b.score - a.score).slice(0, topK);
}