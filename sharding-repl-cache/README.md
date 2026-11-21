# Задание 4. Кеширование запросов в Redis

Проект `sharding-repl-cache` запускает API, Redis, маршрутизатор `mongos`, три сервера конфигурации и два шарда по три узла в каждом. API использует образ `kazhem/pymongo_api:1.0.0` и кеширует ответы `GET /helloDoc/users` в Redis на 60 секунд.

## Запуск и инициализация

```shell
cd sharding-repl-cache
docker compose up -d
docker compose exec -T mongos mongosh --nodb --quiet --file /scripts/init-sharding.js
```

Скрипт инициализирует `configRS`, `shard1RS` и `shard2RS`, дожидается готовности всех узлов и выбора Primary в каждой группе. Затем он регистрирует оба шарда в `mongos`, шардирует `somedb.helloDoc` по хешу поля `name` и загружает 1000 тестовых документов. При повторном запуске документы не дублируются.

## Проверка

[Главная страница API](http://127.0.0.1:8080/) возвращает общий счётчик в `collections.helloDoc.documents_count`, разбивку по шардам в `collections.helloDoc.documents_by_shard`, число участников каждой группы в `replica_members_by_shard` и `cache_enabled: true`. После первой загрузки ожидается 1000 документов суммарно и по три участника в каждом шарде.

При пустом кеше первый запрос загружает данные из MongoDB. Ожидаемое время повторного запроса — менее 100 мс. В PowerShell используйте `curl.exe` и `-o NUL`.

```shell
docker compose ps
curl -fsS -o /dev/null -w "%{time_total}\n" http://127.0.0.1:8080/helloDoc/users
curl -fsS -o /dev/null -w "%{time_total}\n" http://127.0.0.1:8080/helloDoc/users
```
