# BusRent.eu

Платформа за автобуси и микробуси под наем: каталог на проверени превозвачи + заявки, които стигат само до превозвачите с подходящ автобус в зоната им.

**Технологии:** Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · PostgreSQL 16 + Drizzle ORM · Docker. HTTPS: Caddy на VPS-а.

## Какво има във версия 0.1

| Страница | Адрес |
|---|---|
| Начало с търсене | `/` |
| Каталог (+ SEO страница за всеки град) | `/avtobusi`, `/avtobusi-pod-naem/sofia` |
| Страница на автобус (галерия, схема на местата) | `/avtobus/[slug]` |
| Заявка в 3 стъпки → автоматично насочване | `/zayavka` |
| Регистрация на превозвач (ЕИК → VIES, документи, първи автобус) | `/registracia` |
| Админ: одобрение на превозвачи, документи, заявки | `/admin` (парола от `.env`) |
| sitemap.xml, robots.txt | автоматично |

**Насочване на заявките:** одобрен превозвач + базата му е в избраната от него зона (град / 100 км / 200 км / цяла БГ) + има активен автобус с поне толкова места (и не повече от ~2× групата) + всички изискани екстри. Превозвачите получават имейл с данните на клиента.

## Още не е направено (следващи версии)

- Вход и табло за превозвача (оферти през сайта, добавяне на още автобуси, документи с срок)
- Сравнение и избор на оферти от клиента
- SMS код за потвърждение на заявката
- Отзиви и рейтинги
- Английска версия (`/en`)
- Напомняния за изтичащи документи

## Качване на VPS (еднократно)

1. На VPS-а: Docker, потребител `deploy` в групата `docker`, папка `/opt/busrent` (собственост на `deploy`), `rsync` (`apt install rsync`).
2. Създай `/opt/busrent/.env` по образеца в `.env.example`.
3. В GitHub → Settings → Secrets and variables → Actions: `VPS_HOST`, `VPS_USER` (=`deploy`), `VPS_SSH_KEY` (частният ключ).
4. DNS: A запис `busrent.eu` и `www` → IP на VPS-а.
5. Добави блока от `caddy/busrent.caddy` в Caddyfile на VPS-а и презареди Caddy. Сайтът слуша само на `127.0.0.1:3010`, а Caddy го изкарва навън с HTTPS.

След това **всяко качване в `main` минава проверки и пуска новата версия автоматично** (GitHub → Actions).


## Полезни команди на VPS-а

```bash
cd /opt/busrent
docker compose ps                 # какво върви
docker compose logs -f app        # логове на сайта
docker compose exec db pg_dump -U busrent busrent > backup-$(date +%F).sql   # архив на базата
```

Демо данни (превозвач „Цветина-Мездра“ с 9 автобуса) **само след писмено съгласие от фирмата**:
`docker compose exec app node scripts/seed-demo.mjs`

## Локална разработка

```bash
npm ci
DATABASE_URL=pglite://./.pgdata npm run db:migrate      # Postgres в процеса, без Docker
DATABASE_URL=pglite://./.pgdata npm run db:seed-demo
DATABASE_URL=pglite://./.pgdata ADMIN_USER=admin ADMIN_PASSWORD=test npm run dev
```

Промяна в базата: редактирай `src/db/schema.ts` → `npm run db:generate` → новата миграция в `drizzle/` се прилага сама при следващото пускане.
