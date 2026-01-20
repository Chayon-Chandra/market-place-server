const express = require('express');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const cors = require('cors');
const port = process.env.PORT || 3000;


//middle ware
app.use(cors());
app.use(express.json());


//mongo DB setup
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.gs8nds9.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


app.get('/', (req, res) => {
  res.send('server is available')
})


async function run() {
 try{
 await client.connect();
 const database = client.db("market_place");
 const productsCollection = database.collection("products");

 //All job Api
   app.get('/products', async (req, res) => {
      const cursor = productsCollection.find();
      const result = await cursor.toArray();
      res.send(result)
    })
// recent Api
    app.get('/latest-products', async (req, res) => {
      const cursor = productsCollection.find().limit(6);
      const result = await cursor.toArray();
      res.send(result)

    })
    // delete ID Api
    app.delete('/products', async(req, res) => {
      const  id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await productsCollection.deleteOne(query);
      res.send(result)
    })

    //job details ID APi
     app.get('/products/:id', async(req, res) =>{

      const id = req.params.id;
      const query = {_id: id};
      const result = await productsCollection.findOne(query)
      res.send(result)
     })
     // post api
     app.post('/products', async(req, res) =>  {
      const product = req.body;
      const result = await productsCollection.insertOne(product);
      res.send(result)
     })

 

 await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
    
 }
 finally{

 }
}
run().catch(console.dir)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
