function initTabs() {
  const buttons    = document.querySelectorAll('.tab-btn');
  const panels     = document.querySelectorAll('.tab-panel');
  const seasonInfo = document.getElementById('season-info');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;

      buttons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      panels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      document.getElementById(`tab-${tab}`).classList.add('active');

      seasonInfo.style.display = tab === 'availability' ? '' : 'none';
    });
  });
}

document.addEventListener('DOMContentLoaded', initTabs);
