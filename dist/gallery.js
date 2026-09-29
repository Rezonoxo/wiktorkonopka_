(async () => {
  const gallery = document.getElementById('photo-gallery');
  const ready = () => document.documentElement.classList.add('gallery-ready');
  const alt = name => name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');

  try {
    const [config, manifest] = await Promise.all([
      fetch('gallery.config.json').then(response => response.json()),
      fetch('dist/gallery/gallery.json').then(response => response.json())
    ]);
    const layout = config.layout || {};
    gallery.style.setProperty('--desktop-columns', layout.desktopColumns || 3);
    gallery.style.setProperty('--tablet-columns', layout.tabletColumns || 2);
    gallery.style.setProperty('--mobile-columns', layout.mobileColumns || 1);
    gallery.style.setProperty('--gallery-gap', `${layout.gap ?? 12}px`);

    if (!manifest.images.length) {
      gallery.innerHTML = '<p class="gallery-empty">Nie dodano jeszcze żadnych zdjęć.</p>';
    } else {
      gallery.replaceChildren(...manifest.images.map(photo => {
        const link = document.createElement('a');
        link.className = 'gallery-card';
        link.href = photo.original;
        link.dataset.fancybox = 'gallery';
        const image = document.createElement('img');
        image.src = photo.sources[1].src;
        image.srcset = photo.sources.map(source => `${source.src} ${source.width}w`).join(', ');
        image.sizes = '(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw';
        image.width = photo.width;
        image.height = photo.height;
        image.loading = 'lazy';
        image.alt = alt(photo.name);
        link.append(image);
        return link;
      }));
      if (window.Fancybox) Fancybox.bind('[data-fancybox="gallery"]', {});
    }
  } catch {
    gallery.innerHTML = '<p class="gallery-empty">Galeria jest przygotowywana. Spróbuj ponownie za chwilę.</p>';
  }

  ready();
})();
