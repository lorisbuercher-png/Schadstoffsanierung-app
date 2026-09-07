"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "../../../../components/ui/AppShell";
import SignaturePad from "../../../../components/SignaturePad";
import FileUpload, { DateiEintrag } from "../../../../components/FileUpload";

type Antwort = {
  antwort: string;
  bemerkung: string;
};

type Checkliste = {
  code: string;
  name: string;
  status: string;
  daten?: {
    datum?: string;
    verantwortlich?: string;
    fachbauleiter?: string;
    mitarbeiterId?: string;
    antworten?: Record<string, Antwort>;
    dateien?: DateiEintrag[];
    unterschriftVerantwortlich?: string;
    unterschriftMitarbeiter?: string;
    unterschriftKontrolle?: string;
  };
};

type Baustelle = {
  id: string;
  projektname: string;
  nummer: string;
  checklisten: Checkliste[];
};

const as1 = [
  {
    titel: "A Grundlagen",
    fragen: [
      ["A1", "Können wir die Situation sicher selber beurteilen? Sonst Beizug von Experten"],
      ["A2", "Ist das Sanierungsziel klar? Teilsanierung, vollständig oder vor Abbruch?"],
      ["A3", "Ist der Diagnosebericht vollständig?"],
      ["A4", "Verputz: In welcher Schicht ist der Asbest?"],
      ["A5", "Werden Plättli mit Grundputz saniert?"],
      ["A6", "Braucht es Nachuntersuchungen? Wer macht diese?"],
      ["A7", "Stimmen die Mengenangaben / Masse?"],
      ["A8", "Stimmen die vorgeschlagenen Sanierungsmethoden?"],
      ["A9", "Sind die Entsorgungswege klar? Braucht es Annahmegenehmigung?"],
      ["A10", "Wie viel Zeit steht für die Sanierung zur Verfügung?"],
      ["A11", "Wie viel Personal braucht es für die Baustelle?"],
      ["A12", "Gibt es eine VeVA-Nummer für Gebäude / Bauherr? Wer unterzeichnet?"],
    ],
  },
  {
    titel: "B Schnittstellen",
    fragen: [
      ["B1", "Welche elektrische Stromversorgung wird benötigt? Wer stellt sie sicher?"],
      ["B2", "Wer schaltet den Sanierungsbereich sicher spannungsfrei?"],
      ["B3", "Brandmeldeanlage / Sprinkler: Wie geschützt oder abgestellt?"],
      ["B4", "Hat es Frischwasser und Ablauf für Abwasser?"],
      ["B5", "Braucht es ein Gerüst? Wer stellt und kontrolliert dieses?"],
      ["B6", "Platz für Mulde vorhanden und gesichert?"],
      ["B7", "Wer demontiert Installationen vor der Sanierung?"],
      ["B8", "Werden demontierte Teile entsorgt oder wieder verwendet?"],
      ["B9", "Boden um die Zone abdecken?"],
      ["B10", "Gibt es mögliche Folgeschäden, die repariert werden müssen?"],
      ["B11", "Finden während der Sanierung andere Arbeiten statt?"],
      ["B12", "Wenn Luftmessung über Grenzwert: Wer bezahlt erneute Messung?"],
      ["B13", "Wer macht visuelle Kontrollen und Raumluftmessungen?"],
      ["B14", "Werden alle Zonen freigemessen?"],
      ["B15", "Wie schnell ist die Fachbauleitung vor Ort und wann muss die Messung angekündigt werden?"],
      ["B16", "Ist ein Notstromaggregat notwendig?"],
      ["B17", "Tragfähigkeit Boden / Verkehrswege geprüft?"],
      ["B18", "Gibt es sichere Rettungswege / Notausgänge?"],
      ["B19", "Gibt es ein WC auf der Baustelle?"],
      ["B20", "Weitere Schnittstellen / Besonderheiten"],
    ],
  },
  {
    titel: "C Ausführung der Sanierung",
    fragen: [
      ["C1", "Besteht im Gebäude bereits eine Schadstoff-Belastung? Welche Massnahmen?"],
      ["C2", "Gibt es besondere Gefahren oder notwendige Massnahmen?"],
      ["C3", "Hat es Platz für eine Materialschleuse?"],
      ["C4", "Gibt es kantonale oder kommunale Vorschriften?"],
    ],
  },
];

const as2 = [
  {
    titel: "A Mitarbeiter",
    fragen: [
      ["A1", "Eigener weisungsbefugter Spezialist für Asbestsanierung ist permanent vor Ort"],
      ["A2", "Mitarbeiter sind über die Arbeit mit Asbest instruiert"],
      ["A3", "Mitarbeiter sind über allgemeine Arbeitssicherheit instruiert"],
      ["A4", "Mitarbeiter haben die nötige Schutzausrüstung dabei und benützen sie korrekt"],
      ["A5", "Die Asbestsanierung wurde der Suva gemeldet"],
      ["A6", "Es gibt einen sauberen Arbeitsplan inklusive Mitarbeiterliste"],
    ],
  },
  {
    titel: "B Arbeitssicherheit",
    fragen: [
      ["B1", "Es werden staubarme Verfahren angewendet"],
      ["B2", "Die richtigen Atemschutzmasken werden getragen"],
      ["B3", "Alle Arbeiter in der Zone tragen Schutzanzug"],
      ["B4", "Notfallnummern sind gut sichtbar aufgehängt"],
      ["B5", "Alle kennen das richtige Verhalten bei Notfällen"],
      ["B6", "1.-Hilfe-Koffer, Notfall-Set und Feuerlöscher sind neben der Schleuse"],
      ["B7", "Asbestwarnschilder sind gut sichtbar"],
    ],
  },
  {
    titel: "C Sanierungszone und Durchlüftung",
    fragen: [
      ["C1", "Zone entspricht dem Sanierungsplan"],
      ["C2", "Abdichtung ist komplett und robust"],
      ["C3", "Nicht dekontaminierbare Flächen sind abgedeckt"],
      ["C4", "Kommunikation / Sichtkontakt mit Personen in der Zone ist gewährleistet"],
      ["C5", "Durchlüftung aller Teilzonen ist gewährleistet – keine toten Zonen"],
      ["C6", "Luftaustausch der Schleuse ist ausreichend"],
    ],
  },
  {
    titel: "D Dekontamination",
    fragen: [
      ["D1", "Zugänge zum Arbeitsbereich / zur Baustelle sind abgesperrt und gesichert"],
      ["D2", "Mitarbeiter dekontaminieren sich immer korrekt"],
      ["D3", "Dusche funktioniert und warmes Wasser ist vorhanden"],
      ["D4", "Abfälle werden sauber verpackt und dekontaminiert"],
      ["D5", "Geräte werden dekontaminiert"],
    ],
  },
  {
    titel: "E Unterdruckhaltegeräte und Sauger",
    fragen: [
      ["E1", "Unterdruck und Reservekapazität UHG ausreichend – mindestens 20 Pa inklusive Aufzeichnung"],
      ["E2", "Abluft von UHG und Sauger wird nach aussen geführt"],
      ["E3", "Filterbelastung der UHG ist nicht zu hoch"],
      ["E4", "UHG und Sauger haben Kennzeichnung für nächste Revision"],
      ["E5", "Akustischer / visueller Alarm funktioniert und ist in der Zone wahrnehmbar"],
      ["E6", "Telealarm funktioniert"],
    ],
  },
  {
    titel: "F Verschiedenes",
    fragen: [
      ["F1", "Stromversorgung ausreichend und mit FI-Schalter?"],
      ["F2", "Zu demontierende elektrische Bauteile sind nachweislich stromfrei"],
      ["F3", "Abwasser wird gefiltert"],
      ["F4", "Abfälle werden kontinuierlich abgepackt und entfernt"],
      ["F5", "Abfälle werden sicher gelagert"],
      ["F6", "Schleusenjournal und tägliche Checkliste werden verwendet"],
    ],
  },
];


const as4 = [
  {
    titel: "A PSA für Asbest",
    fragen: [
      ["A1", "Richtige Atemschutzmaske vorhanden? Welche? In gutem Zustand und sauber?"],
      ["A2", "Mitarbeiter sauber rasiert?"],
      ["A3", "Sitzt die Maske korrekt?"],
      ["A4", "Ist die Maske dicht?"],
      ["A5", "Funktionieren Druckluftgerät und Luftfilter?"],
      ["A6", "Wird kein CO₂, CO, Dampf oder Staub angesaugt?"],
      ["A7", "Korrekter Schutzanzug – Kategorie 3, Typ 5/6?"],
      ["A8", "Schutzanzug sauber abgeklebt?"],
    ],
  },
  {
    titel: "B Weitere PSA",
    fragen: [
      ["B1", "Sicherheitsschuhe S3 vorhanden?"],
      ["B2", "Schutzbrille vorhanden und geeignet?"],
      ["B3", "Helm vorhanden und geeignet?"],
      ["B4", "Handschuhe vorhanden und geeignet?"],
      ["B5", "Gehörschutz vorhanden und geeignet?"],
      ["B6", "Absturzsicherung vorhanden, falls notwendig?"],
      ["B7", "Weitere PSA erforderlich?"],
      ["B8", "Weitere PSA geprüft?"],
      ["B9", "Weitere PSA / Bemerkungen"],
    ],
  },
  {
    titel: "C Weitere Gefahren",
    fragen: [
      ["C1", "Gerüst gesichert?"],
      ["C2", "Einsturzgefahr beurteilt?"],
      ["C3", "Stolpergefahr beurteilt und reduziert?"],
      ["C4", "Gefahren durch Strom beurteilt?"],
      ["C5", "Gefahren durch Hitze beurteilt?"],
      ["C6", "Weitere Einsturz- oder Absturzgefahren beurteilt?"],
      ["C7", "Ist der Baustellen-Zugang sicher?"],
      ["C8", "Ist die Beleuchtung ausreichend?"],
      ["C9", "Weitere Gefahren / Besonderheiten"],
    ],
  },
];


const as5 = [
  {
    titel: "A Warum ist Asbest gefährlich",
    fragen: [
      ["A1", "Asbest besteht aus extrem feinen Fasern, die man von Auge nicht sieht"],
      ["A2", "Die Fasern können bis in die Lunge / Alveolen gelangen"],
      ["A3", "Der Körper kann Asbestfasern nicht entfernen; dadurch kann Krebs entstehen"],
    ],
  },
  {
    titel: "B Atemschutzmaske",
    fragen: [
      ["B1", "Welche Maske wird für Arbeiten im Roten Bereich verwendet?"],
      ["B2", "Anziehen und Kontrolle der Maske praktisch vorgezeigt und mit Mitarbeiter geübt"],
      ["B3", "Hygiene erklärt: Maske muss nach dem Einsatz gereinigt werden"],
      ["B4", "Rasur erklärt: Mitarbeiter muss für dichten Sitz sauber rasiert sein"],
      ["B5", "Erklärt, dass auch die beste Maske keinen hundertprozentigen Schutz bietet"],
      ["B6", "Erklärt, dass die Maske in der Zone nie ausgezogen werden darf"],
    ],
  },
  {
    titel: "C Weitere PSA und Gesundheitsschutz",
    fragen: [
      ["C1", "Schutzanzug gemeinsam angezogen und korrekt abgeklebt"],
      ["C2", "Weitere notwendige PSA erklärt: Schuhe, Brille, Helm, Handschuhe, Gehörschutz"],
      ["C3", "Zutrittsregelung erklärt: Nur instruierte Personen dürfen in den Arbeitsbereich"],
    ],
  },
  {
    titel: "D Ausschleusen Personen",
    fragen: [
      ["D1", "Praktisch vorgezeigt, was in welcher Schleusenkammer gemacht wird"],
      ["D2", "Erklärt: zuerst mit Maske duschen, danach Maske ausziehen und Gesicht waschen"],
      ["D3", "Erklärt, vor Eintritt in die Zone die Toilette zu benutzen"],
    ],
  },
  {
    titel: "E Vorgehen bei Notfällen",
    fragen: [
      ["E1", "Verhalten bei Übelkeit / Atembeschwerden erklärt: Zone möglichst schnell verlassen"],
      ["E2", "Verhalten bei Unfall erklärt: Person wenn möglich evakuieren und Atmung sicherstellen"],
      ["E3", "Standorte von Feuerlöscher, Erste-Hilfe-Koffer und Notfallnummern gezeigt"],
      ["E4", "Verhalten bei Alarm erklärt: Arbeit einstellen und zur Schleuse kommen"],
      ["E5", "Erklärt, dass im Notfall eine Kontamination des Aussenbereichs in Kauf genommen werden kann"],
    ],
  },
  {
    titel: "F Spezifisch pro Baustelle",
    fragen: [
      ["F1", "Welche Materialien enthalten auf dieser Baustelle Asbest?"],
      ["F2", "Spezifische Arbeitsweisen erklärt und gezeigt"],
      ["F3", "Andere Gefahren und allgemeine Arbeitssicherheit erklärt"],
      ["F4", "Dekontamination der Abfälle erklärt"],
      ["F5", "Transport der Abfälle zur Mulde erklärt"],
      ["F6", "Bedienung der UHG und anderer Geräte erklärt"],
      ["F7", "Vorgehen bei der Schlussreinigung erklärt"],
    ],
  },
  {
    titel: "G Verständnis und Kompetenz überprüfen",
    fragen: [
      ["G1", "Mitarbeiter kann die theoretischen Punkte wiederholen und die praktischen Elemente selbstständig durchführen"],
    ],
  },
];


const as6 = [
  {
    titel: "A Ausgangslage, Rahmenbedingungen und Schnittstellen",
    fragen: [
      ["A1", "Ist das Sanierungsziel klar?"],
      ["A2", "Sind die Rahmenbedingungen klar?"],
      ["A3", "Ist das Gebäudegutachten vollständig und plausibel und deckt es sich mit dem Umbauperimeter?"],
      ["A4", "Sind die Schnittstellen klar, inklusive Namen und Telefonnummern?"],
      ["A5", "Sind alle in der Zone eingesetzten Personen aufgeführt, inklusive Temporärmitarbeiter?"],
      ["A6", "Ist klar, wer die visuellen Kontrollen und Messungen durchführt?"],
      ["A7", "Braucht es besondere Bewilligungen oder Meldungen an Behörden, Suva oder Kanton?"],
    ],
  },
  {
    titel: "B Arbeitssicherheit",
    fragen: [
      ["B1", "Ist die richtige PSA für die vorhandenen Schadstoffe klar und begründet?"],
      ["B2", "Muss bereits beim Aufbau der Zone PSA getragen werden?"],
      ["B3", "Sind andere Gefahren abgeklärt, z.B. Lärm, Absturz oder weitere Baustellengefahren?"],
      ["B4", "Sind die Massnahmen für andere Gefahren nach dem STOP-Prinzip klar?"],
      ["B5", "Kann der Alarm in allen Teilzonen gehört oder gesehen werden?"],
      ["B6", "Funktioniert die Kommunikation mit Personen in der Zone?"],
      ["B7", "Sind Vorgehen bei Notfällen und Rettungswege innerhalb und ausserhalb der Zone klar?"],
      ["B8", "Ist eine eigene Absauganlage bei Notausgängen notwendig?"],
      ["B9", "Sind die eingesetzten Personen für die vorhandenen Gefahren geschult?"],
    ],
  },
  {
    titel: "C Ablauf der Sanierung",
    fragen: [
      ["C1", "Ist der genaue Ablauf der Sanierung schlüssig?"],
      ["C2", "Ist klar, was bauseits vor der Sanierung gemacht werden muss und wer zuständig ist?"],
      ["C3", "Ist die Arbeitsmethode klar beschrieben?"],
      ["C4", "Sind die Massnahmen zur Faserminimierung klar beschrieben und begründet?"],
      ["C5", "Sind Gerüst und andere Geräte für den Einsatz bei Asbestarbeiten geeignet?"],
    ],
  },
  {
    titel: "D Sanierungszone und Luftwechsel",
    fragen: [
      ["D1", "Sind Erschliessung und Verkehrswege sämtlicher Teilzonen klar und sicher?"],
      ["D2", "Sind Position von Schleusen, Klappen und UHG klar und die Durchflussmengen angegeben?"],
      ["D3", "Sind alle Teilzonen ausreichend durchlüftet?"],
      ["D4", "Kann das UHG installiert und sicher bedient werden?"],
      ["D5", "Reicht die Leistung der UHG und ist genügend elektrische Leistung vorhanden?"],
      ["D6", "Verfügt die Materialschleuse über eine Dusche, falls erforderlich?"],
    ],
  },
  {
    titel: "E Sauger",
    fragen: [
      ["E1", "Ist die Position der Sauger klar?"],
      ["E2", "Ist der Sauger für Quellabsaugung geeignet?"],
      ["E3", "Hat der Sauger genügend Leistung für Schleifmaschine oder Fräse?"],
      ["E4", "Kann die Abluft des Weiss-Saugers ins Freie abgeleitet werden?"],
    ],
  },
  {
    titel: "F Abfälle",
    fragen: [
      ["F1", "Ist die geschätzte Abfallmenge angegeben?"],
      ["F2", "Ist die Dekontamination von Abfällen und Arbeitsmitteln gewährleistet?"],
      ["F3", "Sind Abfalllogistik und Position der Mulde klar und ohne Zwischenlager geplant?"],
      ["F4", "Ist klar, wer die Abfälle transportiert?"],
      ["F5", "Ist klar, welche Abfälle wo entsorgt werden?"],
    ],
  },
];


const as7 = [
  {
    titel: "A Organisation der Erstinstruktion",
    fragen: [
      ["A1", "Instruktion wird durch Vorarbeiter oder KOPAS durchgeführt"],
      ["A2", "Instruktion findet auf der Baustelle oder an einer aufgebauten Sanierungszone statt"],
      ["A3", "Für die Instruktion stehen mindestens 30 bis 60 Minuten zur Verfügung"],
      ["A4", "Benötigte PSA und Schulungsunterlagen sind vorhanden"],
      ["A5", "Eine Sanierungszone mit den relevanten Geräten steht für praktische Übungen zur Verfügung"],
    ],
  },
  {
    titel: "B Grundsätze der Instruktion",
    fragen: [
      ["B1", "Die Inhalte werden praktisch mit dem Mitarbeiter geübt"],
      ["B2", "Die Instruktion erfolgt in einer Sprache, die der Mitarbeiter versteht"],
      ["B3", "Der Mitarbeiter wird nach der Erstinstruktion zunächst begleitet"],
      ["B4", "Die wichtigsten Inhalte werden regelmässig wiederholt"],
    ],
  },
  {
    titel: "C Vorwissen und Erfahrung",
    fragen: [
      ["C1", "Vorwissen des Mitarbeiters zu Asbest wurde erfragt"],
      ["C2", "Bisherige Erfahrung mit Asbestarbeiten wurde besprochen"],
      ["C3", "Einstellung und Verständnis zum Thema Arbeitssicherheit wurden besprochen"],
    ],
  },
  {
    titel: "D Theorie: Was ist Asbest?",
    fragen: [
      ["D1", "Erklärt, dass Asbest aus extrem feinen Fasern besteht"],
      ["D2", "Erklärt, dass die Fasern mit blossem Auge nicht sichtbar sind"],
      ["D3", "Erklärt, dass Asbestfasern in die Lunge gelangen können"],
      ["D4", "Gesundheitsrisiken und mögliche Krebserkrankungen wurden erklärt"],
      ["D5", "Erklärt, dass Erkrankungen erst viele Jahre später auftreten können"],
    ],
  },
  {
    titel: "E Schutzausrüstung",
    fragen: [
      ["E1", "Vollmaske mit Druckluft praktisch erklärt und angezogen"],
      ["E2", "Dichtsitz und Kontrolle der Atemschutzmaske praktisch geübt"],
      ["E3", "Schutzanzug korrekt angezogen und abgeklebt"],
      ["E4", "Weitere PSA wie Schuhe, Handschuhe, Gehörschutz und Helm erklärt"],
      ["E5", "Mitarbeiter kann die PSA selbstständig korrekt anlegen"],
    ],
  },
  {
    titel: "F Arbeiten in der Sanierungszone",
    fragen: [
      ["F1", "Aufbau und Funktionsweise der Sanierungszone erklärt"],
      ["F2", "Personenschleuse praktisch erklärt und benutzt"],
      ["F3", "Materialschleuse erklärt"],
      ["F4", "Unterdruckhaltung und UHG erklärt"],
      ["F5", "Verhalten innerhalb der Zone praktisch besprochen"],
      ["F6", "Verbotene Handlungen in der Zone wurden erklärt"],
    ],
  },
  {
    titel: "G Dekontamination und Ausschleusen",
    fragen: [
      ["G1", "Ausschleusen wurde Schritt für Schritt praktisch geübt"],
      ["G2", "Duschen mit Atemschutzmaske wurde erklärt"],
      ["G3", "Reinigung und Aufbewahrung der Atemschutzmaske erklärt"],
      ["G4", "Dekontamination von Werkzeugen und Geräten erklärt"],
      ["G5", "Dekontamination und Verpackung von Abfällen erklärt"],
    ],
  },
  {
    titel: "H Notfälle",
    fragen: [
      ["H1", "Verhalten bei Atemproblemen oder Übelkeit erklärt"],
      ["H2", "Verhalten bei Unfall innerhalb der Zone erklärt"],
      ["H3", "Notausgänge und Rettungswege gezeigt"],
      ["H4", "Feuerlöscher, Erste-Hilfe-Ausrüstung und Notfallnummern gezeigt"],
      ["H5", "Verhalten bei Alarm praktisch erklärt"],
    ],
  },
  {
    titel: "I Abschlusskontrolle",
    fragen: [
      ["I1", "Mitarbeiter kann die wichtigsten Gefahren von Asbest erklären"],
      ["I2", "Mitarbeiter kann PSA selbstständig korrekt anlegen"],
      ["I3", "Mitarbeiter kann korrekt ein- und ausschleusen"],
      ["I4", "Mitarbeiter kennt das Verhalten bei Notfällen"],
      ["I5", "Mitarbeiter ist bereit, zunächst unter Begleitung zu arbeiten"],
    ],
  },
];


const as8 = [
  {
    titel: "A Projekt-Perimeter",
    fragen: [
      ["A1", "Wurde der ganze Bereich, der umgebaut wird, auch untersucht?"],
    ],
  },
  {
    titel: "B Vorbehalte",
    fragen: [
      ["B1", "Gibt es gemäss Gutachten einzelne Räume, die nicht untersucht werden konnten?"],
      ["B2", "Gibt es gemäss Gutachten einzelne Bauteile, die nicht untersucht werden konnten?"],
      ["B3", "Bei widersprüchlichen Laborresultaten: Ist die Schlussfolgerung und das weitere Vorgehen klar?"],
    ],
  },
  {
    titel: "C Vollständigkeit",
    fragen: [
      ["C1", "Wurden alle Verputztypen beprobt?"],
      ["C2", "Wurde bei asbesthaltigem Verputz abgeklärt, welche Schicht asbesthaltig ist?"],
      ["C3", "Wurden alle verschiedenen Fliesenkleber und Bodenbeläge beprobt?"],
      ["C4", "Wurden bei grossen Verputzflächen mehr als nur eine Probe genommen?"],
    ],
  },
  {
    titel: "D Weiteres",
    fragen: [
      ["D1", "Ist der Bericht nicht älter als ungefähr 3 Jahre?"],
      ["D2", "Ist die Untersuchungstiefe ausreichend?"],
    ],
  },
];


const as3 = [
  {
    titel: "G Schlusskontrolle allgemein",
    fragen: [
      ["G1", "Ist das Unterdrucksystem noch in Betrieb und beträgt der Messwert mindestens 20 Pa?"],
      ["G2", "Wurden die Vorfilter der UHG ausgetauscht oder abgedeckt?"],
      ["G3", "Ist die Bereichsausleuchtung ausreichend?"],
      ["G4", "Ist die Sanierungszone leergeräumt und trocken?"],
      ["G5", "Sind sichtbare Asbestreste vollständig entfernt? Alle Flächen wurden aus unmittelbarer Nähe mit guter Beleuchtung kontrolliert."],
      ["G6", "Sind verbleibende asbesthaltige Materialien dokumentiert und wurde der Bauherr schriftlich informiert?"],
      ["G7", "Sind die Schleusen leergeräumt, sauber und trocken?"],
      ["G8", "Sind auch auf, hinter und unter fest installierten Einrichtungen keine Staubspuren vorhanden?"],
      ["G9", "Sind Gerüstgelenke, Trittflächen und Treppen staubfrei und trocken?"],
      ["G10", "Ist poröses Material wie Kork oder Mineralwolle in der Zone verblieben? Falls ja: Warum?"],
      ["G11", "Sind die gereinigten Werkzeuge aus der Zone kontrolliert?"],
    ],
  },
  {
    titel: "H Schlusskontrolle durch Fachbauleitung",
    fragen: [
      ["H1", "Sind alle Punkte der vorherigen Kontrolle vollständig bearbeitet?"],
      ["H2", "Ist die visuelle Kontrolle vor der Raumluftmessung in Ordnung?"],
      ["H3", "Wurde eine Nutzungssimulation durchgeführt? Methode bitte in der Bemerkung dokumentieren."],
      ["H4", "Liegt das Resultat der Zonenfreimessung vor?"],
      ["H5", "Wurde der Bericht der visuellen Kontrolle und Raumluftmessung an den Sanierer übermittelt?"],
    ],
  },
  {
    titel: "I Abschluss der Baustelle nach Rückbau der Zone",
    fragen: [
      ["I1", "Wurden die Abschottungen korrekt und vollständig abgebaut?"],
      ["I2", "Sind die ehemaligen Andockflächen der Schutzeinrichtungen rückstandsfrei gereinigt?"],
      ["I3", "Sind alle Geräte und Hilfsmittel wie UHG, Lutten, Filter und Schleusen vollständig und rückstandsfrei abtransportiert?"],
      ["I4", "Sind alle Flächen auch ausserhalb der ehemaligen Zone sauber?"],
      ["I5", "Sind Mulden und Bauplatzinstallation inklusive Zaun, Beleuchtung und Rammschutz vollständig und rückstandsfrei geräumt?"],
    ],
  },
  {
    titel: "J Projektdokumentation durch Sanierer",
    fragen: [
      ["J1", "Baustellen-Tagebuch, Unterdruckmessungen und Schleusenjournal sind archiviert"],
      ["J2", "Entsorgungsbelege sind vollständig archiviert"],
      ["J3", "Belege der Messungen und Kontrollen durch die Fachbauleitung sind archiviert"],
      ["J4", "Projektdokumentation, Entsorgungsbelege und Schlussbericht wurden dem Auftraggeber übergeben"],
    ],
  },
  {
    titel: "K Projekt-Abschluss durch Fachbauleitung",
    fragen: [
      ["K1", "Checklisten, Laborresultate und Fotos sind vollständig abgelegt"],
      ["K2", "Entsorgungsbelege wurden kontrolliert und abgelegt"],
      ["K3", "Verbleibende Schadstoff-Vorkommen sind sauber dokumentiert"],
      ["K4", "Schlussbericht wurde an die Bauherrschaft übergeben"],
    ],
  },
];


type Mitarbeiter = {
  id: string;
  vorname: string;
  nachname: string;
  funktion: string;
  aktiv: boolean;
};

export default function ChecklistenSeite() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;
  const code = (params.code as string).toUpperCase();

  const [baustelle, setBaustelle] = useState<Baustelle | null>(null);
  const [checkliste, setCheckliste] = useState<Checkliste | null>(null);

  const [datum, setDatum] = useState("");
  const [verantwortlich, setVerantwortlich] = useState("");
  const [fachbauleiter, setFachbauleiter] = useState("");
  const [mitarbeiterId, setMitarbeiterId] = useState("");
  const [team, setTeam] = useState<Mitarbeiter[]>([]);
  const [unterschriftVerantwortlich, setUnterschriftVerantwortlich] = useState("");
  const [unterschriftMitarbeiter, setUnterschriftMitarbeiter] = useState("");
  const [unterschriftKontrolle, setUnterschriftKontrolle] = useState("");
  const [dateien, setDateien] = useState<DateiEintrag[]>([]);
  const [antworten, setAntworten] = useState<Record<string, Antwort>>({});

  useEffect(() => {
    const alle = JSON.parse(localStorage.getItem("baustellen") || "[]");

    const gefunden = alle.find((item: Baustelle) => item.id === id);
    if (!gefunden) return;

    const aktuelle = gefunden.checklisten.find(
      (item: Checkliste) => item.code === code
    );

    setBaustelle(gefunden);
    setCheckliste(aktuelle || null);

    if (aktuelle?.daten) {
      setDatum(aktuelle.daten.datum || "");
      setVerantwortlich(aktuelle.daten.verantwortlich || "");
      setFachbauleiter(aktuelle.daten.fachbauleiter || "");
      setAntworten(aktuelle.daten.antworten || {});
      setDateien(aktuelle.daten.dateien || []);
      setMitarbeiterId(aktuelle.daten.mitarbeiterId || "");
      setUnterschriftVerantwortlich(
        aktuelle.daten.unterschriftVerantwortlich || ""
      );
      setUnterschriftMitarbeiter(
        aktuelle.daten.unterschriftMitarbeiter || ""
      );
      setUnterschriftKontrolle(
        aktuelle.daten.unterschriftKontrolle || ""
      );
    }

    try {
      const personen = JSON.parse(
        localStorage.getItem("mitarbeiter") || "[]"
      );

      if (Array.isArray(personen)) {
        setTeam(
          personen.filter(
            (person: Mitarbeiter) => person.aktiv !== false
          )
        );
      }
    } catch {
      setTeam([]);
    }
  }, [id, code]);

  const bereiche =
    code === "AS1"
      ? as1
      : code === "AS2"
      ? as2
      : code === "AS3"
      ? as3
      : code === "AS4"
      ? as4
      : code === "AS5"
      ? as5
      : code === "AS6"
      ? as6
      : code === "AS7"
      ? as7
      : code === "AS8"
      ? as8
      : [];

  function setAntwort(
    frageId: string,
    feld: keyof Antwort,
    value: string
  ) {
    setAntworten((prev) => ({
      ...prev,
      [frageId]: {
        antwort: prev[frageId]?.antwort || "",
        bemerkung: prev[frageId]?.bemerkung || "",
        [feld]: value,
      },
    }));
  }

  function speichern(abschliessen: boolean) {
    const alle = JSON.parse(localStorage.getItem("baustellen") || "[]");

    // Instruktionshistorie bei abgeschlossenem AS5 / AS7
    if (
      abschliessen &&
      (code === "AS5" || code === "AS7") &&
      mitarbeiterId
    ) {
      const historie = JSON.parse(
        localStorage.getItem("instruktionshistorie") || "[]"
      );

      const mitarbeiter = team.find(
        (m) => m.id === mitarbeiterId
      );

      if (mitarbeiter) {
        const neuerEintrag = {
          id: crypto.randomUUID(),
          mitarbeiterId: mitarbeiter.id,
          mitarbeiterName:
            mitarbeiter.vorname + " " + mitarbeiter.nachname,
          funktion: mitarbeiter.funktion,
          baustelleId: id,
          baustelle:
            baustelle?.nummer + " · " + baustelle?.projektname,
          code,
          bezeichnung:
            code === "AS5"
              ? "Instruktion Mitarbeiter"
              : "Erstinstruktion Asbest-Arbeiter",
          datum: datum || new Date().toISOString().split("T")[0],
          verantwortlich,
          erstelltAm: new Date().toISOString(),
        };

        historie.push(neuerEintrag);

        localStorage.setItem(
          "instruktionshistorie",
          JSON.stringify(historie)
        );
      }
    }

    const aktualisiert = alle.map((item: Baustelle) => {
      if (item.id !== id) return item;

      const neueChecklisten = item.checklisten.map((c) => {
        if (c.code !== code) return c;

        return {
          ...c,
          status: abschliessen ? "Abgeschlossen" : "In Bearbeitung",
          daten: {
            datum,
            verantwortlich,
            fachbauleiter,
            mitarbeiterId,
            antworten,
            dateien,
            unterschriftVerantwortlich,
            unterschriftMitarbeiter,
            unterschriftKontrolle,
          },
        };
      });

      const abgeschlossen = neueChecklisten.filter(
        (c) => c.status === "Abgeschlossen"
      ).length;

      return {
        ...item,
        checklisten: neueChecklisten,
        fortschritt: Math.round(
          (abgeschlossen / neueChecklisten.length) * 100
        ),
      };
    });

    localStorage.setItem("baustellen", JSON.stringify(aktualisiert));
    router.push(`/baustellen/${id}`);
  }

  if (!baustelle || !checkliste) {
    return (
      <main className="min-h-screen bg-slate-50 p-10">
        Checkliste wird geladen...
      </main>
    );
  }

  if (bereiche.length === 0) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <a href={`/baustellen/${id}`} className="text-sm text-slate-500">
          ← Zurück zur Baustelle
        </a>

        <div className="mx-auto mt-8 max-w-3xl rounded-2xl border bg-white p-8">
          <div className="font-bold text-[#e77818]">{code}</div>
          <h1 className="mt-1 text-2xl font-bold">{checkliste.name}</h1>
          <p className="mt-4 text-slate-500">
            Diese Original-Checkliste bauen wir als Nächstes ein.
          </p>
        </div>
      </main>
    );
  }

  return (
    <AppShell
      title={`${code} · ${checkliste.name}`}
      subtitle={`${baustelle.nummer} · ${baustelle.projektname}`}
      backHref={`/baustellen/${id}`}
      backLabel="Zur Baustelle"
    >

      

      <div className="bb-workspace max-w-6xl space-y-6">

        <div className="hidden print:block">
          <div className="mb-6 border-b-4 border-[#e77818] pb-4">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-black tracking-tight">
                  B&B
                </div>
                <div className="text-sm font-bold uppercase tracking-wide">
                  Schadstoffsanierung
                </div>
              </div>

              <div className="text-right">
                <div className="text-xl font-bold">
                  {code} · {checkliste.name}
                </div>

                <div className="mt-1 text-sm">
                  {baustelle.nummer} · {baustelle.projektname}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">

          <div className="grid gap-5 md:grid-cols-3">

            <Feld
              label="Datum"
              type="date"
              value={datum}
              onChange={setDatum}
            />

            <Feld
              label="Verantwortlicher Sanierer"
              value={verantwortlich}
              onChange={setVerantwortlich}
            />

            <Feld
              label="Fachbauleiter"
              value={fachbauleiter}
              onChange={setFachbauleiter}
            />

          </div>

        </div>


        {(code === "AS5" || code === "AS7") && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <div className="text-xs font-black uppercase tracking-[0.14em] text-[#e77818]">
                Instruktion
              </div>
              <h2 className="mt-1 text-lg font-bold">
                Mitarbeiter auswählen
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Der abgeschlossene Nachweis wird automatisch in der
                Instruktionshistorie gespeichert.
              </p>
            </div>

            <div className="bb-field max-w-xl">
              <label htmlFor="instruktion-mitarbeiter">
                Instruierter Mitarbeiter *
              </label>

              <select
                id="instruktion-mitarbeiter"
                className="bb-select"
                value={mitarbeiterId}
                onChange={(event) =>
                  setMitarbeiterId(event.target.value)
                }
              >
                <option value="">Mitarbeiter auswählen …</option>

                {team.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.vorname} {person.nachname}
                    {" · "}
                    {person.funktion}
                  </option>
                ))}
              </select>

              {team.length === 0 && (
                <p className="mt-3 text-xs text-orange-700">
                  Im Mitarbeiterstamm ist noch keine aktive Person erfasst.
                </p>
              )}
            </div>
          </section>
        )}

        {bereiche.map((bereich) => (
          <section
            key={bereich.titel}
            className="overflow-hidden rounded-2xl border bg-white shadow-sm"
          >

            <div className="border-b bg-slate-50 px-6 py-4">
              <h2 className="text-lg font-bold">
                {bereich.titel}
              </h2>
            </div>

            <div className="divide-y">

              {bereich.fragen.map(([frageId, frage]) => {
                const wert = antworten[frageId] || {
                  antwort: "",
                  bemerkung: "",
                };

                return (
                  <div key={frageId} className="p-5">

                    <div className="grid gap-5 lg:grid-cols-[1fr_280px]">

                      <div>

                        <div className="flex gap-3">

                          <span className="font-bold text-[#e77818]">
                            {frageId}
                          </span>

                          <p className="font-medium">
                            {frage}
                          </p>

                        </div>

                        <textarea
                          rows={2}
                          value={wert.bemerkung}
                          onChange={(e) =>
                            setAntwort(
                              frageId,
                              "bemerkung",
                              e.target.value
                            )
                          }
                          placeholder="Bemerkung..."
                          className="mt-4 w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-[#e77818]"
                        />

                      </div>

                      <div className="grid grid-cols-3 gap-2">

                        {(code === "AS8" ? ["Ja", "Nein", "Unklar"] : ["Ja", "Nein", "N/A"]).map((option) => (

                          <button
                            key={option}
                            type="button"
                            onClick={() =>
                              setAntwort(
                                frageId,
                                "antwort",
                                option
                              )
                            }
                            className={`rounded-xl border px-3 py-3 text-sm font-semibold ${
                              wert.antwort === option
                                ? "border-[#e77818] bg-[#e77818] text-white"
                                : "border-slate-300 bg-white hover:bg-slate-50"
                            }`}
                          >
                            {option}
                          </button>

                        ))}

                      </div>

                    </div>

                  </div>
                );
              })}

            </div>

          </section>
        ))}

        <section className="rounded-2xl border bg-white p-6 shadow-sm">

          <h2 className="text-lg font-bold">
            Fotos & Anhänge
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Baustellenfotos, Pläne, Gutachten oder weitere Nachweise
          </p>

          <div className="mt-5">
            <FileUpload
              value={dateien}
              onChange={setDateien}
            />
          </div>

        </section>

        {["AS1", "AS2", "AS3", "AS4", "AS6", "AS8"].includes(code) && (
          <section className="rounded-2xl border bg-white p-6 shadow-sm">

            <h2 className="text-lg font-bold">
              Unterschriften
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Bestätigung und Freigabe dieser Checkliste
            </p>

            <div className="mt-6 grid gap-8 lg:grid-cols-2">

              <SignaturePad
                label="Verantwortliche Person"
                value={unterschriftVerantwortlich}
                onChange={setUnterschriftVerantwortlich}
              />

              <SignaturePad
                label="Fachbauleitung / Kontrolle"
                value={unterschriftKontrolle}
                onChange={setUnterschriftKontrolle}
              />

            </div>

          </section>
        )}

        {(code === "AS5" || code === "AS7") && (
          <section className="rounded-2xl border bg-white p-6 shadow-sm">

            <h2 className="text-lg font-bold">
              Unterschriften
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Bestätigung der durchgeführten Instruktion
            </p>

            <div className="mt-6 grid gap-8 lg:grid-cols-2">

              <SignaturePad
                label="Verantwortlicher Sanierer / Instruktor"
                value={unterschriftVerantwortlich}
                onChange={setUnterschriftVerantwortlich}
              />

              <SignaturePad
                label="Instruierter Mitarbeiter"
                value={unterschriftMitarbeiter}
                onChange={setUnterschriftMitarbeiter}
              />

            </div>

          </section>
        )}

        <div className="sticky bottom-4 rounded-2xl border bg-white p-4 shadow-lg">

          <div className="flex flex-col justify-end gap-3 sm:flex-row">

            <button
              type="button"
              onClick={() => window.print()}
              className="print:hidden rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white"
            >
              Als PDF speichern
            </button>

            <button
              type="button"
              onClick={() => speichern(false)}
              className="rounded-xl border border-slate-300 px-5 py-3 font-semibold"
            >
              Zwischenspeichern
            </button>

            <button
              type="button"
              onClick={() => speichern(true)}
              className="rounded-xl bg-[#e77818] px-6 py-3 font-semibold text-white"
            >
              {code} abschliessen
            </button>

          </div>

        </div>

      </div>

    </AppShell>
  );
}

function Feld({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-semibold">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#e77818]"
      />

    </div>
  );
}
