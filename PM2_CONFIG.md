# PM2 Configuration ja Deployment

## 🚀 **PM2 Scripts Korjattu**

### Lisätyt npm scriptit:
```json
{
  "scripts": {
    "devStart": "cross-env NODE_ENV=development nodemon index.js",
    "start:dev": "cross-env NODE_ENV=development node index.js"
  }
}
```

## 📋 **PM2 Käyttö**

### Production:
```bash
# Käynnistä production
pm2 start ecosystem.config.json --only server-prod

# Tai suoraan:
pm2 start npm --name "server-prod" -- start
```

### Development:
```bash
# Käynnistä development (nyt toimii!)
pm2 start ecosystem.config.json --only server-dev

# Tai suoraan:
pm2 start npm --name "server-dev" -- run devStart
```

### PM2 Hallinta:
```bash
# Näytä status
pm2 status

# Näytä logit
pm2 logs server-dev
pm2 logs server-prod

# Restart
pm2 restart server-dev
pm2 restart server-prod

# Stop
pm2 stop server-dev
pm2 stop all

# Delete
pm2 delete server-dev
pm2 delete all
```

## 🔧 **ecosystem.config.json**

Tiedosto sisältää kaksi konfiguraatiota:
- **server-prod**: Production-mode npm start
- **server-dev**: Development-mode npm run devStart (nodemon)

### Sijainti palvelimella:
```
/home/deployer/apps/movietok/backend/ecosystem.config.json
```

## 🐛 **Ongelma korjattu:**

**Ennen:**
```
npm error Missing script: "devStart"
```

**Jälkeen:**
```
✅ devStart scripti löytyy
✅ PM2 voi käynnistää development-moden
✅ Nodemon toimii PM2:n kanssa
```

## 📁 **Log-tiedostot:**
- Production: `/home/deployer/.pm2/logs/server-prod*.log`
- Development: `/home/deployer/.pm2/logs/server-dev*.log`