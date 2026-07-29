async function renderMermaidBlocks() {
  const blocks = Array.from(
    document.querySelectorAll<HTMLElement>('pre > code.language-mermaid')
  );

  if (!blocks.length) {
    return;
  }

  const { default: mermaid } = await import('mermaid');

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'base',
    themeVariables: {
      background: '#fffdf8',
      primaryColor: '#e7f3f1',
      primaryTextColor: '#111827',
      primaryBorderColor: '#0f766e',
      lineColor: '#64625d',
      secondaryColor: '#fff7ed',
      tertiaryColor: '#f7f4ee',
      fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
    }
  });

  await Promise.all(
    blocks.map(async (block, index) => {
      const source = block.textContent?.trim();
      const pre = block.parentElement;

      if (!source || !pre || pre.dataset.mermaidRendered === 'true') {
        return;
      }

      pre.dataset.mermaidRendered = 'true';
      pre.classList.add('mermaid-block');

      try {
        const { svg } = await mermaid.render(`mermaid-${index}`, source);
        const figure = document.createElement('figure');
        figure.className = 'mermaid-diagram';
        figure.innerHTML = svg;
        pre.replaceWith(figure);
      } catch (error) {
        pre.classList.add('mermaid-error');
        console.error('Failed to render Mermaid diagram', error);
      }
    })
  );
}

renderMermaidBlocks();
