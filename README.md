# SportPortal

Een beveiligde webapplicatie (sportportaal) waar klanten hun groepslessen kunnen bekijken en beheren. Gebruikers kunnen zien voor welke lessen ze staan ingeschreven en zichzelf aan- of afmelden. Omdat de applicatie werkt met persoonsgegevens (accountgegevens, inschrijvingen), is security vanaf het begin meegenomen in het ontwerp.

---

## Inhoudsopgave

1. [Wat doet de applicatie?](#wat-doet-de-applicatie)
2. [Architectuur](#architectuur)
3. [Mappenstructuur](#mappenstructuur)
4. [Vereisten](#vereisten)
5. [Installatie & Starten](#installatie--starten)
6. [Demo Accounts](#demo-accounts)
7. [Functionaliteiten](#functionaliteiten)
8. [API Endpoints](#api-endpoints)
9. [Beveiliging](#beveiliging)
10. [Technologieën](#technologieën)
11. [Configuratie](#configuratie)

---

## Wat doet de applicatie?

SportPortal is een portaal voor een sportschool/sportvereniging. Klanten kunnen:

- **Inloggen / Registreren** met een beveiligd account
- **Alle groepslessen bekijken** per dag van de week (Yoga, Spinning, CrossFit, etc.)
- **Zich inschrijven** voor een les (mits er nog plek is)
- **Zich afmelden** voor een les waar ze al voor ingeschreven staan
- **Hun eigen inschrijvingen bekijken** op een overzichtspagina

De applicatie toont ook real-time hoeveel plekken er nog beschikbaar zijn per les.

---

## Architectuur

De applicatie bestaat uit twee servers en een database:

```
┌─────────────────────┐         ┌─────────────────────┐         ┌─────────────────┐
│                     │  HTTP   │                     │  SQL    │                 │
│   React Frontend    │────────▶│   Express API       │────────▶│   SQLite DB     │
│   (Vite)            │  JSON   │   (Node.js)         │         │                 │
│   Port 5173         │◀────────│   Port 3001         │◀────────│  sportportal.db │
│                     │         │                     │         │                 │
└─────────────────────┘         └─────────────────────┘         └─────────────────┘
     Presentatielaag                 Applicatielaag                  Datalaag
```

| Laag | Technologie | Beschrijving |
|---|---|---|
| **Frontend** | React 18 + Vite | Gebruikersinterface, formulieren, routing |
| **Backend** | Express (Node.js) | REST API, authenticatie, business logic |
| **Database** | SQLite | Opslag van gebruikers, lessen en inschrijvingen |

De frontend communiceert met de backend via JSON over HTTP. De Vite dev server proxied `/api` requests naar de Express server, zodat er geen CORS-problemen zijn tijdens development.

---

## Mappenstructuur

```
sport app/
├── README.md                          # Dit bestand
│
├── backend/                           # Applicatieserver (API)
│   ├── .env                           # Omgevingsvariabelen (NIET committen!)
│   ├── .gitignore
│   ├── package.json
│   └── src/
│       ├── server.js                  # Express server opzet & middleware
│       ├── seed.js                    # Database vullen met voorbeelddata
│       ├── config/
│       │   └── database.js            # SQLite connectie & tabelcreatie
│       ├── middleware/
│       │   ├── auth.js                # JWT authenticatie & autorisatie middleware
│       │   └── validate.js            # Input validatie middleware
│       └── routes/
│           ├── auth.js                # Login, registratie, profiel endpoints
│           ├── lessons.js             # Groepslessen endpoints
│           └── registrations.js       # Aan-/afmeld endpoints
│
├── frontend/                          # Presentatieserver (UI)
│   ├── index.html                     # HTML entry point
│   ├── vite.config.js                 # Vite configuratie + API proxy
│   ├── package.json
│   └── src/
│       ├── main.jsx                   # React entry point
│       ├── App.jsx                    # Routing & layout
│       ├── App.css                    # Alle styling
│       ├── api/
│       │   └── client.js             # API client met automatische JWT-handling
│       ├── context/
│       │   └── AuthContext.jsx        # Auth state management (login/logout/register)
│       ├── components/
│       │   ├── Navbar.jsx             # Navigatiebalk
│       │   ├── LessonCard.jsx         # Les-kaart component
│       │   └── ProtectedRoute.jsx     # Route guard (redirect als niet ingelogd)
│       └── pages/
│           ├── Login.jsx              # Inlogpagina
│           ├── Register.jsx           # Registratiepagina
│           ├── Dashboard.jsx          # Overzicht alle groepslessen
│           └── MyLessons.jsx          # Mijn inschrijvingen
│
└── sportportal.db                     # SQLite database (aangemaakt na seed)
```

---

## Vereisten

- **Node.js** versie 18 of hoger — [Download](https://nodejs.org/)
- **npm** wordt meegeleverd met Node.js

Controleer of Node.js is geïnstalleerd:
```bash
node --version    # Moet v18+ zijn
npm --version
```

---

## Installatie & Starten

### Stap 1: Backend installeren en seeden

```bash
cd backend
npm install
npm run seed
```

`npm run seed` maakt de database aan (`sportportal.db`) en vult deze met:
- 3 demo-gebruikers (1 admin, 2 klanten)
- 12 groepslessen verspreid over de week
- Enkele demo-inschrijvingen

### Stap 2: Backend starten

```bash
npm run dev
```

De API draait nu op **http://localhost:3001**. Je ziet:
```
🏟️  SportPortal API draait op http://localhost:3001
```

### Stap 3: Frontend installeren en starten

Open een **nieuwe terminal** en voer uit:

```bash
cd frontend
npm install
npm run dev
```

De React app draait nu op **http://localhost:5173**.

### Stap 4: Applicatie openen

Ga in je browser naar **[http://localhost:5173](http://localhost:5173)**

> **Let op:** Beide servers (backend én frontend) moeten tegelijk draaien. Gebruik twee aparte terminals.

---

## Demo Accounts

Na het seeden zijn de volgende accounts beschikbaar:

| Rol | Naam | E-mail | Wachtwoord |
|---|---|---|---|
| Admin | Admin | admin@sportportal.nl | Admin123! |
| Klant | Jan de Vries | jan@example.nl | Demo1234 |
| Klant | Lisa Bakker | lisa@example.nl | Demo1234 |

Jan en Lisa hebben al enkele inschrijvingen zodat je direct kunt zien hoe de app werkt.

---

## Functionaliteiten

### Voor klanten (na inloggen)

| Functie | Beschrijving |
|---|---|
| **Lessen bekijken** | Alle groepslessen gegroepeerd per dag van de week |
| **Inschrijven** | Klik op "Inschrijven" bij een les om je aan te melden |
| **Afmelden** | Klik op "Afmelden" om je uit te schrijven |
| **Mijn Inschrijvingen** | Overzichtspagina van alle lessen waarvoor je bent ingeschreven |
| **Beschikbaarheid** | Zie hoeveel plekken er nog vrij zijn per les |
| **Vol-indicatie** | Als een les vol is, kun je je niet meer inschrijven |

### Applicatieflow

```
Gebruiker opent app
       │
       ▼
   Ingelogd? ──Nee──▶ Login / Registreer pagina
       │                        │
      Ja                    Inloggen
       │                        │
       ▼                        ▼
   Dashboard ◀──────────────────┘
   (alle lessen)
       │
       ├──▶ Inschrijven / Afmelden voor een les
       │
       └──▶ "Mijn Inschrijvingen" pagina
            (overzicht eigen lessen)
```

---

## API Endpoints

Alle endpoints (behalve login/register) vereisen een JWT token in de `Authorization` header:
```
Authorization: Bearer <jwt-token>
```

### Authenticatie (`/api/auth`)

| Methode | Endpoint | Beschrijving | Auth vereist |
|---|---|---|---|
| POST | `/api/auth/register` | Nieuw account aanmaken | Nee |
| POST | `/api/auth/login` | Inloggen, JWT token ontvangen | Nee |
| GET | `/api/auth/me` | Huidige gebruikersinfo ophalen | Ja |

**Register body:**
```json
{
  "name": "Jan Jansen",
  "email": "jan@example.nl",
  "password": "MijnWachtwoord1"
}
```

**Login body:**
```json
{
  "email": "jan@example.nl",
  "password": "MijnWachtwoord1"
}
```

### Groepslessen (`/api/lessons`)

| Methode | Endpoint | Beschrijving | Auth vereist |
|---|---|---|---|
| GET | `/api/lessons` | Alle lessen ophalen (incl. registratiestatus) | Ja |
| GET | `/api/lessons/:id` | Eén specifieke les ophalen | Ja |

### Inschrijvingen (`/api/registrations`)

| Methode | Endpoint | Beschrijving | Auth vereist |
|---|---|---|---|
| GET | `/api/registrations` | Alle inschrijvingen van de ingelogde gebruiker | Ja |
| POST | `/api/registrations/:lessonId` | Inschrijven voor een les | Ja |
| DELETE | `/api/registrations/:lessonId` | Afmelden voor een les | Ja |

### Health Check

| Methode | Endpoint | Beschrijving |
|---|---|---|
| GET | `/api/health` | Server status check |

---

## Beveiliging

Omdat deze applicatie werkt met persoonsgegevens, zijn de volgende beveiligingsmaatregelen geïmplementeerd:

### Authenticatie & Autorisatie

| Maatregel | Implementatie | Waarom |
|---|---|---|
| **Wachtwoord hashing** | bcrypt met 12 salt rounds | Wachtwoorden worden nooit als plain text opgeslagen. Bij een datalek zijn wachtwoorden niet leesbaar. |
| **JWT tokens** | JSON Web Tokens met 24 uur expiratie | Stateless authenticatie. Tokens verlopen automatisch, gebruikers moeten opnieuw inloggen. |
| **Beschermde routes** | Middleware controleert JWT bij elk request | Ongeautoriseerde gebruikers hebben geen toegang tot data. |
| **User enumeration preventie** | Generieke foutmelding "Ongeldige inloggegevens" | Aanvallers kunnen niet achterhalen welke e-mailadressen geregistreerd zijn. |

### Invoerbeveiliging

| Maatregel | Implementatie | Waarom |
|---|---|---|
| **Input validatie** | express-validator op alle endpoints | Voorkomt ongeldige of kwaadaardige invoer (bv. scripts in namen). |
| **Parameterized queries** | Prepared statements (better-sqlite3) | Voorkomt SQL injection aanvallen. Userinput wordt nooit direct in SQL queries geplakt. |
| **Body size limiet** | Maximaal 10KB per request | Voorkomt denial-of-service door extreem grote requests. |
| **Wachtwoordeisen** | Min. 8 tekens, hoofdletter, kleine letter, cijfer | Afdwingen van sterke wachtwoorden. |

### Netwerkbeveiliging

| Maatregel | Implementatie | Waarom |
|---|---|---|
| **Helmet** | HTTP security headers (X-Frame-Options, CSP, etc.) | Beschermt tegen clickjacking, XSS, MIME-sniffing en meer. |
| **CORS** | Alleen `http://localhost:5173` toegestaan | Voorkomt dat andere websites de API kunnen aanroepen. |
| **Rate limiting** | 100 requests/15min (algemeen), 10/15min (auth) | Voorkomt brute-force aanvallen op login en overbelasting van de server. |
| **XSS preventie** | React escaping + Helmet headers | React escaped standaard alle output, Helmet voegt extra headers toe. |

### Wat staat er in `.env` (en waarom niet committen)

Het `.env` bestand bevat gevoelige configuratie:
```
JWT_SECRET=...         # Geheime sleutel voor JWT tokens
BCRYPT_SALT_ROUNDS=12  # Sterkte van wachtwoord hashing
```
Dit bestand staat in `.gitignore` en wordt **nooit** mee-gecommit naar Git.

---

## Technologieën

### Frontend
| Technologie | Versie | Doel |
|---|---|---|
| React | 18.x | UI framework, component-gebaseerd |
| React Router | 6.x | Client-side routing (SPA) |
| Vite | 6.x | Build tool & development server |

### Backend
| Technologie | Versie | Doel |
|---|---|---|
| Node.js | 18+ | JavaScript runtime |
| Express | 4.x | Web framework voor de REST API |
| better-sqlite3 | 11.x | SQLite database driver |
| bcrypt | 5.x | Wachtwoord hashing |
| jsonwebtoken | 9.x | JWT token generatie & verificatie |
| helmet | 8.x | HTTP security headers |
| express-rate-limit | 7.x | Rate limiting |
| express-validator | 7.x | Input validatie |
| cors | 2.x | Cross-Origin Resource Sharing |
| dotenv | 16.x | Omgevingsvariabelen laden |

---

## Configuratie

Alle configuratie staat in `backend/.env`:

| Variabele | Standaard | Beschrijving |
|---|---|---|
| `PORT` | 3001 | Poort waarop de API draait |
| `JWT_SECRET` | (random string) | Geheime sleutel voor JWT — **wijzig dit in productie!** |
| `JWT_EXPIRES_IN` | 24h | Hoe lang een JWT token geldig is |
| `CORS_ORIGIN` | http://localhost:5173 | Welke frontend origin is toegestaan |
| `BCRYPT_SALT_ROUNDS` | 12 | Aantal bcrypt hashing rondes (hoger = veiliger maar trager) |

---

## Database

De database (`sportportal.db`) wordt automatisch aangemaakt bij het seeden. Er zijn drie tabellen:

### `users`
| Kolom | Type | Beschrijving |
|---|---|---|
| id | INTEGER (PK) | Uniek ID |
| name | TEXT | Volledige naam |
| email | TEXT (UNIQUE) | E-mailadres |
| password | TEXT | Gehasht wachtwoord (bcrypt) |
| role | TEXT | `customer` of `admin` |
| created_at | DATETIME | Aanmaakdatum |

### `lessons`
| Kolom | Type | Beschrijving |
|---|---|---|
| id | INTEGER (PK) | Uniek ID |
| name | TEXT | Naam van de les (bv. "Yoga") |
| description | TEXT | Beschrijving |
| instructor | TEXT | Naam van de instructeur |
| day_of_week | TEXT | Dag (Maandag t/m Zondag) |
| start_time | TEXT | Starttijd (HH:MM) |
| end_time | TEXT | Eindtijd (HH:MM) |
| max_participants | INTEGER | Maximaal aantal deelnemers |
| location | TEXT | Locatie (bv. "Zaal A") |

### `registrations`
| Kolom | Type | Beschrijving |
|---|---|---|
| id | INTEGER (PK) | Uniek ID |
| user_id | INTEGER (FK) | Verwijzing naar users |
| lesson_id | INTEGER (FK) | Verwijzing naar lessons |
| registered_at | DATETIME | Inschrijfdatum |

De combinatie `(user_id, lesson_id)` is uniek — een gebruiker kan zich niet twee keer voor dezelfde les inschrijven.

---

## Veelgestelde Vragen

**Kan ik de database resetten?**
Verwijder `sportportal.db` en voer opnieuw `npm run seed` uit in de backend map.

**Ik krijg "Toegang geweigerd" foutmeldingen**
Je bent waarschijnlijk niet ingelogd of je sessie is verlopen. Log opnieuw in.

**De frontend laadt maar de lessen verschijnen niet**
Controleer of de backend server ook draait (`npm run dev` in de backend map).

**Kan ik de lessen aanpassen?**
Bewerk het bestand `backend/src/seed.js` en voer opnieuw `npm run seed` uit (verwijder eerst `sportportal.db`).
