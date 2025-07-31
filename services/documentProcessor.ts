
// A simple RAG (Retrieval-Augmented Generation) context retriever.
// In a real-world application, this would be a more sophisticated system,
// likely involving embedding generation and vector search.

const MAX_CONTEXT_LENGTH = 1500; // Characters
const MAX_CHUNKS = 3;

/**
 * Finds the most relevant chunks of text from a document based on a query.
 * @param query The user's question.
 * @param documentText The full text of the document.
 * @returns A string containing the most relevant context.
 */
export function findRelevantContext(query: string, documentText: string): string {
  // 1. Preprocess query and document
  const queryWords = new Set(query.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  
  // 2. Chunk the document (by paragraphs or sentences)
  const chunks = documentText.split(/\n\s*\n/).filter(p => p.trim() !== '');

  // 3. Score each chunk based on keyword overlap
  const scoredChunks = chunks.map(chunk => {
    const chunkWords = new Set(chunk.toLowerCase().split(/\s+/));
    let score = 0;
    for (const word of queryWords) {
      if (chunkWords.has(word)) {
        score++;
      }
    }
    return { chunk, score };
  });

  // 4. Sort chunks by score in descending order
  scoredChunks.sort((a, b) => b.score - a.score);

  // 5. Select the top N chunks, ensuring they are relevant (score > 0)
  const relevantChunks = scoredChunks.filter(c => c.score > 0);

  if (relevantChunks.length === 0) {
    // If no keywords match, return the beginning of the document as a fallback context.
    return documentText.slice(0, MAX_CONTEXT_LENGTH);
  }

  // 6. Combine the best chunks into a single context string
  let context = '';
  for (let i = 0; i < Math.min(relevantChunks.length, MAX_CHUNKS); i++) {
    const nextChunk = relevantChunks[i].chunk;
    if (context.length + nextChunk.length > MAX_CONTEXT_LENGTH) {
      break;
    }
    context += nextChunk + '\n\n';
  }
  
  return context.trim();
}
