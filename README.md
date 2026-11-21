
## Запуск финального стенда

```shell
cd sharding-repl-cache
docker compose up -d
docker compose exec -T mongos mongosh --nodb --quiet --file /scripts/init-sharding.js
```

## Проверка

Откройте [JSON состояния API](http://127.0.0.1:8080/). Поле `collections.helloDoc.documents_count` показывает общее число документов, `documents_by_shard` в той же коллекции — распределение по шардам. В `replica_members_by_shard` ожидается по три участника, в `cache_enabled` — `true`.

Дважды запросите [список пользователей](http://127.0.0.1:8080/helloDoc/users) в течение 60 секунд. Первый запрос при пустом кеше читает MongoDB, повторный получает список из Redis. [Команды измерения времени](sharding-repl-cache/README.md).

