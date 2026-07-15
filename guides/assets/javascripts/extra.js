document.addEventListener('DOMContentLoaded', () => {
  for (const link of document.querySelectorAll('a[href^="https://www.nexotoken.net"]')) {
    link.setAttribute('rel', 'noopener noreferrer');
  }
});
