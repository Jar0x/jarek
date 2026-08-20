# Adventure v1 — World Loop

## Cel
Zbudować pierwszy grywalny subsystem mapy przygody inspirowany podstawową pętlą Heroes of Might and Magic III: eksploracja kwadratowej mapy, planowanie ruchu bohatera, teren i drogi wpływające na koszt ruchu, mgła wojny, zbieranie zasobów, przejmowanie kopalń, neutralne armie rozpoczynające istniejący Combat v5 oraz powrót na mapę z zachowaniem strat i nagród.

Projekt ma czerpać z logiki i tempa H3, ale używać własnych nazw, układu UI i oprawy graficznej. Nie kopiujemy grafik, ikon ani interfejsu H3 1:1.

## Zakres Adventure v1
Adventure v1 obejmuje:
- osobny ekran mapy przygody,
- mapę 32 × 32 opartą o kwadratowe kafelki,
- ruch bohatera w 8 kierunkach,
- punkty ruchu i koszt terenu,
- trzy klasy dróg,
- wyznaczanie i podgląd trasy,
- koniec dnia i odnowienie ruchu,
- kalendarz dzień / tydzień / miesiąc,
- mgłę wojny z trzema stanami widoczności,
- zasoby gracza: złoto, drewno, kamień,
- stosy zasobów do zebrania,
- skrzynie z wyborem nagrody,
- kopalnię złota, tartak i kamieniołom,
- neutralne armie na mapie,
- wejście w istniejący Combat v5,
- powrót z bitwy na mapę,
- trwałe straty armii po walce,
- doświadczenie bohatera,
- pierwszy cel scenariusza: pokonanie strażników opuszczonej kopalni złota,
- panel bohatera, armii, zasobów, minimapy i zakończenia dnia.

Poza zakresem v1:
- miasta i ekran miasta,
- rekrutacja jednostek,
- tygodniowy przyrost stworzeń,
- wrogi bohater poruszający się po mapie,
- dyplomacja,
- artefakty i ekwipunek,
- statki i woda,
- podziemia / drugi poziom mapy,
- teleporty,
- pełny edytor map,
- zapis do pliku lub chmury.

## Architektura
Adventure Map będzie osobnym ekranem od Combat.

Podział odpowiedzialności:

- `adventure.html` — ekran mapy przygody i HUD,
- `adventure.css` — oprawa mapy, HUD, mgła wojny, minimapa,
- `adventure.js` — kontroler ekranu mapy, input, kamera, rendering i interakcje,
- `adventure-core.js` — czysta logika mapy: ruch, koszty, pathfinding, widoczność, kalendarz i obiekty,
- `game-state.js` — wspólny trwały stan kampanii pomiędzy Adventure i Combat,
- istniejące `index.html` + moduły Combat — ekran bitwy,
- `battle-bridge.js` — cienka warstwa przekazująca stan armii z Adventure do Combat i wynik z powrotem.

`adventure-core.js` i `game-state.js` nie odwołują się do DOM i mają być testowalne w Node.

## Ekrany i przepływ
Podstawowa pętla:

1. Start w `adventure.html`.
2. Bohater porusza się po mapie i wchodzi w interakcje z obiektami.
3. Kontakt z neutralną armią tworzy `pendingBattle` w `game-state.js`.
4. Gra przechodzi do ekranu Combat.
5. Combat korzysta z armii bohatera zamiast generować domyślną testową armię.
6. Wynik bitwy zapisuje pozostałe stosy, XP, stan zwycięstwa/porażki i identyfikator pokonanego obiektu.
7. Po zwycięstwie gra wraca do `adventure.html`, usuwa neutralną armię i kontynuuje z aktualną armią bohatera.
8. Po porażce pokazuje prosty ekran przegranej scenariusza.

## Wspólny stan gry
`game-state.js` przechowuje serializowalny obiekt gry i synchronizuje go z `localStorage`.

Minimalny model:

```js
{
  version: 1,
  calendar: { day: 1, week: 1, month: 1 },
  resources: { gold: 2500, wood: 10, stone: 10 },
  hero: {
    id: 'aldren',
    name: 'Aldren',
    level: 1,
    xp: 0,
    attack: 2,
    defense: 1,
    power: 3,
    knowledge: 3,
    movement: 1800,
    maxMovement: 1800,
    x: 4,
    y: 24,
    army: [/* maks. 7 stosów */]
  },
  map: {
    scenarioId: 'abandoned-gold-mine',
    collectedObjectIds: [],
    defeatedArmyIds: [],
    ownedMineIds: [],
    discoveredTiles: []
  },
  pendingBattle: null,
  lastBattleResult: null
}
```

Stan ma być wystarczająco prosty, aby Adventure i Combat mogły go odczytać bez zależności od siebie nawzajem.

## Mapa
Mapa v1 ma stały rozmiar 32 × 32.

Każdy kafelek zawiera co najmniej:

```js
{
  x,
  y,
  terrain: 'grass' | 'dirt' | 'rock' | 'sand' | 'snow' | 'swamp',
  road: null | 'dirt' | 'stone' | 'paved',
  blocked: false
}
```

Mapa scenariusza będzie opisana jako dane w osobnym pliku `maps/adventure-v1-map.js`, a nie generowana losowo przy każdym uruchomieniu. Dzięki temu testy, balans i rozmieszczenie obiektów pozostają deterministyczne.

## Ruch bohatera
Bohater porusza się w 8 kierunkach.

Koszt podstawowy:
- ruch prosty: 100 punktów,
- ruch po skosie: 141 punktów.

Mnożniki terenu v1:
- trawa: 1.00,
- ziemia: 1.00,
- kamienisty: 1.25,
- piasek: 1.25,
- śnieg: 1.50,
- bagno: 1.75.

Droga nadpisuje karę terenu i stosuje własny mnożnik:
- polna: 0.75,
- kamienna: 0.65,
- brukowana: 0.55.

Końcowy koszt pojedynczego kroku jest zaokrąglany do liczby całkowitej.

Ruch nie może przechodzić przez:
- zablokowane kafelki,
- neutralne armie,
- obiekty oznaczone jako solidne,
- krawędź mapy.

Obiekty interaktywne mogą być celem ścieżki. Bohater zatrzymuje się na polu sąsiednim lub na samym obiekcie zależnie od typu obiektu.

## Pathfinding i planowanie trasy
`adventure-core.js` używa A* dla 8-kierunkowego ruchu.

Węzeł to `(x, y)`.

Koszt przejścia używa rzeczywistego kosztu terenu/drogi dla pola docelowego.

UI pokazuje zaplanowaną trasę po kliknięciu kafelka:
- zielone znaczniki — część możliwa do wykonania dziś,
- bursztynowe — pierwszy odcinek wymagający kolejnego dnia,
- przy ponownym kliknięciu tego samego celu bohater rozpoczyna ruch.

Ruch odbywa się krok po kroku i odejmuje punkty ruchu po każdym wejściu na kafelek.

Jeśli ruch skończy się z powodu braku punktów, trasa pozostaje zaplanowana do kolejnego dnia.

## Dzień, tydzień i miesiąc
Kalendarz zaczyna się od Miesiąc 1, Tydzień 1, Dzień 1.

Przycisk `Zakończ dzień`:
1. rozlicza dochód przejętych kopalń,
2. zwiększa dzień,
3. po dniu 7 rozpoczyna nowy tydzień,
4. po tygodniu 4 rozpoczyna nowy miesiąc,
5. odnawia ruch bohatera do `maxMovement`,
6. odświeża widoczność wokół aktualnej pozycji.

W v1 nie ma przyrostu jednostek tygodniowego.

## Mgła wojny
Każdy kafelek ma jeden z trzech stanów:
- `hidden` — nigdy niewidziany,
- `explored` — odkryty wcześniej, obecnie poza zasięgiem,
- `visible` — aktualnie w zasięgu widzenia bohatera.

Promień widzenia bohatera: 5 kafelków według odległości Chebysheva.

`visible` jest przeliczane po każdym kroku bohatera.

`explored` jest trwałe i zapisywane w `game-state.js` jako lista/zbiór odkrytych kafelków.

Zachowanie obiektów:
- na `hidden` nie są renderowane,
- na `explored` obiekty statyczne pozostają widoczne w przygaszonej formie,
- ruchome obiekty w przyszłości będą widoczne tylko na `visible`; w v1 nie ma ruchomych przeciwników.

## Zasoby
Adventure v1 używa trzech zasobów:
- złoto,
- drewno,
- kamień.

HUD pokazuje aktualne ilości przez cały czas.

Stosy zasobów na mapie:
- złoto: +500 lub +1000,
- drewno: +5,
- kamień: +5.

Po zebraniu obiekt znika i jego ID trafia do `collectedObjectIds`.

## Skrzynie
Skrzynia oferuje prosty wybór modalny:
- `Weź 1000 złota`,
- `Weź 750 XP`.

Po wyborze skrzynia znika.

Jeśli XP przekroczy próg poziomu, w v1 bohater automatycznie awansuje i dostaje:
- +1 do losowo wybranej statystyki Atak lub Obrona,
- bez systemu wyboru umiejętności drugorzędnych.

Progi XP v1:
- poziom 2: 1000 XP,
- poziom 3: 2500 XP,
- poziom 4: 4500 XP.

## Kopalnie
Typy:
- tartak: +2 drewna / dzień,
- kamieniołom: +2 kamienia / dzień,
- kopalnia złota: +1000 złota / dzień.

Neutralna kopalnia staje się własnością gracza po wejściu na pole wejściowe, chyba że chroni ją neutralna armia.

Główna kopalnia złota scenariusza jest początkowo chroniona przez neutralną armię i nie może zostać przejęta przed jej pokonaniem.

## Neutralne armie
Neutralna armia jest obiektem mapy:

```js
{
  id: 'guard-gold-mine',
  type: 'neutralArmy',
  x: 23,
  y: 9,
  army: [/* stosy zgodne z Combat */],
  xpReward: 1200,
  blocksMovement: true
}
```

Wejście w pole kontaktowe armii rozpoczyna Combat.

W v1 neutralna armia nie podejmuje decyzji na mapie i nie porusza się.

Po zwycięstwie:
- ID trafia do `defeatedArmyIds`,
- bohater otrzymuje XP,
- armia bohatera zachowuje pozostałe liczebności i HP stosów,
- pole jest odblokowane,
- jeśli armia chroni obiekt, obiekt może zostać przejęty.

## Integracja z Combat v5
Combat v5 pozostaje silnikiem bitwy.

Gdy `pendingBattle` istnieje:
- gracz otrzymuje stosy z `gameState.hero.army`,
- przeciwnik otrzymuje stosy z `pendingBattle.enemyArmy`,
- bohater gracza korzysta ze statystyk `gameState.hero`,
- bohater SI może korzystać z profilu neutralnego dowódcy o bazowych statystykach.

Po zakończeniu bitwy Combat zapisuje:

```js
{
  outcome: 'victory' | 'defeat',
  battleId,
  survivingArmy,
  xpReward
}
```

Przy zwycięstwie Adventure stosuje wynik i czyści `pendingBattle`.

Przy porażce scenariusz przechodzi w stan `lost`.

Combat uruchomiony bez `pendingBattle` nadal może działać jako samodzielny tryb testowy z obecnym składem demonstracyjnym.

## Armia bohatera
Bohater ma maksymalnie 7 slotów armii.

Każdy stos zachowuje co najmniej:
- `unitId`,
- `name`,
- `count`,
- `hpPer`,
- `totalHp`,
- parametry bojowe potrzebne przez Combat.

Po bitwie `totalHp` i `count` muszą być zapisane dokładnie, aby uszkodzony ostatni model stosu zachował aktualne HP przy kolejnej bitwie.

W Adventure v1 nie ma dzielenia, łączenia ani rekrutacji stosów.

## Kamera i rendering mapy
Mapa 32 × 32 jest większa od viewportu.

Kamera:
- podąża za bohaterem podczas ruchu,
- może być przesuwana klawiaturą WASD / strzałkami,
- może być przesuwana przeciąganiem środkowym/prawym przyciskiem lub krawędzią viewportu; implementacja v1 może ograniczyć się do klawiatury + automatycznego centrowania, jeśli drag zwiększy złożoność.

Kafelek v1: 48 × 48 px.

Rendering może używać DOM/CSS z widocznym viewportem zamiast canvasu. Przy 1024 kafelkach jest to akceptowalne i upraszcza interakcje oraz testy UI.

## Minimap
Minimapa pokazuje uproszczoną mapę terenu 32 × 32.

- hidden: czarne,
- explored: przygaszony kolor terenu,
- visible: pełny kolor,
- bohater: jasny znacznik,
- przejęte kopalnie: mały znacznik gracza.

Kliknięcie minimapy w v1 może jedynie przesuwać kamerę; nie wydaje rozkazu ruchu bohaterowi.

## HUD
Układ ma być inspirowany funkcjonalnością H3, ale wizualnie własny.

### Górny pasek
- Miesiąc / Tydzień / Dzień,
- złoto,
- drewno,
- kamień.

### Lewy dolny panel bohatera
- portret/ikona Aldrena,
- poziom i XP,
- Atak, Obrona, Moc, Wiedza,
- ruch `aktualny / maksymalny`.

### Dolny pasek armii
- 7 slotów,
- ikona typu jednostki,
- liczebność stosu.

### Prawy panel
- minimapa,
- `Zakończ dzień`,
- przycisk informacji o celu scenariusza.

HUD nie może zasłaniać centrum mapy na typowym ekranie desktopowym.

## Pierwszy scenariusz
Nazwa robocza: `Opuszczona Kopalnia`.

Start:
- Aldren na południowym zachodzie,
- mała armia startowa zgodna ze stworzeniami z Combat v5,
- 2500 złota, 10 drewna, 10 kamienia.

Na mapie:
- 3 neutralne armie,
- 1 kopalnia złota chroniona przez najsilniejszą armię,
- 1 tartak,
- 1 kamieniołom,
- 4–6 stosów zasobów,
- 2 skrzynie,
- sieć dróg prowadząca do centralnego obszaru,
- bagna i teren kamienisty wymuszające decyzje trasowe,
- zamknięta brama/zamek jako niedostępny teaser Adventure v2.

Warunek zwycięstwa:
- pokonaj `guard-gold-mine`,
- przejmij `gold-mine-main`.

Po spełnieniu celu pojawia się panel zwycięstwa scenariusza, ale gracz może jeszcze obejrzeć mapę lub rozpocząć scenariusz od nowa.

## Projekt mapy i tempo
Mapa ma zapewniać kilka sensownych decyzji:
- szybka droga do celu jest broniona,
- boczna trasa przez bagno kosztuje dużo ruchu, ale zawiera skrzynię,
- przejęcie tartaku/kamieniołomu nie jest wymagane do zwycięstwa,
- jedna neutralna armia blokuje skrót,
- drogi mają realną przewagę nad ruchem poza nimi.

Celem v1 nie jest pełny balans kampanii, tylko czytelna demonstracja pętli strategicznej.

## Obsługa interakcji
Kliknięcie:
- pusty kafelek — planuj trasę,
- ponowne kliknięcie celu — rozpocznij ruch,
- obiekt możliwy do zebrania — zaplanuj trasę do niego,
- neutralna armia — zaplanuj trasę do pola kontaktowego i rozpocznij bitwę po dotarciu,
- kopalnia — podejdź i przejmij,
- skrzynia — podejdź i pokaż wybór.

Podczas animowanego ruchu kolejne polecenia są blokowane.

## Stan po odświeżeniu
`localStorage` zachowuje:
- pozycję bohatera,
- punkty ruchu,
- kalendarz,
- armię,
- zasoby,
- odkrytą mapę,
- zebrane obiekty,
- pokonane armie,
- kopalnie,
- wynik ostatniej bitwy.

Przycisk `Nowa gra` resetuje stan Adventure v1 do danych startowych scenariusza.

## Testy
### `adventure-core.test.js`
Minimalne przypadki:
1. ruch prosty kosztuje 100 na zwykłym terenie,
2. ruch diagonalny kosztuje 141,
3. bagno zwiększa koszt do 175%,
4. droga obniża koszt niezależnie od bazowego terenu,
5. A* wybiera tańszą trasę drogą zamiast krótszej liczby kafelków przez bagno,
6. pathfinding omija zablokowane pola,
7. pathfinding nie przecina diagonalnie dwóch blokujących rogów,
8. trasa dzieli się poprawnie na część dostępną dziś i później,
9. koniec dnia odnawia ruch,
10. kalendarz przechodzi z dnia 7 do kolejnego tygodnia,
11. tydzień 4 / dzień 7 przechodzi do kolejnego miesiąca,
12. widoczność odkrywa kafelki w promieniu 5,
13. wcześniej widoczny kafelek staje się `explored`, a nie `hidden`.

### `game-state.test.js`
1. nowy stan ma poprawne zasoby i bohatera,
2. zapis/odczyt zachowuje armię i częściowe HP stosu,
3. zebrany obiekt nie wraca po ponownym wczytaniu,
4. przejęta kopalnia generuje dochód przy końcu dnia,
5. reset przywraca scenariusz do stanu początkowego.

### `battle-bridge.test.js`
1. pendingBattle przekazuje armię bohatera do Combat,
2. wynik zwycięstwa zapisuje survivingArmy,
3. wynik usuwa pokonaną neutralną armię,
4. XP jest naliczane dokładnie raz,
5. porażka ustawia stan scenariusza `lost`,
6. Combat bez pendingBattle nadal tworzy demonstracyjną bitwę.

### Testy regresyjne Combat
Wszystkie obecne testy Combat v3/v4/v5 muszą nadal przechodzić.

## Kryteria akceptacji
Adventure v1 jest gotowy, gdy:
- można rozpocząć nową grę na mapie 32 × 32,
- bohater porusza się w 8 kierunkach po trasie wyznaczonej przez A*,
- teren i drogi zmieniają realny koszt ruchu,
- punkty ruchu kończą się i odnawiają po zakończeniu dnia,
- mgła wojny odkrywa mapę i zachowuje odkryte kafelki,
- można zebrać złoto, drewno, kamień i skrzynię,
- można przejąć co najmniej trzy typy kopalń,
- dochód kopalń jest naliczany przy zmianie dnia,
- wejście w neutralną armię uruchamia Combat v5,
- po zwycięstwie wracamy na mapę z rzeczywistymi stratami armii,
- neutralna armia znika i XP jest naliczane,
- przejęcie głównej kopalni po pokonaniu straży kończy scenariusz zwycięstwem,
- odświeżenie strony nie resetuje postępu,
- wszystkie nowe oraz istniejące testy przechodzą.

## Kierunek Adventure v2
Po ustabilizowaniu World Loop następnym etapem będzie system miasta:
- ekran miasta,
- budynki i wymagania,
- rekrutacja,
- garnizon,
- tygodniowy przyrost,
- podstawowy przeciwnik AI na mapie.
