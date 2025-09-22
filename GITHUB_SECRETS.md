# GitHub Actions Self-Hosted Runner Configuration

Tämä dokumentti kuvaa GitHub Actions -konfiguraation self-hosted runnerille `instance-20250919-0048`.

## Self-Hosted Runner Setup

### Runner Info:
- **Name**: `instance-20250919-0048`
- **Labels**: `self-hosted`, `Linux`, `X64`
- **Käyttö**: Kaikki workflow-tiedostot käyttävät tätä runneria

### Esivaatimukset palvelimella:
- ✅ Node.js 22 asennettuna
- ✅ PostgreSQL asennettuna ja käynnissä
- ✅ .env tiedosto sovelluksen juuressa
- ✅ GitHub Actions runner `instance-20250919-0048` käynnissä

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

## GitHub Actions Konfiguraatio

### Kaikki workflow-tiedostot käyttävät self-hosted:
```yaml
runs-on: self-hosted  # runner: instance-20250919-0048
```

### test.yml
- ✅ `runs-on: self-hosted` molemmissa jobeissa
- ✅ Ei PostgreSQL Docker-konttia
- ✅ Lukee .env tiedostoa automaattisesti
- ✅ Environment configuration check

### deploy.yml  
- ✅ `runs-on: self-hosted` kaikissa jobeissa (test, deploy, health-check)
- ✅ Ei PostgreSQL Docker-konttia 
- ✅ Lukee .env tiedostoa automaattisesti
- ✅ Production deployment scripts

### hotfix.yml
- ✅ `runs-on: self-hosted` kaikissa jobeissa
- ✅ Emergency deployment workflow
- ✅ Lukee .env tiedostoa automaattisesti
- ✅ Hotfix deployment ja verification

## Ei GitHub Secrets:eja Tarvita

Koska self-hosted runner lukee .env-tiedostosta, **EI TARVITA**:
- ~~GitHub Secrets~~
- ~~Docker PostgreSQL~~
- ~~Kovakoodattuja env-muuttujia~~

✅ **Kaikki config .env:ssä palvelimella**

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