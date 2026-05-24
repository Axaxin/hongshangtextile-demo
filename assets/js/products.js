export function matchesCategory(cardCategory, selectedCategory) {
  return selectedCategory === 'all' || cardCategory === selectedCategory;
}

// DOM wiring — runs only in browser
if (typeof document !== 'undefined') {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const cards = document.querySelectorAll('.product-card');

  function applyFilter(selected) {
    cards.forEach(card => {
      card.style.display = matchesCategory(card.dataset.category, selected) ? '' : 'none';
    });
    tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === selected);
    });
  }

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => applyFilter(btn.dataset.category));
  });

  // Apply filter from URL query param on load (?cat=jacquard)
  const params = new URLSearchParams(location.search);
  const initial = params.get('cat') || 'all';
  applyFilter(initial);

  // Modal
  const backdrop = document.getElementById('modal-backdrop');
  let lastFocus = null;
  const modalImg = document.getElementById('modal-img');
  const modalCode = document.getElementById('modal-code');
  const modalName = document.getElementById('modal-name');
  const modalSpec = document.getElementById('modal-spec');
  const modalInquireBtn = document.getElementById('modal-inquire');

  if (backdrop) {
    document.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', e => {
        if (e.target.classList.contains('btn-inquire')) return;
        modalImg.src = card.querySelector('img').src;
        modalCode.textContent = card.dataset.code;
        modalName.textContent = card.dataset.name;
        modalSpec.textContent = card.dataset.spec;
        modalInquireBtn.href = `contact.html?product=${encodeURIComponent(card.dataset.code)}`;
        lastFocus = e.currentTarget;
        backdrop.classList.add('open');
        document.getElementById('modal-close').focus();
      });
    });

    document.getElementById('modal-close').addEventListener('click', () => {
      backdrop.classList.remove('open');
      if (lastFocus) lastFocus.focus();
    });

    backdrop.addEventListener('click', e => {
      if (e.target === backdrop) {
        backdrop.classList.remove('open');
        if (lastFocus) lastFocus.focus();
      }
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        backdrop.classList.remove('open');
        if (lastFocus) lastFocus.focus();
      }
    });
  }
}
