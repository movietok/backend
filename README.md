# Backend


## 📁 Projektin rakenne

```
backend/
├── src/
│   ├── config/           # Tietokanta- ja muut konfiguraatiot
│   │   └── database.js
│   ├── controllers/      # API-kontrollerit (CRUD-logiikka)
│   │   └── UserController.js
│   ├── middleware/       # Express middlewaret
│   │   └── auth.js
│   ├── models/          # Tietokantamallit
│   │   ├── User.js
│   │   └── Movie.js
│   ├── routes/          # API-reitit
│   │   ├── index.js
│   │   └── userRoutes.js
│   └── services/        # Liiketoimintalogiikka
│       └── UserService.js
├── tests/               # Testit
│   ├── user.test.js
│   └── auth.test.js
├── index.js            # Sovelluksen käynnistyspiste
├── database.sql        
├── package.json
└── README.md
```

## 🛠️ Vaatimukset


## 📥 Asennus

1. Kloonaa repositorio
2. Asenna riippuvuudet:
   ```bash
   npm install
   ```

3. Määritä ympäristömuuttujat:
   ```bash
   cp .env.example .env
   ```
   Muokkaa `.env` tiedostoa tietokanta- ja JWT-asetuksillasi.

4. Määritä tietokanta:
   - Luo PostgreSQL-tietokanta
   - Suorita SQL-komennot `database.sql` tiedostosta tarvittavien taulujen luomiseksi

## 🔧 Ympäristömuuttujat

Projekti tukee ympäristökohtaisia konfiguraatioita. Luo `.env` tiedosto projektin juurikansioon:

### Development-ympäristö (.env)
```env
NODE_ENV=development
PORT=3000

# CORS Configuration
CORS_ORIGINS=http://localhost:3001,http://localhost:5173

# Development Database
DEV_DB_HOST=localhost
DEV_DB_PORT=5432
DEV_DB_NAME=moviedb_dev
DEV_DB_USER=postgres
DEV_DB_PASSWORD=dev_password

# Development JWT Secret
DEV_JWT_SECRET=dev_jwt_secret_change_this

# Fallback values
DB_HOST=localhost
DB_PORT=5432
DB_NAME=moviedb
DB_USER=postgres
DB_PASSWORD=password
JWT_SECRET=fallback_secret
```

### Production-ympäristö (.env.production)
```env
NODE_ENV=production
PORT=3000

# CORS Configuration (your domains)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Production Database
PROD_DB_HOST=your_production_db_host
PROD_DB_PORT=5432
PROD_DB_NAME=moviedb_prod
PROD_DB_USER=prod_user
PROD_DB_PASSWORD=very_secure_production_password

# Production JWT Secret (MUST be secure!)
PROD_JWT_SECRET=extremely_secure_production_jwt_secret
```

### Test-ympäristö
Testit käyttävät automaattisesti `TEST_` -alkuisia muuttujia.

## 🚀 Ympäristökohtaiset toiminnot

Sovellus käyttää automaattisesti oikeita asetuksia ympäristön perusteella:

### Development
- **Tietokanta**: `moviedb_dev`
- **Logging**: Kaikki SQL-kyselyt ja pyynnöt lokitetaan
- **CORS**: Sallii localhost-osoitteet
- **JWT-aikakatkaisu**: 24 tuntia
- **Bcrypt-kierrokset**: 10 (nopeampi)
- **Tietokannan luonti**: Automaattinen

### Production
- **Tietokanta**: `moviedb_prod`
- **Logging**: Vain virheet ja info-tason viestit
- **CORS**: Vain määritellyt tuotantotunnukset
- **JWT-aikakatkaisu**: 1 tunti (turvallisempi)
- **Bcrypt-kierrokset**: 12 (turvallisempi)
- **SSL**: Käytössä tietokantayhteyksille
- **Validointi**: Varoittaa turvattomista asetuksista

### Test
- **Tietokanta**: `moviedb_test`
- **Logging**: Ei lokitusta testien aikana
- **JWT-aikakatkaisu**: 24 tuntia
- **Bcrypt-kierrokset**: 10 (nopeampi testejä varten)

## 🎯 Skriptit

### Perusskriptit
- `npm run devStart` - Käynnistä palvelin kehitystilassa nodemon:lla
- `npm run testStart` - Käynnistä palvelin testitilassa nodemon:lla
- `npm start` - Käynnistä palvelin tuotantotilassa
- `npm test` - Suorita testit

### Ympäristökohtaiset komennot
- `npm run start:dev` - Kehityspalvelin
- `npm run start:test` - Testipalvelin  
- `npm run start:prod` - Tuotantopalvelin

### Tietokantayhteyden testaus
- `npm run db:dev` - Testaa development-tietokannan yhteys
- `npm run db:test` - Testaa test-tietokannan yhteys
- `npm run db:prod` - Testaa production-tietokannan yhteys

### Ympäristön vaihto
- `npm run env:dev` - Vaihda development-ympäristöön
- `npm run env:prod` - Vaihda production-ympäristöön
- `npm run env:test` - Vaihda test-ympäristöön

### Konfiguraation validointi
- `npm run config:validate` - Tarkista että konfiguraatio on oikein

## 📡 API-päätepisteet

### 🔓 Julkiset päätepisteet

- `GET /health` - Terveystarkistus
- `POST /api/users/register` - Käyttäjän rekisteröinti
- `POST /api/users/login` - Käyttäjän kirjautuminen

### 🔒 Suojatut päätepisteet (vaativat JWT-tokenin)

#### Käyttäjähallinta
- `GET /api/users/profile` - Hae käyttäjäprofiili
- `PUT /api/users/profile` - Päivitä käyttäjäprofiili  
- `DELETE /api/users/profile` - Poista oma tili
- `GET /api/users` - Hae kaikki käyttäjät (paginaatio)
- `GET /api/users/:id` - Hae käyttäjä ID:n perusteella
- `DELETE /api/users/:id` - Poista käyttäjä ID:n perusteella

## 🔐 Autentikointi

Sisällytä JWT-token Authorization-headeriin:
```
Authorization: Bearer <your_jwt_token>
```

## 🗄️ Tietokantaskeema

## 🧪 Testaus

Projekti sisältää kattavat testit Mochan ja Chain avulla. Suorita testit komennolla:

```bash
npm test
```

Testit kattavat:
- API-päätepisteiden toiminnallisuuden
- Autentikointitoiminnot
- CRUD-operaatiot
- Virheenkäsittelyn
- Validoinnin

## 💻 Kehitys

Käynnistä kehityspalvelin:

```bash
npm run devStart
```

Palvelin käynnistyy portissa, joka on määritelty `.env` tiedostossa (oletus: 3000).

## 🏗️ Arkkitehtuuri

Projekti noudattaa MVC (Model-View-Controller) -mallia:

- **Models** (`src/models/`): Tietokantamallien määrittelyt ja CRUD-operaatiot
- **Controllers** (`src/controllers/`): HTTP-pyyntöjen käsittely ja vastausten muodostaminen
- **Services** (`src/services/`): Liiketoimintalogiikka ja tietojen käsittely
- **Routes** (`src/routes/`): API-reittien määrittelyt
- **Middleware** (`src/middleware/`): Autentikointi, validointi ja virheenkäsittely
- **Config** (`src/config/`): Sovelluksen konfiguraatiot

## 🔧 Laajennettavuus

Projekti on suunniteltu helposti laajennettavaksi:

1. **Uudet mallit**: Luo uusi tiedosto `src/models/` kansioon
2. **Uudet kontrollerit**: Luo uusi tiedosto `src/controllers/` kansioon
3. **Uudet palvelut**: Luo uusi tiedosto `src/services/` kansioon
4. **Uudet reitit**: Luo uusi tiedosto `src/routes/` kansioon ja lisää se `src/routes/index.js`:ään

