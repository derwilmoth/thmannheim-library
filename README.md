# High Availability System Architecture

## 1. Übersicht

Dieses Dokument beschreibt die Architektur des hochverfügbaren (HA) Web-Applikations-Clusters auf Basis von Proxmox VE. Das System ist darauf ausgelegt, den Ausfall von bis zu zwei physischen Knoten zu tolerieren, ohne dass der Dienst für den Endnutzer unterbrochen wird.

**Kernkomponenten:**

- **Infrastructure:** 3x Proxmox VE Nodes (Cluster)
- **Frontend/Backend:** Next.js (Node.js) Web Application
- **Database:** MongoDB Replica Set
- **Routing:** Nginx Reverse Proxy & Load Balancer + Keepalived (Floating IP)

---

## 2. Netzwerk-Topologie & IP-Plan

Das System nutzt ein internes Netzwerk `192.168.30.0/24`.

| Service               | Container ID | Hostname | IP-Adresse         | Port (Intern) | Rolle                   |
| :-------------------- | :----------- | :------- | :----------------- | :------------ | :---------------------- |
| **Floating IP (VIP)** | -            | -        | **192.168.30.200** | 80 / 443      | Einstiegspunkt für User |
| **Load Balancer 1**   | 100          | nginx1   | 192.168.30.100     | 80            | Master LB               |
| **Load Balancer 2**   | 101          | nginx2   | 192.168.30.101     | 80            | Backup LB               |
| **Load Balancer 3**   | 102          | nginx3   | 192.168.30.102     | 80            | Backup LB               |
| **MongoDB 1**         | 103          | mongo1   | 192.168.30.103     | 27017         | DB Node                 |
| **MongoDB 2**         | 104          | mongo2   | 192.168.30.104     | 27017         | DB Node                 |
| **MongoDB 3**         | 105          | mongo3   | 192.168.30.105     | 27017         | DB Node                 |
| **WebApp 1**          | 106          | webapp1  | 192.168.30.106     | 3000          | Application             |
| **WebApp 2**          | 107          | webapp2  | 192.168.30.107     | 3000          | Application             |
| **WebApp 3**          | 108          | webapp3  | 192.168.30.108     | 3000          | Application             |

---

## 3. Datenfluss (Request Flow)

1.  **User Request:** Ein Client ruft die Domain auf, die auf die Floating IP **192.168.30.200** zeigt.
2.  **High Availability Entry (Keepalived):**
    - Das Paket landet bei dem LXC-Container, der aktuell den `MASTER` Status hat (z.B. LXC 100).
    - Fällt dieser Node aus, schwenkt die IP `.200` automatisch innerhalb von Sekunden auf LXC 101 oder 102 (VRRP Protokoll).
3.  **Load Balancing (Nginx):**
    - Nginx nimmt die Anfrage auf Port 80 entgegen.
    - **Rate Limiting:** Schutz vor DDoS (Burst 100, Rate 10r/s).
    - **Sticky Sessions:** Dank `ip_hash` wird ein User anhand seiner IP immer an denselben WebApp-Container weitergeleitet (verhindert Session-Verlust und Asset-Loading-Fehler).
4.  **Application Layer (Next.js):**
    - Nginx leitet weiter an `http://192.168.30.10x:3000`.
    - Die Next.js App wird via **PM2** verwaltet (Autostart, Restart on Crash).
5.  **Data Layer (MongoDB):**
    - Die App verbindet sich via Connection String an das Replica Set.
    - Schreibvorgänge gehen immer an den aktuellen `PRIMARY` Node.
    - Lesevorgänge können verteilt werden, standardmäßig aber auch über Primary.

---

## 4. Konfigurations-Details

### Nginx (Load Balancer)

- **Upstream:** Nutzt `ip_hash` für Persistenz.
- **Health Checks:** Passiv (`max_fails=2`, `fail_timeout=5s`).
- **Rate Limit:** Zone `mein_limit` (10MB Speicher), Status 429 bei Blockierung.

### MongoDB Replica Set

- **Name:** `rs0` (oder spezifischer Name).
- **Architektur:** PSS (Primary-Secondary-Secondary).
- **Failover:** Automatische Neuwahl eines Primary, wenn der aktuelle ausfällt.

### Next.js App

- **Environment:** Production Build.
- **Process Manager:** PM2 Cluster Mode möglich, aktuell Fork Mode.
- **Start:** Via `pm2 startup` systemd Service.

---

## 5. Security Maßnahmen

- **Nginx:** Rate Limiting aktiviert.
- **LXC:** Container laufen (teilweise) unprivileged / nesting aktiviert für Keepalived.
- **Netzwerk:** Interne Kommunikation getrennt vom Public Traffic (via Firewall/VLAN Rules auf Host-Ebene zu steuern).
