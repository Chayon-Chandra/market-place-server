const express = require('express');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const cors = require('cors');
const port = process.env.PORT || 3000;
const admin = require("firebase-admin");

const serviceAccount = require("./market-place-firebase-adminsdk-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});



//middle ware
app.use(cors());
app.use(express.json());
const verifyFirebaseToken = async(req, res, next) => {
  const authorization = req.headers.authorization;
  if(!authorization){
    return res.status(401).send({message: 'unauthorization access'})
  }
  const token = authorization.split(' ')[1];
  try{
    const decoded = await admin.auth().verifyIdToken(token);
    console.log('inside token decoded', decoded);
    req.token_email = decoded.email;
    next();
  }
  catch(error){
     return res.status(401).send({message: 'unauthorization access'})
  }

}


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
 const acceptedJobsCollection = database.collection("acceptedJobs");
 

 //All job Api
   app.get('/products', async (req, res) => {
      const cursor = productsCollection.find();
      const result = await cursor.toArray();
      res.send(result)
    })
// latest product Api
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
      const query = {_id: new ObjectId(id)};
      const result = await productsCollection.findOne(query)
      res.send(result)
     })
 
     // post api
     app.post('/products',verifyFirebaseToken, async(req, res) =>  {
      const job = req.body;
      const result = await productsCollection.insertOne(job);
      res.send(result)
     })

     // accepted-jobs api
     app.post("/accepted-jobs", async (req, res) => {
        const acceptedJob = req.body;
       const result = await acceptedJobsCollection.insertOne(acceptedJob);
       res.send({ insertedId: result.insertedId });
      });

      app.get("/accepted-jobs", async (req, res) => {
        const result = await acceptedJobsCollection.find().toArray();
        res.send(result);
      });


    app.delete("/accepted-jobs/:id", async (req, res) => {
      const id = req.params.id;
      const result = await acceptedJobsCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result); 
    });




  //update
  app.patch('/products/:id', async(req, res) => {
    const id  = req.params.id;
    const updateJob = req.body;
    const query = {_id: new ObjectId(id)};
    const update = {
      $set: updateJob
    }
    const result = await productsCollection.updateOne(query,update);
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
