# Królestwa Pogranicza — prototyp walki v2

Samodzielny prototyp HTML/CSS/JS inspirowany mechaniką klasycznych turowych strategii fantasy. Nie zawiera plików z Heroes of Might and Magic III.

## Uruchomienie

Otwórz `index.html` w przeglądarce. Jeśli przeglądarka ogranicza lokalne pliki, w katalogu projektu uruchom:

```bash
python -m http.server 8080
```

i przejdź na `http://localhost:8080`.

## Co zmieniono w v2

- pole bitwy 15 × 11 heksów,
- 3 oddziały gracza i 3 oddziały SI,
- stosy jednostek z liczebnością,
- proste SI: wybiera najbliższy możliwy cel, podchodzi i atakuje,
- podświetlenie sylwetki wroga przy najechaniu,
- wybór jednej z sześciu stron ataku zależnie od położenia kursora,
- kierunkowy kursor ataku generowany jako SVG,
- automatyczne podejście do wybranej strony przeciwnika,
- naprawiona animacja ataku szkieleta: odtwarza się raz i wraca do idle,
- obrażenia są zadawane w trakcie animacji, a nie przed jej pokazaniem,
- kilka wariantów oddziałów o różnych statystykach i barwach.

## Assety

Assety pochodzą z OpenGameArt i są oznaczone jako CC0:

- `skeleton_idle.png`, `skeleton_attack.png` — „Skeleton”, autor rehcub, OpenGameArt, CC0.
- `blob_idle.png`, `blob_attack.png`, `blob_move.png`, `blob_death.png` — „Blob Sprite”, autor Woostar, OpenGameArt, CC0.

Adresy źródeł pozostają takie jak w pierwszej wersji projektu.

## SI

Obecne SI jest celowo lekkie i czytelne:
1. sprawdza wszystkie pola sąsiadujące z wrogimi oddziałami,
2. szuka najkrótszej drogi,
3. jeśli może dojść i zaatakować w tej turze — robi to,
4. jeśli nie — idzie maksymalnie w kierunku najbliższego celu.

Następny poziom SI może uwzględniać wartość celu, przewidywane obrażenia, kontratak, blokowanie przejść, jednostki dystansowe i magię.
