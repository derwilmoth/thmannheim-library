# HVS Systemarchitektur: High Availability Cluster

**Stand:** Dezember 2025
**Plattform:** Proxmox VE 9.0.3 (3-Node Cluster)

## 1. Management Summary

Dieses Dokument beschreibt die Architektur eines hochverfügbaren (High Availability - HA) Web-Applikations-Stacks. Das System ist darauf ausgelegt, Hardwareausfälle (Ausfall eines gesamten Nodes), Softwarefehler (Absturz eines Services) und Lastspitzen (DDoS-Schutz) automatisch abzufangen, ohne den Dienst für den Endnutzer zu unterbrechen. Zusätzlich ist eine automatisierte Backup-Strategie für Disaster Recovery implementiert.

---

## 2. Infrastruktur-Topologie & IP-Plan

Das System läuft auf einem **3-Node Proxmox Cluster**. Jeder physische Node hostet jeweils eine Instanz jeder Architekturschicht in isolierten LXC-Containern.

**IP-Schema:** `192.168.30.{ContainerID}`

| Rolle                 | Container ID | Hostname | IP-Adresse         | Physischer Host     |
| :-------------------- | :----------- | :------- | :----------------- | :------------------ |
| **Floating IP (VIP)** | -            | -        | **192.168.30.200** | _Wandert dynamisch_ |
| **Load Balancer 1**   | 100          | nginx1   | 192.168.30.100     | CoolerHostname      |
| **Load Balancer 2**   | 101          | nginx2   | 192.168.30.101     | CoolerHostname2     |
| **Load Balancer 3**   | 102          | nginx3   | 192.168.30.102     | CoolerHostname3     |
| **MongoDB 1**         | 103          | mongo1   | 192.168.30.103     | CoolerHostname      |
| **MongoDB 2**         | 104          | mongo2   | 192.168.30.104     | CoolerHostname2     |
| **MongoDB 3**         | 105          | mongo3   | 192.168.30.105     | CoolerHostname3     |
| **WebApp 1**          | 106          | webapp1  | 192.168.30.106     | CoolerHostname      |
| **WebApp 2**          | 107          | webapp2  | 192.168.30.107     | CoolerHostname2     |
| **WebApp 3**          | 108          | webapp3  | 192.168.30.108     | CoolerHostname3     |

---

## 3. Architektur-Komponenten & Services

### Schicht 1: Entry Point & Load Balancing

Diese Schicht empfängt den Traffic auf der Floating IP, filtert ihn und verteilt ihn an die Applikationen.

- **Technologie:** Nginx + Keepalived (VRRP)
- **HA-Mechanismus (Floating IP):**
  - Keepalived nutzt das VRRP-Protokoll, um die IP `.200` hochverfügbar zu halten.
  - **Priorisierung (Wahl des Masters):** Damit definiert ist, welcher Container die IP bevorzugt hält, wurden Prioritäts-Punkte vergeben (Höhere Zahl = Höhere Prio):
    - Container 100: **VRRP Prio 101** (Bevorzugter Master)
    - Container 101: **VRRP Prio 100** (Backup 1)
    - Container 102: **VRRP Prio 99** (Backup 2)
- **Verteilungs-Mechanismus:**
  - Nginx verteilt Anfragen an die App-Layer-IPs (`.106`, `.107`, `.108`).

### Schicht 2: Application Layer

Hier läuft die eigentliche Geschäftslogik.

- **Technologie:** Next.js (Node.js) + PM2 Process Manager
- **Port:** Intern 3000 (Vom LB via Port 80 angesprochen).
- **Resilienz:**
  - **PM2:** Überwacht den Node.js Prozess. Startet die App bei Absturz (Crash) oder Container-Neustart (via `systemd` Integration) automatisch neu.

### Schicht 3: Data Layer (Persistenz)

Datenhaltung mit automatischer Replikation.

- **Technologie:** MongoDB Replica Set
- **Konfiguration:** PSS (Primary-Secondary-Secondary).
- **HA-Mechanismus:**
  - Automatisches Failover (Election) eines neuen Primary-Nodes bei Ausfall eines Knotens. Connection String in der WebApp (`mongodb://.../?replicaSet=rs0`) sorgt für automatisches Routing.

---

## 4. Implementierte Hochverfügbarkeits-Features (Deep Dive)

### 4.1. Sticky Sessions (Session Persistence)

- **Problem:** Next.js lädt Client-Side-Assets (Chunks, CSS) asynchron nach. Round-Robin-Verteilung führte dazu, dass Assets von Servern angefragt wurden, die diese Version noch nicht kannten (Resultat: "White Screen").
- **Lösung:** Umstellung auf **`ip_hash`**.
- **Funktionsweise:** Nginx bindet einen User anhand seiner IP-Adresse an einen spezifischen Backend-Server (z.B. User A -> Webapp 106). Nur bei Ausfall von 106 wird der User auf 107 umgeleitet.

### 4.2. DDoS Schutz & Rate Limiting

- **Problem:** Schutz der Web-Apps vor Überlastung. Ein zu strenges Limit blockierte initial das Laden der App.
- **Konfiguration:**
  - **Zone:** `limit_req_zone $binary_remote_addr zone=mein_limit:10m rate=20r/s;`
  - **Regel:** `limit_req zone=mein_limit burst=100 nodelay;`
- **Erklärung:**
  - **`rate=20r/s`**: Erlaubt dauerhaft 20 Anfragen pro Sekunde pro IP.
  - **`burst=100`**: Erlaubt kurzzeitige Spitzen (bis zu 100 Requests gleichzeitig), was für das initiale Laden einer Next.js App (viele kleine JS-Dateien) essenziell ist.

### 4.3. Health Checks (Passive)

- **Konfiguration:** `max_fails=2 fail_timeout=5s`
- **Funktion:** Nginx erkennt defekte Container. Wenn 2 Verbindungsversuche fehlschlagen, wird der Container für 5 Sekunden aus dem Load Balancing genommen.

---

## 5. Backup & Disaster Recovery

Als letzte Sicherheitsstufe gegen Datenverlust (z.B. User-Error) wurde ein automatisiertes Backup eingerichtet.

### 5.1. Backup Job Konfiguration

- **Software:** Proxmox Vzdump.
- **Ziel:** Alle LXC Container (100-108).
- **Zeitplan:** **Mo-Fr 00:00 Uhr**.
- **Retention Policy:** `keep-last=5` (Es werden immer die 5 aktuellsten Backups behalten, ältere rotieren raus).
- **Modus:** `Snapshot` (Backup im laufenden Betrieb ohne Downtime).

---

## 6. Kennzahlen & Konfigurations-Übersicht

| Feature              | Kennzahl / Wert     | Erläuterung                             |
| :------------------- | :------------------ | :-------------------------------------- |
| **Floating IP**      | `192.168.30.200`    | Zentraler Zugangspunkt                  |
| **Keepalived Prio**  | `101` (auf Ctn 100) | Bestimmt den Master                     |
| **Keepalived Prio**  | `100` (auf Ctn 101) | Bestimmt Backup 1                       |
| **Keepalived Prio**  | `99` (auf Ctn 102)  | Bestimmt Backup 2                       |
| **LB Algorithmus**   | `ip_hash`           | Fix für "White Screen" / Sticky Session |
| **Rate Limit**       | `20r/s` (Burst 100) | DDoS Schutz optimiert für Next.js       |
| **App Port**         | `3000`              | Interner App Port                       |
| **DB Replikation**   | Replica Set (`rs0`) | Datensicherheit                         |
| **Backup Zyklus**    | Tgl. (Mo-Fr)        | Snapshot Sicherung                      |
| **Backup Retention** | 5 Versionen         | Rollback-Möglichkeit                    |
