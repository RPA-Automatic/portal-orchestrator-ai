// Runs before the app paints; external file is compatible with script-src 'self'.
(function () {
  var preference = 'system';
  try {
    var saved = localStorage.getItem('rpa-automatic-theme');
    if (saved === 'light' || saved === 'dark') preference = saved;
  } catch (_) { /* Storage may be disabled by the browser. */ }
  var theme = preference === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : preference;
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#0b1120' : '#f5f7fc';
})();
