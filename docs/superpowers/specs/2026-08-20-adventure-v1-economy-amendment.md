# Adventure v1 — Economy Amendment

Ten dokument uzupełnia i nadpisuje sekcje dotyczące zasobów, struktur produkcyjnych, HUD-u ekonomii, stanu gry i testów w `2026-08-20-adventure-v1-world-loop-design.md`.

## Zasoby
Adventure v1 używa dokładnie siedmiu zasobów:

1. **Kamień** (`stone`)
2. **Drewno** (`wood`)
3. **Rtęć** (`mercury`)
4. **Siarka** (`sulfur`)
5. **Klejnoty** (`gems`)
6. **Złoto** (`gold`)
7. **Grzyby Dusz** (`soulMushrooms`)

Kamień i Drewno są zasobami podstawowymi. Rtęć, Siarka, Klejnoty i Grzyby Dusz są zasobami rzadkimi. Złoto jest osobną walutą ekonomiczną.

Minimalny stan zasobów:

```js
resources: {
  stone: 10,
  wood: 10,
  mercury: 0,
  sulfur: 0,
  gems: 0,
  gold: 2500,
  soulMushrooms: 0
}
```

HUD mapy pokazuje wszystkie siedem zasobów przez cały czas. Na mniejszych ekranach pasek może przewijać się poziomo, ale nie może ukrywać żadnego typu zasobu.

## Stosy zasobów na mapie
Każdy zasób może występować jako jednorazowy obiekt do zebrania.

Domyślne wartości stosów Adventure v1:
- Kamień: +5
- Drewno: +5
- Rtęć: +3
- Siarka: +3
- Klejnoty: +3
- Grzyby Dusz: +3
- Złoto: +500 albo +1000

Po zebraniu stos znika, a jego identyfikator trafia do `collectedObjectIds`, więc nie może pojawić się ponownie po odświeżeniu strony.

## Struktury produkcyjne
Każdy z siedmiu zasobów ma własną strukturę generującą dochód raz dziennie, jeśli gracz ją przejął.

| Zasób | Struktura | Produkcja dzienna |
|---|---|---:|
| Kamień | **Kamieniołom** | +2 Kamienia |
| Drewno | **Tartak** | +2 Drewna |
| Rtęć | **Alchemiczna Cysterna** | +1 Rtęci |
| Siarka | **Kopalnia Siarki** | +1 Siarki |
| Klejnoty | **Kopalnia Klejnotów** | +1 Klejnot |
| Złoto | **Kopalnia Złota** | +1000 Złota |
| Grzyby Dusz | **Gaj Grzybów Dusz** | +1 Grzyb Dusz |

Nazwy są robocze i własne dla projektu; mechanicznie struktury pełnią rolę stałych źródeł dochodu podobną do kopalń w klasycznych strategiach turowych.

## Przejmowanie struktur
Struktura ma stan właściciela:

```js
{
  id: 'sulfur-mine-north',
  type: 'resourceSite',
  resource: 'sulfur',
  dailyIncome: 1,
  owner: null | 'player',
  x: 18,
  y: 7,
  guardedBy: null | 'neutral-army-id'
}
```

Zasady:
- neutralną niebronioną strukturę przejmuje się po wejściu na jej pole wejściowe,
- struktura chroniona przez neutralną armię nie może zostać przejęta przed zwycięstwem w walce,
- po przejęciu `owner` zmienia się na `player`, a ID trafia do `ownedResourceSiteIds`,
- struktura pozostaje własnością gracza po odświeżeniu strony,
- w Adventure v1 przeciwnik nie może odbijać struktur, ponieważ nie ma jeszcze bohatera SI na mapie.

## Rozliczenie dzienne
Przycisk `Zakończ dzień` wykonuje ekonomię przed przejściem do następnego dnia.

Kolejność:
1. zbierz dochód ze wszystkich przejętych struktur,
2. dodaj wartości do `gameState.resources`,
3. zapisz stan,
4. zwiększ kalendarz,
5. odnow ruch bohatera,
6. odśwież widoczność.

Dochód jest naliczany dokładnie raz na zakończenie dnia. Ponowne wczytanie strony nie może naliczać produkcji drugi raz.

Przykład:

```js
function collectDailyIncome(state, sites) {
  for (const site of sites) {
    if (site.owner !== 'player') continue;
    state.resources[site.resource] += site.dailyIncome;
  }
}
```

## Stan gry
Pole mapy zostaje rozszerzone:

```js
map: {
  scenarioId: 'abandoned-gold-mine',
  collectedObjectIds: [],
  defeatedArmyIds: [],
  ownedResourceSiteIds: [],
  discoveredTiles: []
}
```

`ownedMineIds` z pierwotnej wersji specyfikacji zostaje zastąpione przez bardziej ogólne `ownedResourceSiteIds`, ponieważ nie wszystkie źródła są kopalniami.

## Pierwszy scenariusz — ekonomia
Pierwsza mapa powinna prezentować wszystkie siedem zasobów, ale nie musi zawierać po jednej przejmowalnej strukturze każdego typu w najbliższym otoczeniu startowym.

Minimalnie na mapie znajdują się:
- 1 Kamieniołom,
- 1 Tartak,
- 1 Kopalnia Złota jako główny cel scenariusza,
- co najmniej 2 struktury rzadkich zasobów spośród Rtęci, Siarki, Klejnotów i Grzybów Dusz,
- stosy wszystkich siedmiu zasobów rozsiane po mapie.

Docelowo format mapy obsługuje wszystkie siedem struktur od pierwszej wersji, nawet jeżeli część z nich leży w trudno dostępnych obszarach.

## HUD ekonomii
Górny pasek mapy pokazuje zasoby w stałej kolejności:

**Kamień · Drewno · Rtęć · Siarka · Klejnoty · Złoto · Grzyby Dusz**

Każdy wpis ma ikonę/oznaczenie, nazwę w tooltipie i aktualną liczbę. Nie kopiujemy ikon z Heroes III; tworzymy własne oznaczenia graficzne.

Po zakończeniu dnia HUD może krótko pokazać zmianę, np. `+2`, `+1`, `+1000`, przy zasobie, który został wyprodukowany.

## Testy ekonomii
Do `game-state.test.js` / `adventure-core.test.js` dochodzą testy:

1. nowa gra ma wszystkie siedem kluczy zasobów,
2. Kamieniołom produkuje +2 Kamienia dziennie,
3. Tartak produkuje +2 Drewna dziennie,
4. Alchemiczna Cysterna produkuje +1 Rtęci dziennie,
5. Kopalnia Siarki produkuje +1 Siarki dziennie,
6. Kopalnia Klejnotów produkuje +1 Klejnot dziennie,
7. Kopalnia Złota produkuje +1000 Złota dziennie,
8. Gaj Grzybów Dusz produkuje +1 Grzyb Dusz dziennie,
9. neutralna struktura nie daje dochodu,
10. struktura chroniona nie może zostać przejęta przed pokonaniem straży,
11. przejęcie struktury zapisuje jej ID w `ownedResourceSiteIds`,
12. odświeżenie strony nie nalicza dochodu drugi raz,
13. zebrany stos dowolnego z siedmiu zasobów nie odradza się po wczytaniu stanu.

## Zaktualizowane kryteria akceptacji ekonomii
Adventure v1 spełnia część ekonomiczną, gdy:
- HUD pokazuje siedem zasobów,
- każdy zasób można znaleźć jako stos na mapie,
- każdy zasób ma obsługiwany typ struktury produkcyjnej,
- przejęte struktury generują dochód codziennie,
- neutralne struktury nie generują dochodu dla gracza,
- dochód nie jest naliczany wielokrotnie po reloadzie,
- stan własności struktur i liczby zasobów jest trwały w `localStorage`.
