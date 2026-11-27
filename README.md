# 🎬 kinderfilm – Film-Studio für Kinder

Eine Web-App für Kinder: Fotos aufnehmen, daraus einen kleinen Film bauen,
mit Musik und Tönen untermalen, anschauen und als WebM-Video speichern.
Alles läuft direkt im Browser – ohne Anmeldung, ohne Server, ohne Installation.

## Funktionen

- 📷 **Fotos aufnehmen** – mit der Webcam (mehrere Fotos hintereinander, jedes Foto wird eine Szene) oder 🖼️ Fotos hochladen
- 🎞️ **Szenen verwalten**
  - aktivieren / deaktivieren (ruhende Szenen landen nicht im Film)
  - löschen
  - tauschen (nach vorn oder hinten schieben)
  - Dauer pro Szene einstellen (0,5–6 Sekunden)
- 🎵 **Musik & Töne** – Melodien und Geräusche werden live mit der Web Audio API erzeugt
  - Hintergrundmusik wählen: 🌞 Sonnentanz, ✨ Funkelstern, 🚶 Hänschen klein, 🌙 Mondwiese,
    🚀 Sternenflotte (Raumopern-Fanfare), 🦈 Spannung, 🗺️ Abenteuer, 👻 Geistervilla
  - pro Szene einen Ton anhängen (Pling, Plop, Ente, Hund, Boing, Donner, Trommel, Fanfare)
  - Lautstärke regeln, Töne vorab antesten
- 🍿 **Vorschau** – Film im Kino-Bereich abspielen (Titelkarte, sanfte Überblendungen, leichter Zoomeffekt)
- ⬇️ **WebM-Export** – Film als Video-Datei `kinderfilm.webm` speichern (Bild + Ton)
- 💾 **Projekt speichern / laden** – das ganze Projekt (Fotos, Szenen, Musik, Töne) als JSON-Datei sichern und wieder öffnen

## Starten

Einfach `index.html` im Browser öffnen (am besten Chrome oder Edge) – oder lokal einen Mini-Server starten:

```bash
python3 -m http.server 8000
# dann http://localhost:8000 öffnen
```

Für die **Kamera** braucht der Browser eine sichere Verbindung (https oder `localhost`).
Auf GitHub Pages funktioniert die Kamera automatisch.

## Technik

- Reines HTML/CSS/JavaScript, kein Framework, kein Build-Schritt
- Kamera: `getUserMedia`
- Musik & Töne: Web Audio API (alles synthetisiert, keine Audiodateien)
- Video-Export: `canvas.captureStream` + `MediaRecorder` (WebM/VP9 mit Opus-Ton)
- Projektformat: JSON (Fotos als Data-URLs eingebettet)

## Datenschutz

Bilder und Projekte bleiben im Browser des Kindes – nichts wird hochgeladen.
Die App speichert nichts auf einem Server.

## Empfohlene Veröffentlichung

Über GitHub Pages aktivieren (Settings → Pages → Branch `main`), dann ist die App
unter `https://<benutzer>.github.io/kinderfilm/` erreichbar.
