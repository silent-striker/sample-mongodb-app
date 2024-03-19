require('dotenv').config();
const {MongoClient, ServerApiVersion} = require('mongodb');

const mongo_uri = process.env.MONGO_URI;
const client = new MongoClient(mongo_uri,{
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecatedErrors: true
    }
});

// following jsonSchema format
const productSchema = {
    required: ['name', 'quantity', 'availability'],
    properties: {
        name: {
            bsonType: "string",
            description: "name is required and is a string"
        },
        quantity: {
            bsonType: "int",
            description: "quantity is required and is an integer"
        },
        availability: {
            bsonType: "bool",
            description: "availability is required and is a boolean"
        }
    }
};

// do all the database querying
async function createCollection(databaseName, collectionName, collectionSchema){
    try{
        // connect to remote mongodb
        await client.connect();
        // create collection
        await client.db(databaseName).createCollection(collectionName, {
            validator: {
                $jsonSchema: collectionSchema
            }
        }).then((response) => {
            console.log("Created new collection: ", collectionName);
        }).catch(console.dir);
    } finally{
        // close connection to database
        await client.close();
    }
}

// inserting documents into the database
async function insertQueries(databaseName, collectionName, documents){
    try{
        await client.connect();
        const db = client.db(databaseName);
        const collection = db.collection(collectionName);

        // inserting documents into collection
        if(documents.length > 1){
            console.log(`using query: ${databaseName}.${collectionName}.insertMany(${documents})`);
            await collection.insertMany(documents)
                .then((response) => {
                    console.log("Inserted multiple documents");
                    console.log(response);
                })
                .catch(console.dir);
        } else{
            const document = documents[0];
            console.log(`using query: ${databaseName}.${collectionName}.insertOne(${document})`);
            await collection.insertOne(document)
                .then((response) => {
                    console.log("Inserted document");
                    console.log(response);
                })
                .catch(console.dir);
        }
    } finally{
        await client.close();
    }
}

// retreiving documents
async function retrieveQueries(databaseName, collectionName, documents){
    let responseList = [];
    try{
        await client.connect();
        const db = client.db(databaseName);
        const collection = db.collection(collectionName);

        // retrieve
        // OPTION 1: we can apply $in on one field such as name and retrieve documents
        const nameList = documents.map((document) => {return document.name});
        console.log(`using query: ${databaseName}.${collectionName}.find(${nameList})`);
        const cursor = collection.find({name: {$in: nameList}});

        // as cursor.forEach() is deprecated
        responseList = await cursor.toArray();
        // OPTION 2: we can apply $or on document level
        // const cursor = collection.find({$or: documents});
        // responseList = await cursor.toArray();
    } catch(err){
        console.log(err);
    } finally{
        await client.close();
    }
    return responseList;
}

async function retrieveDocument(databaseName, collectionName, document){
    let response = null;
    try{
        await client.connect();
        const db = client.db(databaseName);
        const collection = db.collection(collectionName);

        const query = {
            name: document.name
        };
        console.log(`using query: ${databaseName}.${collectionName}.findOne(${query})`);
        response = await collection.findOne(query);
    } catch(err){
        console.log(err);
    } finally {
        await client.close();
    }
    return response;
}

// to update one document
async function updateDocument(databaseName, collectionName, query, updatedValue){
    try{
        await client.connect();
        const db = client.db(databaseName);
        const collection = db.collection(collectionName);

        const updateQuery = {
            $set: updatedValue
        };

        console.log(`using query: ${databaseName}.${collectionName}.updateOne(${query}, ${updateQuery})`);
        // update value
        await collection.updateOne(query, updateQuery)
            .then((response) => {
                console.log("Updated document");
                console.log(response);
            })
            .catch(console.dir);
    } finally{
        await client.close();
    }
}

// to execute a database creation, insert etc flows
async function run(){
    await createCollection('web_store', 'products', productSchema);
    const products = [
        {
            name: "Apple iPhone 13 Pro Max",
            quantity: 100,
            availability: true
        },
        {
            name: "Samsung Galaxy S21 Ultra",
            quantity: 150,
            availability: true
        },
        {
            name: "Sony PlayStation 5",
            quantity: 50,
            availability: true
        },
        {
            name: "MacBook Pro 16-inch",
            quantity: 80,
            availability: true
        },
        {
            name: "Nike Air Zoom Pegasus 38 Running Shoes",
            quantity: 200,
            availability: true
        },
        {
            name: "Amazon Echo Dot (4th Gen)",
            quantity: 120,
            availability: true
        },
        {
            name: "Canon EOS R5 Mirrorless Camera",
            quantity: 30,
            availability: true
        },
        {
            name: "Nintendo Switch OLED Model",
            quantity: 90,
            availability: true
        },
        {
            name: "Dyson V11 Absolute Cordless Vacuum Cleaner",
            quantity: 70,
            availability: true
        },
        {
            name: "Bose QuietComfort 45 Wireless Headphones",
            quantity: 110,
            availability: true
        },
        {
            name: "Google Pixel 6 Pro",
            quantity: 60,
            availability: true
        },
        {
            name: "Rolex Submariner Date Watch",
            quantity: 20,
            availability: true
        },
        {
            name: "LG OLED C1 4K TV",
            quantity: 40,
            availability: true
        },
        {
            name: "LEGO Star Wars Millennium Falcon Set",
            quantity: 180,
            availability: true
        },
        {
            name: "Patagonia Nano Puff Jacket",
            quantity: 130,
            availability: true
        }
    ];

    console.log("====================================================");

    await insertQueries('web_store', 'products', products);

    console.log("====================================================");

    const response = await retrieveQueries('web_store', 'products', products);
    response.forEach(element => {
        console.log(element);
    });

    console.log("====================================================");

    // query for one document, getting the first one in documents as test
    // we are updating the quantity to 20 of this product
    const query = products[0];
    const newValue = {
        quantity: 20
    };
    await updateDocument('web_store', 'products', query, newValue);

    console.log("\nUpdated response with new quantity:", 20);
    const updated_response = await retrieveDocument('web_store', 'products', query);
    console.log(updated_response);
}

run().catch(console.dir);