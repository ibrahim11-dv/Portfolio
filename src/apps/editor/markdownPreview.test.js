import test from 'node:test';
import assert from 'node:assert/strict';
import { parseInlineTokens, parseMarkdownBlocks } from './markdownPreview.js';

test('parseMarkdownBlocks extracts headings, lists, code blocks and paragraphs', () => {
  const sample = '# Titre\n\nParagraphe d’introduction.\n\n- Premier point\n- Second point\n\n```js\nconst x = 1;\n```';
  const blocks = parseMarkdownBlocks(sample);
  assert.deepEqual(blocks, [
    { type: 'h1', content: 'Titre' },
    { type: 'p', content: 'Paragraphe d’introduction.' },
    { type: 'ul', items: ['Premier point', 'Second point'] },
    { type: 'code', lang: 'js', content: 'const x = 1;' },
  ]);
});

test('parseInlineTokens parses bold, inline code and external links safely', () => {
  const tokens = parseInlineTokens('Texte **important** avec `npm test` et [GitHub](https://github.com/ichehlafi)');
  assert.equal(tokens.some((token) => token.type === 'strong' && token.value === 'important'), true);
  assert.equal(tokens.some((token) => token.type === 'code' && token.value === 'npm test'), true);
  assert.equal(tokens.some((token) => token.type === 'link' && token.label === 'GitHub'), true);
});
