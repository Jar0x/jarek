# Królestwa Pogranicza — Combat v3

Samodzielny prototyp HTML/CSS/JS turowej walki fantasy inspirowanej klasycznymi strategiami. Projekt nie zawiera plików z Heroes of Might and Magic III.

## Uruchomienie

Otwórz `index.html` albo uruchom lokalny serwer:

```bash
python -m http.server 8080
```

## Combat v3

- pole bitwy 15 × 11 heksów,
- kolejka inicjatywy oparta o szybkość jednostek i widoczna w HUD,
- kontratak raz na rundę po ataku wręcz,
- statystyki Atak/Obrona wpływające na obrażenia,
- Kościani Łucznicy po obu stronach, limitowani liczbą strzałów,
- kara 50% do obrażeń dystansowych przy strzale powyżej 6 heksów,
- blokada strzelania, gdy wróg stoi na sąsiednim heksie — łucznik wtedy walczy wręcz,
- panel statystyk jednostki po najechaniu,
- ulepszone SI: ocenia zagrożenie celu, możliwość zabicia, dystans i priorytet jednostek dystansowych,
- kierunkowe ataki wręcz i podświetlenie sylwetki celu,
- animacje ataku wracające poprawnie do stanu idle.

## Testy

Logika walki ma prosty zestaw testów Node.js:

```bash
node --test tests/combat-core.test.js
```

## Assety

Assety użyte w prototypie pozostają CC0 z OpenGameArt:

- `skeleton_idle.png`, `skeleton_attack.png` — „Skeleton”, rehcub,
- `blob_idle.png`, `blob_attack.png`, `blob_move.png`, `blob_death.png` — „Blob Sprite”, Woostar.
