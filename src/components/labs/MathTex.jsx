import katex from 'katex';
import 'katex/dist/katex.min.css';

// Renders a KaTeX expression. Content is authored in-repo (src/labs/*/content.js), never user input.
export default function MathTex({ tex, display = false }) {
  const html = katex.renderToString(tex, { displayMode: display, throwOnError: false, strict: 'ignore', output: 'htmlAndMathml' });
  const Tag = display ? 'div' : 'span';
  return <Tag className={display ? 'lab-math-display' : 'lab-math-inline'} dangerouslySetInnerHTML={{ __html: html }} />;
}
