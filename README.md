# Архитектура магазина «Мобильный мир»

## Запуск финального стенда

```shell
cd sharding-repl-cache
docker compose up -d
docker compose exec -T mongos mongosh --nodb --quiet --file /scripts/init-sharding.js
```

## Проверка

Откройте [JSON состояния API](http://127.0.0.1:8080/). Поле `collections.helloDoc.documents_count` показывает общее число документов, `documents_by_shard` в той же коллекции — распределение по шардам. В `replica_members_by_shard` ожидается по три участника, в `cache_enabled` — `true`.

Дважды запросите [список пользователей](http://127.0.0.1:8080/helloDoc/users) в течение 60 секунд. Первый запрос при пустом кеше читает MongoDB, повторный получает список из Redis. [Команды измерения времени](sharding-repl-cache/README.md).

## Этапы

- [Шардирование](mongo-sharding/README.md)
- [Репликация](mongo-sharding-repl/README.md)
- [Кеширование](sharding-repl-cache/README.md)
- [Итоговая схема Draw.io и четыре предыдущих варианта](task6.drawio). На итоговой странице показаны региональные узлы CDN, источник статики, API Gateway и Consul. Docker-стенд реализует задания 2–4.
