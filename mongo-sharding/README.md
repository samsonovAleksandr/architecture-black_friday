# Задание 2. Шардирование MongoDB

Проект `mongo-sharding` запускает API, маршрутизатор `mongos`, три сервера конфигурации одного replica set `configRS` и два одноузловых шарда. API подключается к MongoDB через `mongos`.

## Запуск и инициализация

Выполните команды из корня репозитория. Они подходят для Bash и PowerShell.

```shell
cd mongo-sharding
docker compose up -d --build
docker compose exec -T mongos mongosh --nodb --quiet --file /scripts/init-sharding.js
```

Скрипт инициализирует `configRS`, `shard1RS` и `shard2RS`, дожидается выбора Primary в каждой группе и регистрирует оба шарда через `mongos`. Затем он шардирует пустую коллекцию `somedb.helloDoc` по хешу поля `name` с четырьмя начальными чанками и загружает 1000 тестовых документов. Инициализацию можно повторить. Скрипт использует постоянные идентификаторы для тестовых записей, чтобы повторный запуск не создавал дубликаты.

## Проверка

На [главной странице API](http://localhost:8080/) поле `collections.helloDoc.documents_count` показывает общий счётчик, а `collections.helloDoc.documents_by_shard` показывает количество документов на каждом шарде. После первой загрузки общий счётчик равен 1000, сумма счётчиков шардов совпадает с общим числом и оба шарда содержат документы. Swagger доступен по адресу [localhost:8080/docs](http://localhost:8080/docs).

Если исходный проект занимает порт `8080`, остановите его командой `docker compose stop` из корня репозитория. Чтобы запустить оба проекта одновременно, задайте для `mongo-sharding` свободный порт через переменную `MONGO_SHARDING_PORT`.

Проверить распределение напрямую можно из каждого контейнера. У `mongos` порт `27017`, у шардов `27018`, у серверов конфигурации `27019`.

```shell
docker compose exec -T shard1 mongosh --port 27018 --quiet somedb --eval "db.helloDoc.countDocuments({})"
docker compose exec -T shard2 mongosh --port 27018 --quiet somedb --eval "db.helloDoc.countDocuments({})"
```

Чтобы остановить проект и сохранить данные в томах, выполните `docker compose down`.
