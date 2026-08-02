async function renderMermaidBlocks() {
  const blocks = Array.from(
    document.querySelectorAll<HTMLElement>('pre[data-language="mermaid"] > code, pre > code.language-mermaid'),
  ).filter((block) => block.parentElement?.dataset.mermaidRendered !== 'true');

  if (!blocks.length) {
    return;
  }

  // Mark blocks before loading Mermaid so HMR-triggered renders cannot process them twice.
  blocks.forEach((block) => {
    block.parentElement?.setAttribute('data-mermaid-rendered', 'true');
  });

  const { default: mermaid } = await import("mermaid");

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "strict",
    theme: "base",
    themeVariables: {
      background: "#ffffff",
      primaryColor: "#eef6f4",
      primaryTextColor: "#111827",
      primaryBorderColor: "#0f766e",
      lineColor: "#6b7280",
      secondaryColor: "#f8fafc",
      tertiaryColor: "#ffffff",
      fontSize: "14px",
      fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    },
    flowchart: {
      nodeSpacing: 28,
      rankSpacing: 32,
      padding: 10,
      useMaxWidth: true,
    },
  });

  await Promise.all(
    blocks.map(async (block, index) => {
      const source = block.textContent?.trim();
      const pre = block.parentElement;

      if (!source || !pre) {
        return;
      }

      pre.classList.add("mermaid-block");

      try {
        const { svg } = await mermaid.render(`mermaid-${index}`, source);
        const figure = document.createElement("figure");
        figure.className = "mermaid-diagram";
        figure.innerHTML = svg;
        pre.replaceWith(figure);
      } catch (error) {
        delete pre.dataset.mermaidRendered;
        pre.classList.add("mermaid-error");
        console.error("Failed to render Mermaid diagram", error);
      }
    }),
  );
}

renderMermaidBlocks();

new MutationObserver(() => {
  void renderMermaidBlocks();
}).observe(document.body, { childList: true, subtree: true });
