# Town v1 — Castle & Necropolis

## Cel
Rozszerzyć Adventure v1 o dwa pierwsze pełne miasta/frakcje: Zamek i Nekropolię. System miasta ma współdzielić siedmiosurowcową ekonomię Adventure, umożliwiać budowę jednej struktury dziennie, tygodniowy przyrost jednostek, rekrutację i transfer między garnizonem a armią bohatera.

## Wspólne zasoby
W całej grze pozostaje dokładnie 7 zasobów:
- stone — Kamień,
- wood — Drewno,
- mercury — Rtęć,
- sulfur — Siarka,
- gems — Klejnoty,
- gold — Złoto,
- soulMushrooms — Grzyby Dusz.

Wszystkie zasoby istnieją od Adventure v1, nawet jeśli pełne zastosowanie części z nich pojawi się dopiero w kolejnych frakcjach.

## Frakcje v1
### Zamek
Główna ekonomia: Drewno, Kamień, Klejnoty i Złoto.

Jednostki docelowego drzewa:
1. Milicjant
2. Kusznik
3. Giermek
4. Gryfi Strażnik
5. Kapłan Światła
6. Rycerz
7. Paladyn — ciężka jednostka 2-hex na koniu bojowym.

W pierwszej grywalnej wersji Town v1 odblokowane są poziomy 1–4. Poziomy 5–7 są zapisane w danych, ale nie muszą mieć jeszcze pełnych assetów/rekrutacji.

Budynki rekrutacyjne v1:
- Koszary Milicji: 500 złota, 5 drewna, 5 kamienia.
- Strzelnica: 1000 złota, 10 drewna, 5 kamienia; wymaga Koszar Milicji.
- Bastion Giermków: 1500 złota, 5 drewna, 10 kamienia, 2 klejnoty; wymaga Koszar Milicji.
- Wieża Gryfa: 2500 złota, 10 kamienia, 5 drewna, 5 klejnotów; wymaga Bastionu Giermków.

Budynki ekonomiczne:
- Ratusz: +500 złota/dzień.
- Magistrat: +1000 złota/dzień; wymaga Ratusza.
- Skarbiec Królewski: +2000 złota/dzień; wymaga Magistratu.

Budynki specjalne v1:
- Sala Dowódcy: bohater rozpoczynający dzień w mieście otrzymuje +1 morale do następnej bitwy.
- Kaplica: przygotowuje frakcję pod magię światła/wsparcia.
- Kamienne Mury: przygotowują system oblężeń; w v1 mogą dawać wyłącznie informacyjny bonus miasta bez osobnej bitwy oblężniczej.

Tygodniowy przyrost v1:
- Milicjant +14,
- Kusznik +9,
- Giermek +7,
- Gryfi Strażnik +4.

Koszt rekrutacji v1:
- Milicjant: 55 złota,
- Kusznik: 110 złota,
- Giermek: 180 złota,
- Gryfi Strażnik: 320 złota.

### Nekropolia
Główny zasób: Grzyby Dusz. Dodatkowo często używa Kamienia, Rtęci i Złota.

Jednostki docelowego drzewa:
1. Szkielet
2. Kościany Łucznik
3. Strażnik Grobowca
4. Widmowy Jeździec
5. Lisz
6. Wampirzy Lord
7. Arcymag Nekromancji — elitarna jednostka magiczna 1-hex, dystansowa, wspierająca nieumarłych i osłabiająca wrogów.

W pierwszej grywalnej wersji Town v1 odblokowane są poziomy 1–4.

Budynki rekrutacyjne v1:
- Krypta: 500 złota, 5 kamienia, 2 Grzyby Dusz.
- Kościana Wieża: 1000 złota, 5 drewna, 5 kamienia, 3 Grzyby Dusz; wymaga Krypty.
- Grobowiec Strażników: 1500 złota, 10 kamienia, 2 rtęci, 4 Grzyby Dusz; wymaga Krypty.
- Stajnia Widm: 2500 złota, 10 kamienia, 5 rtęci, 6 Grzybów Dusz; wymaga Grobowca Strażników.

Budynki ekonomiczne:
- Ratusz Umarłych: +500 złota/dzień.
- Magistrat Umarłych: +1000 złota/dzień; wymaga Ratusza Umarłych.
- Skarbiec Krypt: +2000 złota/dzień; wymaga Magistratu Umarłych.

Budynki specjalne v1:
- Ołtarz Dusz: +5 punktów procentowych do nekromancji.
- Grzybnia Umarłych: +1 Grzyb Dusz/dzień.
- Wieża Nekromanty: przygotowuje frakcję pod magię śmierci.

Tygodniowy przyrost v1:
- Szkielet +16,
- Kościany Łucznik +9,
- Strażnik Grobowca +6,
- Widmowy Jeździec +4.

Koszt rekrutacji v1:
- Szkielet: 45 złota,
- Kościany Łucznik: 100 złota,
- Strażnik Grobowca: 200 złota,
- Widmowy Jeździec: 350 złota + 1 Grzyb Dusz.

## Nekromancja
Po zwycięskiej bitwie bohater Nekropolii może odzyskać część pokonanych jednostek jako Szkielety.

Bazowa wartość v1: 20% pokonanych modeli, zaokrąglone w dół.
Ołtarz Dusz zwiększa wartość do 25%.
Każdy 1 Grzyb Dusz pozwala utworzyć maksymalnie 10 Szkieletów. Grzyby są zużywane tylko w liczbie potrzebnej do faktycznie utworzonych Szkieletów.
Nekromancja nie może tworzyć jednostek, jeśli bohater nie ma wolnego miejsca na istniejący stos Szkieletów ani pustego slotu armii.

## Jedna budowa na dzień
Każde miasto ma `lastBuildDayKey` w formacie `month:week:day`.
W tym samym mieście można ukończyć najwyżej jeden nowy budynek na dany dzień kalendarzowy.
Koszt jest pobierany natychmiast. Budynek zaczyna działać od razu po zakupie.

## Tygodniowy przyrost
Przy przejściu do nowego tygodnia każde istniejące siedlisko dodaje swój przyrost do `availableRecruits[unitId]`.
Niewykupione jednostki pozostają w puli i kumulują się przez kolejne tygodnie.

## Garnizon i armia bohatera
Każde miasto ma 7-slotowy garnizon.
Bohater ma maksymalnie 7 stosów.
Town v1 obsługuje transfer całego stosu pomiędzy bohaterem i garnizonem oraz łączenie stosów tego samego `unitId`. Dzielenie stosów można odłożyć na później.

## Ekran miasta
Powstaje osobny `town.html` z parametrem `?town=<townId>`.
Ekran zawiera:
- nazwę i frakcję miasta,
- aktualne 7 zasobów,
- drzewko budynków,
- panel dostępnych rekrutów,
- garnizon 7 slotów,
- armię bohatera 7 slotów,
- przycisk powrotu na Adventure Map.

## Integracja z Adventure
Na mapie Adventure są dwa miasta testowe:
- `castle-haven` — Zamek,
- `necropolis-morrow` — Nekropolia.

Wejście bohatera na pole miasta własnej frakcji lub przejętego miasta otwiera `town.html`.
Na potrzeby v1 oba miasta mogą należeć do gracza od początku scenariusza albo jedno może być neutralne do przejęcia; mechanika właściciela ma być ogólna.

## Kryteria akceptacji
Town v1 jest gotowy, gdy:
- wszystkie 7 zasobów są obsługiwane w stanie gry i HUD,
- działają dzienne struktury generujące każdy z 7 zasobów po przejęciu,
- istnieją dwa miasta: Zamek i Nekropolia,
- każde ma budowę jednej struktury dziennie,
- każde ma 4 grywalne siedliska i tygodniowe przyrosty,
- można rekrutować jednostki za zasoby,
- można przenosić stosy pomiędzy bohaterem i garnizonem,
- Nekropolia używa Grzybów Dusz i ma działającą Nekromancję,
- Paladyn jest zapisany jako poziom 7 Zamku, `size: 2`, `mounted: true`, ale pełna rekrutacja poziomu 7 nie jest wymagana w pierwszej wersji,
- Arcymag Nekromancji jest zapisany jako poziom 7 Nekropolii,
- stan miasta i rekrutów przetrwa odświeżenie strony,
- istniejące testy Combat nadal przechodzą.
