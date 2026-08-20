# Królestwa Pogranicza — Adventure + Town v1

Przeglądarkowy prototyp turowej strategii fantasy inspirowanej klasycznymi grami strategicznymi. Projekt korzysta z własnego UI i nie zawiera plików ani grafik z Heroes of Might and Magic III.

## Uruchomienie

Najlepiej uruchomić lokalny serwer:

```bash
python -m http.server 8080
```

Główne wejścia:
- `adventure.html` — mapa przygody i główna pętla gry,
- `town.html?town=castle-haven` — Zamek,
- `town.html?town=necropolis-morrow` — Nekropolia,
- `index.html` — Combat v5; bez aktywnej kampanii nadal działa jako samodzielna walka demonstracyjna.

## Adventure v1

- autorska mapa 32 × 32 na kwadratowej siatce,
- ruch bohatera w 8 kierunkach, punkty ruchu, teren i drogi,
- ważone A* oraz blokada przecinania niedostępnych rogów,
- mgła wojny: pola ukryte, odkryte i aktualnie widoczne,
- kalendarz Miesiąc / Tydzień / Dzień,
- minimapa, planowanie trasy oraz podział trasy na bieżący i kolejny dzień,
- neutralne armie uruchamiające Combat v5,
- zachowanie strat i częściowego HP stosów po powrocie z bitwy,
- skrzynie, stosy zasobów, przejmowane struktury produkcyjne i cel scenariusza: Opuszczona Kopalnia Złota.

## Siedem surowców

Ekonomia od początku obsługuje:
- Kamień,
- Drewno,
- Rtęć,
- Siarkę,
- Klejnoty,
- Złoto,
- Grzyby Dusz.

Przejęte struktury generują dochód przy zakończeniu każdego dnia:
- Kamieniołom: +2 Kamienia,
- Tartak: +2 Drewna,
- Alchemiczna Cysterna: +1 Rtęci,
- Kopalnia Siarki: +1 Siarki,
- Kopalnia Klejnotów: +1 Klejnot,
- Kopalnia Złota: +1000 Złota,
- Gaj Grzybów Dusz: +1 Grzyb Dusz.

## Town v1 — dwie frakcje

### Zamek

Główna ekonomia: Drewno, Kamień, Klejnoty i Złoto.

Grywalne siedliska poziomów 1–4:
1. Milicjant,
2. Kusznik,
3. Giermek,
4. Gryfi Strażnik.

Dane drzewa zawierają także Kapłana Światła, Rycerza oraz poziom 7: **Paladyn — jednostka 2-hex na koniu bojowym**.

### Nekropolia

Główny unikalny zasób: Grzyby Dusz; często używa również Kamienia, Rtęci i Złota.

Grywalne siedliska poziomów 1–4:
1. Szkielet,
2. Kościany Łucznik,
3. Strażnik Grobowca,
4. Widmowy Jeździec.

Dane drzewa zawierają także Lisza, Wampirzego Lorda oraz poziom 7: **Arcymag Nekromancji**.

Nekropolia posiada Nekromancję: po zwycięstwie może tworzyć Szkielety z części pokonanych modeli, przy czym Grzyby Dusz ograniczają maksymalną liczbę wskrzeszonych.

## Miasta

- jedna nowa budowa w każdym mieście na dzień,
- zależności pomiędzy budynkami i koszty w siedmiu zasobach,
- tygodniowy przyrost jednostek w zbudowanych siedliskach,
- niewykupione jednostki kumulują się,
- rekrutacja za zasoby,
- armia bohatera: maksymalnie 7 stosów,
- garnizon miasta: 7 stosów,
- transfer całych stosów bohater ↔ garnizon z automatycznym łączeniem tego samego typu,
- budynki ekonomiczne produkujące dzienny dochód,
- Grzybnia Umarłych: +1 Grzyb Dusz dziennie.

## Combat v5

- pole bitwy 15 × 11 heksów,
- inicjatywa, kontratak, strzelanie i SI,
- bohaterowie, mana, czary, Czekaj i Obrona,
- jednostki 2-hex z orientacją,
- przeszkody i pathfinding całego footprintu,
- morale oraz szczęście,
- Adventure przekazuje do Combat aktualną armię bohatera i po walce odbiera rzeczywiste straty.

## Moduły

- `adventure-core.js` — koszty ruchu, A*, kalendarz i widoczność,
- `game-state.js` — trwały stan kampanii i ekonomia,
- `maps/adventure-v1-map.js` — dane pierwszego scenariusza,
- `adventure.js` — ekran mapy przygody,
- `town-core.js` — dane i reguły Zamku/Nekropolii,
- `town.js` — ekran miasta,
- `battle-bridge.js` — połączenie Adventure z Combat v5,
- `combat-core.js`, `battlefield-core.js`, `game.js`, `combat-v4.js`, `combat-v5.js` — istniejący silnik walki.

## Testy

Pełny zestaw testów repozytorium:

```bash
node --test tests/*.test.js
```

Kontrola składni nowych modułów:

```bash
node --check adventure-core.js
node --check game-state.js
node --check town-core.js
node --check adventure.js
node --check town.js
node --check battle-bridge.js
```

## Assety

Dotychczasowe assety walki pozostają CC0 z OpenGameArt. Mapa przygody i Town v1 używają obecnie własnego CSS, prostych symboli i istniejących darmowych assetów pomocniczych — bez kopiowania oprawy H3 1:1.
