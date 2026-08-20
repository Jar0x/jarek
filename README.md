# Królestwa Pogranicza — Combat v5

Samodzielny prototyp HTML/CSS/JS turowej walki fantasy inspirowanej klasycznymi strategiami. Projekt nie zawiera plików z Heroes of Might and Magic III.

## Uruchomienie

Otwórz `index.html` albo uruchom lokalny serwer:

```bash
python -m http.server 8080
```

## Najważniejsze mechaniki

- pole bitwy 15 × 11 heksów,
- inicjatywa wg szybkości, kontrataki, jednostki dystansowe i taktyczne SI,
- bohaterowie, mana, księga czarów, Czekaj, Obrona i dziennik walki,
- pełne jednostki 2-hex z polem głównym, tylnym heksiem i orientacją lewo/prawo,
- wspólny dla gracza i SI pathfinding uwzględniający cały footprint jednostki,
- statyczne przeszkody terenowe: skały, pnie i ruiny,
- blokowanie ruchu oraz ustawienia przez przeszkody i oba heksy dużych jednostek,
- morale od -3 do +3: dodatnie może dać dodatkową akcję, ujemne może odebrać turę,
- szczęście od 0 do +3: udany test podwaja obrażenia fizyczne, ale nie obrażenia czarów,
- panel jednostki pokazujący rozmiar, kierunek, morale i szczęście,
- dwie testowe jednostki 2-hex: Kościany Behemot i Bagienny Kolos.

## Moduły

- `combat-core.js` — wspólna logika obrażeń, efektów, morale i szczęścia,
- `battlefield-core.js` — geometria heksów, footprinty, kolizje i pathfinding,
- `game.js` — bazowy przebieg bitwy i animacje,
- `combat-v4.js` — bohaterowie i magia,
- `combat-v5.js` — przeszkody, jednostki 2-hex oraz integracja morale/szczęścia.

## Testy

Uruchom pełny zestaw:

```bash
node --test tests/*.test.js
```

oraz kontrolę składni:

```bash
node --check combat-core.js
node --check battlefield-core.js
node --check game.js
node --check combat-v4.js
node --check combat-v5.js
```

## Assety

Assety użyte w prototypie pozostają CC0 z OpenGameArt:

- `skeleton_idle.png`, `skeleton_attack.png` — „Skeleton”, rehcub,
- `blob_idle.png`, `blob_attack.png`, `blob_move.png`, `blob_death.png` — „Blob Sprite”, Woostar.
