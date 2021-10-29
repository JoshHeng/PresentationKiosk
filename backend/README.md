# Presentation Kiosk - Backend
The backend handles all the kiosk and admin connections, and stores the configuration.

## Configuration
The configuration is stored in `config.json`, which is automatically generated from `defaultConfig.json` if it doesn't exist. Changes can be made to the file by first unloading the file from the admin console, then re-loading the file afterwards.

All assets must be stored on a separate server, and the link to the media file added.

## Deployment
*This can also be deployed on services such as **Cloudflare Pages** and **Vercel**.*

1. Dependency installation
```sh
npm install
```

2. Configuration
   1. Copy `.env.example` to `.env` 
   2. Fill out `.env` with the correct details

3. Running
```sh
npm start
```