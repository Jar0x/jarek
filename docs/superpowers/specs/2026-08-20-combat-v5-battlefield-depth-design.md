# Combat v5 — Battlefield Depth

## Cel
Rozszerzyć istniejący prototyp walki o pełne jednostki 2-hex z orientacją, przeszkody terenowe, morale i szczęście, bez regresji w ruchu, ataku, kontrataku, strzelaniu, magii i SI z Combat v3/v4.

## Zakres
Combat v5 obejmuje:
- jednostki zajmujące 1 lub 2 heksy,
- pełny kierunek jednostek 2-hex jak w Heroes III,
- pathfinding uwzględniający cały footprint jednostki,
- przeszkody blokujące ruch i ustawienie,
- poprawne sąsiedztwo/atak względem obu pól dużej jednostki,
- morale dodatnie i ujemne,
- szczęście dodatnie,
- po jednej dużej jednostce dla gracza i SI,
- integrację z UI, logiem walki, magią i SI.

Poza zakresem v5: lot, teleportacja, mury oblężnicze, jednostki 3+ hex, niszczalne przeszkody i pełna mapa przygody.

## Architektura
Nowa geometria pola bitwy zostanie wydzielona do `battlefield-core.js`. Moduł będzie niezależny od DOM i testowalny w Node. `game.js` pozostanie właścicielem przebiegu tury i animacji, a `combat-v4.js` zachowa bohaterów i magię.

### `battlefield-core.js`
Odpowiada za:
- współrzędne i sąsiedztwo heksów,
- wyliczanie footprintu jednostki,
- walidację pozycji 1-hex i 2-hex,
- kolizje z jednostkami i przeszkodami,
- wyszukiwanie ścieżek dla jednostek o różnym rozmiarze,
- określanie pól kontaktowych do walki wręcz.

API ma operować na czystych strukturach danych i nie odwoływać się do DOM.

## Model jednostki 2-hex
Duża jednostka przechowuje:
- `size: 2`,
- `facing: 'left' | 'right'`,
- `c`, `r` jako heks główny (front/head).

Drugi heks (rear/tail) jest zawsze wyliczany z `facing` i geometrii aktualnego rzędu. Nie jest zapisywany jako osobny stan, aby uniknąć rozjazdu danych.

Dla jednostek 1-hex `size` domyślnie wynosi 1.

### Orientacja
- Armia gracza domyślnie patrzy w prawo.
- Armia SI domyślnie patrzy w lewo.
- Po ruchu orientacja zmienia się zgodnie z kierunkiem ostatniego kroku poziomego, gdy taki krok wystąpił.
- Przed atakiem wręcz jednostka 2-hex może automatycznie ustawić się stroną do celu, o ile wynikający footprint jest legalny.
- Obrót nie może wprowadzić drugiego heksu w przeszkodę, poza planszę ani na inną jednostkę.

## Zajętość i kolizje
Każda jednostka udostępnia listę zajmowanych heksów poprzez funkcję footprintu. Wszystkie systemy, które dotąd sprawdzały tylko `u.c/u.r`, mają korzystać z footprintu:
- `unitAt`,
- ruch,
- pathfinding,
- sąsiedztwo,
- wybór strony ataku,
- blokowanie strzelania w zwarciu,
- SI,
- celowanie magią.

Jednostka może podczas walidacji ignorować własny aktualny footprint, ale nie footprint innych jednostek.

## Pathfinding
Węzłem wyszukiwania dla jednostki 2-hex jest stan `(c, r, facing)`, nie samo `(c, r)`.

Przejście jest legalne tylko wtedy, gdy:
1. heks główny mieści się na planszy,
2. heks tylny mieści się na planszy,
3. oba heksy są wolne od przeszkód,
4. oba heksy są wolne od innych żywych jednostek.

Koszt ruchu pozostaje równy 1 za krok. Obrót wykonywany jako część ruchu nie otrzymuje osobnego kosztu w v5, aby zachować tempo podobne do Heroes III i nie komplikować UI.

SI używa dokładnie tego samego pathfindera co gracz.

## Przeszkody
Przeszkody są danymi planszy, np. `{id, c, r, kind}`. Są statyczne i nieprzechodnie.

W v5 powstaną 3 gotowe zestawy areny, wybierane losowo przy rozpoczęciu walki. Każdy zestaw ma pozostawić przejezdny korytarz między armiami i nie może zajmować startowych pól jednostek.

Typy wizualne: kamień, pień, ruiny. Mogą korzystać z CSS/emoji/prostych elementów bez dodawania płatnych assetów.

Przeszkody blokują:
- ruch,
- końcowe ustawienie dużej jednostki,
- pathfinding SI.

W v5 nie blokują linii strzału — to zostaje na później.

## Sąsiedztwo i walka wręcz
Dwie jednostki są w zwarciu, jeśli dowolny heks footprintu pierwszej jest sąsiadem dowolnego heksu footprintu drugiej.

Atak dużej jednostki może nastąpić z dowolnego legalnego stanu końcowego, którego footprint styka się z footprintem celu. System wyboru kierunku ataku ma wskazywać legalne pozycje głowy atakującego, a nie tylko pojedyncze heksy obok celu.

Kontratak działa bez zmian, ale korzysta z nowej funkcji sąsiedztwa footprintów.

## Morale
Każda jednostka otrzyma `morale` w zakresie -3..+3.

Na początku aktywacji wykonywany jest test morale:
- morale dodatnie może dać dodatkową akcję po zakończeniu bieżącej akcji,
- morale ujemne może spowodować utratę aktywacji,
- morale 0 nie wywołuje efektu.

Dla v5 używamy prostych progów determinowanych poziomem morale, np. 5% na punkt, maksymalnie 15%.

Dodatnie morale może zadziałać najwyżej raz na jednostkę w rundzie, aby uniknąć pętli dodatkowych tur. Ujemne morale również sprawdzane jest raz na aktywację.

Efekt jest pokazywany ikoną nad jednostką i wpisem w logu.

## Szczęście
Każda jednostka otrzyma `luck` w zakresie 0..3 w v5. Ujemne szczęście odkładamy na później.

Przy wykonywaniu ataku test szczęścia może zwiększyć końcowe obrażenia razy 2. Szansa: 5% na punkt, maksymalnie 15%.

Szczęście nie wpływa na obrażenia bezpośrednich czarów bohatera. Przy trafieniu pojawia się efekt wizualny i wpis w logu.

## Pierwsze jednostki 2-hex
Po jednej dużej jednostce na stronę zostanie dodane do obecnego składu testowego.

W v5 nie wymagamy nowych zewnętrznych sprite'ów. Istniejący sprite może być tymczasowo skalowany/oznaczony wizualnie jako duża jednostka, dopóki nie wybierzemy docelowych darmowych assetów. Mechanika ma być poprawna niezależnie od grafiki.

## Integracja z magią
Zaklęcia obszarowo nie istnieją jeszcze, więc:
- Magiczna Strzała celuje w jednostkę niezależnie od tego, który jej heks kliknięto,
- Błogosławieństwo, Przyspieszenie i Spowolnienie działają na cały stos,
- modyfikacja szybkości musi przeliczać legalny zasięg ruchu jednostki 2-hex tak samo jak 1-hex.

## Integracja z SI
SI otrzyma te same ograniczenia footprintu i przeszkód. Przy wyborze ataku bierze pod uwagę legalne stany `(c,r,facing)` stykające się z celem.

Nie tworzymy osobnego uproszczonego pathfindera dla SI.

## UI
- Przeszkody są renderowane na planszy poniżej jednostek.
- Duża jednostka wizualnie rozciąga się nad dwoma heksami i ma aktywny pierścień obejmujący footprint.
- Panel jednostki pokazuje `Rozmiar: 2 heksy`, Morale i Szczęście.
- Kolejka tury może pokazać ikonę morale/szczęścia, ale pozostaje jednym wierszem.
- Log walki zapisuje zdarzenia morale i szczęścia.

## Testy
Powstaną testy jednostkowe dla `battlefield-core.js` i mechanik losowych z możliwością wstrzyknięcia wartości RNG.

Minimalny zestaw:
1. footprint 1-hex,
2. footprint 2-hex dla obu orientacji na parzystych i nieparzystych rzędach,
3. odrzucenie footprintu wychodzącego poza planszę,
4. kolizja tylnego heksu z przeszkodą,
5. kolizja tylnego heksu z inną jednostką,
6. pathfinding dużej jednostki przez dostępny korytarz,
7. brak ścieżki przez zbyt wąski korytarz,
8. poprawne sąsiedztwo dwóch footprintów,
9. SI i gracz korzystają z tej samej walidacji ruchu,
10. dodatnie morale daje dodatkową akcję tylko raz na rundę,
11. ujemne morale może pominąć turę,
12. szczęście mnoży obrażenia x2,
13. szczęście nie modyfikuje obrażeń czarów.

## Kryteria akceptacji
Combat v5 jest gotowy, gdy:
- gracz i SI mogą poprawnie poruszać jednostkami 2-hex w obu orientacjach,
- żadna część dużej jednostki nie może wejść w przeszkodę, inną jednostkę ani poza planszę,
- atak i kontratak rozpoznają kontakt względem całego footprintu,
- przeszkody są widoczne i wpływają na pathfinding,
- morale i szczęście działają, mają limity przeciw pętlom i są raportowane w UI,
- istniejące mechaniki Combat v3/v4 nadal przechodzą testy,
- nowy zestaw testów Combat v5 przechodzi,
- branch może zostać zmergowany do `main` bez ręcznych poprawek.
