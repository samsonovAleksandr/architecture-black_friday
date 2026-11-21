# Задание 3. Репликация шардов MongoDB

Проект `mongo-sharding-repl` запускает API, маршрутизатор `mongos`, три сервера конфигурации и два шарда. У каждого шарда по три участника: один Primary и два Secondary. API работает на образе `kazhem/pymongo_api:1.0.0` и подключается к MongoDB через `mongos`.

## Запуск и инициализация

```shell
cd mongo-sharding-repl
docker compose up -d
docker compose exec -T mongos mongosh --nodb --quiet --file /scripts/init-sharding.js
```

Скрипт инициализирует `configRS`, `shard1RS` и `shard2RS`, дожидается готовности всех узлов и выбора Primary в каждой группе. Затем он регистрирует оба шарда в `mongos`, шардирует `somedb.helloDoc` по хешу поля `name` и загружает 1000 тестовых документов. При повторном запуске документы не дублируются.

## Проверка

[Главная страница API](http://localhost:8080/) возвращает общий счётчик в `collections.helloDoc.documents_count`, разбивку по шардам в `collections.helloDoc.documents_by_shard` и число участников каждой группы в `replica_members_by_shard`. После первой загрузки ожидается 1000 документов суммарно и по три участника в каждом шарде.

```shell
docker compose ps
docker compose exec -T shard1-1 mongosh --port 27018 --quiet --eval 'rs.status().members.map(member => [member.name, member.stateStr])'
docker compose exec -T shard2-1 mongosh --port 27018 --quiet --eval 'rs.status().members.map(member => [member.name, member.stateStr])'
```
