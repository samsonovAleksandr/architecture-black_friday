const configServers = ["configsrv1:27019", "configsrv2:27019", "configsrv3:27019"];
const shards = [
    {name: "shard1", replicaSet: "shard1RS", address: "shard1:27018"},
    {name: "shard2", replicaSet: "shard2RS", address: "shard2:27018"},
];
const databaseName = "somedb";
const collectionName = "helloDoc";
const namespace = databaseName + "." + collectionName;

function waitFor(description, probe) {
    const deadline = Date.now() + 90_000;
    let lastError;
    while (Date.now() < deadline) {
        try {
            const result = probe();
            if (result) {
                return result;
            }
        } catch (error) {
            lastError = error;
        }
        sleep(1000);
    }
    throw new Error("Timed out waiting for " + description + (lastError ? ": " + lastError : ""));
}

function connect(address, direct) {
    return new Mongo(
        "mongodb://" + address + "/?serverSelectionTimeoutMS=2000&directConnection=" + direct
    );
}

function initializeReplicaSet(config) {
    const nodes = [];
    for (const {host} of config.members) {
        const admin = waitFor(host, () => {
            const connection = connect(host, true).getDB("admin");
            connection.runCommand({ping: 1});
            return connection;
        });
        nodes.push(admin);
    }

    const first = nodes[0];
    try {
        first.runCommand({replSetGetConfig: 1});
    } catch (error) {
        if (error.codeName !== "NotYetInitialized") {
            throw error;
        }
        first.runCommand({replSetInitiate: config});
    }
    waitFor(config._id + " primary", () => {
        for (const node of nodes) {
            if (node.runCommand({hello: 1}).isWritablePrimary) {
                return true;
            }
        }
        return false;
    });
    print("Replica set ready: " + config._id);
}

initializeReplicaSet({
    _id: "configRS",
    configsvr: true,
    members: configServers.map((host, _id) => ({_id, host})),
});
for (const shard of shards) {
    initializeReplicaSet({
        _id: shard.replicaSet,
        members: [{_id: 0, host: shard.address}],
    });
}

const router = waitFor("mongos", () => {
    const connection = connect("mongos:27017", false);
    connection.getDB("admin").runCommand({ping: 1});
    return connection;
});
const admin = router.getDB("admin");
const registered = admin.runCommand({listShards: 1}).shards;
for (const shard of shards) {
    if (!registered.some(({_id}) => _id === shard.name)) {
        admin.runCommand({
            addShard: shard.replicaSet + "/" + shard.address,
            name: shard.name,
        });
    }
}

admin.runCommand({
    shardCollection: namespace,
    key: {name: "hashed"},
    numInitialChunks: 4,
});

const collection = router.getDB(databaseName).getCollection(collectionName);
const result = collection.bulkWrite(Array.from({length: 1000}, (_, age) => ({
    updateOne: {
        filter: {_id: new ObjectId(age.toString(16).padStart(24, "0")), name: "ly" + age},
        update: {$setOnInsert: {age}},
        upsert: true,
    },
})));
print("Seeded " + result.upsertedCount + " new documents. Total: " + collection.countDocuments({}));
