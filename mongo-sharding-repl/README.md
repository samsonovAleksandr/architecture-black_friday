# Задание 3. Репликация шардов MongoDB

Проект `mongo-sharding-repl` запускает API, маршрутизатор `mongos`, три сервера конфигурации и два шарда. У каждого шарда по три участника: один Primary и два Secondary. API работает на образе `kazhem/pymongo_api:1.0.0` и подключается к MongoDB через `mongos`.

## Запуск и инициализация

Выполните команды из корня репозитория. Они подходят для Bash и PowerShell.

```shell
cd mongo-sharding-repl
docker compose up -d
docker compose exec -T mongos mongosh --nodb --quiet --file /scripts/init-sharding.js
```

Скрипт инициализирует `configRS`, `shard1RS` и `shard2RS`, дожидается готовности всех узлов и выбора Primary в каждой группе. Затем он регистрирует оба шарда в `mongos`, шардирует `somedb.helloDoc` по хешу поля `name` и загружает 1000 тестовых документов. При повторном запуске документы не дублируются.

## Проверка

[Главная страница API](http://localhost:8080/) возвращает общий счётчик в `collections.helloDoc.documents_count`, разбивку по шардам в `collections.helloDoc.documents_by_shard` и число участников каждой группы в `replica_members_by_shard`. После первой загрузки ожидается 1000 документов суммарно и по три участника в каждом шарде.

Если порт `8080` занят предыдущим стендом, остановите его из его директории командой `docker compose stop` или задайте свободный порт через переменную `MONGO_SHARDING_PORT` перед запуском.

Проверить статус контейнеров и роли узлов обоих шардов можно командами ниже.

```shell
docker compose ps
docker compose exec -T shard1-1 mongosh --port 27018 --quiet --eval 'rs.status().members.map(member => [member.name, member.stateStr])'
docker compose exec -T shard2-1 mongosh --port 27018 --quiet --eval 'rs.status().members.map(member => [member.name, member.stateStr])'
```

Чтобы остановить проект и сохранить данные в томах, выполните `docker compose down`.
