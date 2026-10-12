(() => {
  const row = document.querySelector('.book-row');
  const group = document.querySelector('.top-books');
  const books = [...row.querySelectorAll('.book')];
  const touchOnly = matchMedia('(hover: none)').matches;
  let hoverTimer;
  let cueTimer;
  let touchArmed = false;

  if (touchOnly) document.documentElement.classList.add('touch-device');

  function closeBooks() {
    books.forEach(book => {
      book.classList.remove('is-open', 'show-cue');
      book.setAttribute('aria-expanded', 'false');
    });
    group.style.removeProperty('--mobile-spread-shift');
  }

  function openBook(book) {
    clearTimeout(cueTimer);
    books.forEach(item => {
      const selected = item === book;
      item.classList.toggle('is-open', selected);
      if (!selected) item.classList.remove('show-cue');
      item.setAttribute('aria-expanded', String(selected));
    });
    const mobile = matchMedia('(max-width: 700px)').matches;
    const expandedBy = mobile ? (window.innerWidth <= 390 ? 78 : 80) : 79;
    group.style.setProperty('--mobile-spread-shift', mobile ? `${expandedBy / 2}px` : '0px');
  }

  books.forEach(book => {
    book.addEventListener('pointerdown', event => {
      touchArmed = event.pointerType === 'touch';
      if (touchArmed) setTimeout(() => { touchArmed = false; }, 1000);
    });
    book.addEventListener('pointerenter', event => {
      if (event.pointerType === 'touch') return;
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => openBook(book), 80);
    });
    book.addEventListener('focus', () => { if (!touchArmed) openBook(book); });
    book.addEventListener('click', event => {
      if (touchOnly && event.detail !== 0 && !book.classList.contains('is-open')) {
        event.preventDefault();
        openBook(book);
        book.classList.add('show-cue');
        clearTimeout(cueTimer);
        cueTimer = setTimeout(() => book.classList.remove('show-cue'), 950);
      }
    });
  });

  row.addEventListener('pointerleave', event => {
    if (event.pointerType === 'touch') return;
    clearTimeout(hoverTimer);
    closeBooks();
  });
  row.addEventListener('focusout', event => {
    if (!row.contains(event.relatedTarget)) closeBooks();
  });
  row.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    closeBooks();
    books.find(book => book === document.activeElement)?.blur();
  });
})();
