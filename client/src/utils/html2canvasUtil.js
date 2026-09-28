import html2canvas from 'html2canvas';

/**
 * Safe wrapper around html2canvas to sanitize modern CSS color functions
 * like oklch() and oklab() which break html2canvas's CSS parser.
 */
export const safeHtml2Canvas = async (element, options = {}) => {
  const { onclone: userOnClone, ...restOptions } = options;

  const defaultOptions = {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 1200,
    scrollX: 0,
    scrollY: 0,
    onclone: (clonedDoc, clonedElement) => {
      // 1. Sanitize all <style> elements in cloned document
      const styleElements = clonedDoc.querySelectorAll('style');
      styleElements.forEach(styleEl => {
        if (styleEl.textContent && (styleEl.textContent.includes('oklch') || styleEl.textContent.includes('oklab'))) {
          styleEl.textContent = styleEl.textContent
            .replace(/oklch\([^)]+\)/gi, '#475569')
            .replace(/oklab\([^)]+\)/gi, '#475569');
        }
      });

      // 2. Sanitize any inline style attributes with oklch/oklab
      const allNodes = clonedDoc.querySelectorAll('*');
      allNodes.forEach(node => {
        const styleAttr = node.getAttribute && node.getAttribute('style');
        if (styleAttr && (styleAttr.includes('oklch') || styleAttr.includes('oklab'))) {
          node.setAttribute('style', styleAttr.replace(/oklch\([^)]+\)/gi, '#475569').replace(/oklab\([^)]+\)/gi, '#475569'));
        }
      });

      // Call user's custom onclone callback if provided
      if (typeof userOnClone === 'function') {
        userOnClone(clonedDoc, clonedElement);
      }
    },
    ...restOptions
  };

  return await html2canvas(element, defaultOptions);
};
