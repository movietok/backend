# GitHub Actions Self-Hosted Runner Configuration

Tämä dokumentti kuvaa GitHub Actions -konfiguraation self-hosted runnerille, jossa on olemassa .env-tiedosto ja PostgreSQL asennettuna.

## Self-Hosted Runner Setup

### Esivaatimukset palvelimella:
- ✅ Node.js 22 asennettuna
- ✅ PostgreSQL asennettuna ja käynnissä
- ✅ .env tiedosto sovelluksen juuressa
- ✅ GitHub Actions runner konfiguroituna

### Environment Variables (.env)
Self-hosted runnerilla sovellus lukee kaikki ympäristömuuttujat .env tiedostosta:

```env
NODE_ENV=test
DB_HOST=localhost
DB_PORT=5432
DB_NAME=moviedb_test
DB_USER=postgres
DB_PASSWORD=your-password
JWT_SECRET=your-jwt-secret
TMDB_API_KEY=your-tmdb-api-key
FINNKINO_API_BASE_URL=https://www.finnkino.fi
```

### Production Environment (.env)
Production-deploymentissa käytetään samaa .env tiedostoa, mutta NODE_ENV asetetaan production:
```env
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=moviedb_production
DB_USER=postgres
DB_PASSWORD=your-production-password
JWT_SECRET=your-production-jwt-secret
TMDB_API_KEY=your-tmdb-api-key
FINNKINO_API_BASE_URL=https://www.finnkino.fi
```

## GitHub Actions Muutokset

### test.yml
- ✅ `runs-on: self-hosted` (ei enää ubuntu-latest)
- ✅ Ei PostgreSQL Docker-konttia (käyttää paikallista PostgreSQL:ää)
- ✅ Ei kovakoodattuja env-muuttujia (lukee .env:stä)
- ✅ Environment configuration check

### deploy.yml  
- ✅ `runs-on: self-hosted` molemmissa jobeissa
- ✅ Ei PostgreSQL Docker-konttia 
- ✅ Ei GitHub Secrets:eja (lukee .env:stä)
- ✅ Environment configuration check

## Ei Enää Tarvittavia Secretejä

Koska self-hosted runner lukee .env-tiedostosta, seuraavia GitHub Secrets:eja **EI TARVITA**:
- ~~PROD_DB_HOST~~
- ~~PROD_DB_PORT~~  
- ~~PROD_DB_NAME~~
- ~~PROD_DB_USER~~
- ~~PROD_DB_PASSWORD~~
- ~~PROD_JWT_SECRET~~
- ~~TMDB_API_KEY~~
- ~~FINNKINO_API_BASE_URL~~

## Package.json Scripts

Lisätty puuttuva `start:prod` scripti:
```json
{
  "scripts": {
    "start:prod": "cross-env NODE_ENV=production node index.js"
  }
}
```

## Workflow-tiedostojen Muutokset

### deploy.yml
- ✅ `runs-on: self-hosted` (ei ubuntu-latest)
- ✅ Ei PostgreSQL Docker-konttia
- ✅ Environment check varmistaa .env löytymisen
- ✅ Deployment lukee .env-tiedostoa automaattisesti

### test.yml  
- ✅ `runs-on: self-hosted` (ei ubuntu-latest)  
- ✅ Ei PostgreSQL Docker-konttia
- ✅ Environment check varmistaa .env löytymisen
- ✅ Testit lukevat .env-tiedostoa automaattisesti

## Cache-järjestelmä

Finnkino API cache toimii normaalisti:
- Cache-tiedostot luodaan automaattisesti `/cache/finnkino/` -kansioon
- Fallback-mekanismi käyttää vanhentunutta cachea API-virheiden sattuessa
- TTL: 30 minuuttia per cache-tiedosto

## Tarkistuslista Self-Hosted Runnerille

1. ✅ .env tiedosto sovelluksen juuressa
2. ✅ PostgreSQL asennettu ja käynnissä
3. ✅ Node.js 22 asennettu
4. ✅ GitHub Actions runner rekisteröity repositoryyn
5. ✅ cache/finnkino/ kansio (luodaan automaattisesti)
6. ✅ /home/deployer/scripts/ deployment scriptit (jos käytössä)