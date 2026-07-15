document.addEventListener('DOMContentLoaded', () => {
  for (const link of document.querySelectorAll('a[href^="https://www.nexotoken.net"]')) {
    link.setAttribute('rel', 'noopener noreferrer');
  }

  window.setTimeout(() => {
    for (const id of ['busuanzi_site_uv', 'busuanzi_site_pv']) {
      const value = document.getElementById(id);
      if (value?.textContent?.trim() === '统计中') {
        value.textContent = '--';
      }
    }
  }, 6000);
});
