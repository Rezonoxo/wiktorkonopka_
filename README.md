# Portfolio fotograficzne

Statyczna strona portfolio jest publikowana przez GitHub Pages. Panel do zarządzania zdjęciami działa lokalnie i nie jest częścią publicznej strony.

## Lokalna praca

Wymagane: Node.js 22 lub nowszy oraz Python 3.

```powershell
npm ci
npm run check:config
npm run build:gallery
npm run manager
```

Panel pozwala dodawać, zmieniać nazwy i usuwać zdjęcia. Pliki źródłowe galerii umieszczaj w `photos/`; wygenerowane miniatury i manifest w `dist/gallery/` są tworzone automatycznie.

## Publikacja

Workflow z `.github/workflows/deploy-pages.yml` buduje galerię i publikuje stronę po każdym pushu do gałęzi `main`. W ustawieniach repozytorium GitHub otwórz **Settings → Pages** i ustaw źródło publikacji na **GitHub Actions**. Możesz też uruchomić workflow ręcznie na karcie **Actions**.

Do publicznej paczki trafiają strona, zdjęcia i wygenerowana galeria. Panel, skrypty budujące i zależności pozostają poza publikacją.