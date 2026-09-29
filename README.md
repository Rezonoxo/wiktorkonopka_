# Portfolio fotograficzne

Statyczna strona portfolio fotograficznego. Stronę publiczną publikuje GitHub Pages, a zdjęciami zarządza się przez panel działający lokalnie na komputerze.

## Wymagania

- Node.js 22 lub nowszy
- Python 3

## Uruchomienie panelu

```powershell
npm ci
npm run manager
```

Pierwsze polecenie instaluje zależności projektu; wykonuj je ponownie po zmianie `package-lock.json`. Drugie uruchamia lokalny panel i otwiera go w przeglądarce.

W panelu możesz:

- dodawać zdjęcia JPG, PNG i WebP, wybierając je lub przeciągając do panelu;
- zmieniać nazwy zdjęć;
- usuwać zdjęcia z galerii. Usunięte pliki są przenoszone do `photos/.trash/`, a nie kasowane na stałe;
- otworzyć podgląd strony przed publikacją.

Panel jest lokalnym narzędziem administracyjnym. Nie publikuj go i nie udostępniaj serwera panelu w internecie.

## Zdjęcia i galeria

Pliki źródłowe galerii znajdują się w `photos/`. Panel po dodaniu, zmianie nazwy lub usunięciu zdjęcia sam aktualizuje galerię. Jeśli dodajesz albo zmieniasz pliki bezpośrednio w tym folderze, uruchom:

```powershell
npm run check:config
npm run build:gallery
```

Generator tworzy manifest i miniatury WebP w `dist/gallery/`. Ten folder jest wynikiem budowania i nie trzeba edytować go ręcznie. Pliki strony, skrypty i style w pozostałej części `dist/` są wykorzystywane przez witrynę.

Ustawienia liczby kolumn i odstępów między zdjęciami zmienisz w `gallery.config.json`.

## Publikacja

1. Dodaj zdjęcia i potrzebne zmiany do repozytorium Git.
2. Wypchnij commit na gałąź `main`.
3. W ustawieniach repozytorium GitHub otwórz **Settings → Pages** i ustaw źródło publikacji na **GitHub Actions**.
4. Sprawdź przebieg na karcie **Actions**. Po poprawnym zakończeniu adres strony znajdziesz w szczegółach wdrożenia albo w **Settings → Pages**.

Workflow z `.github/workflows/deploy-pages.yml` sprawdza konfigurację, buduje galerię i publikuje stronę po każdym pushu do `main`. Można go też uruchomić ręcznie przez **Actions → Build and deploy gallery → Run workflow**.

Do publicznej paczki trafiają strona, zdjęcia i wygenerowana galeria. Panel, skrypty budujące i zależności pozostają poza publikacją. Przed udostępnieniem strony dodaj zdjęcia do `photos/` oraz zastąp przykładowe linki społecznościowe w stopkach właściwymi profilami.