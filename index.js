const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const cors = require("cors")
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 5000;


// middleware
app.use(express.json())
app.use(cors())
// database connection 

// cloud DB
// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.oxlnwju.mongodb.net/?retryWrites=true&w=majority`;
// localDB
const uri = 'mongodb://127.0.0.1:27017/'

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    const menuCollection = client.db("bistroDB").collection("menu");
    const reviewsCollection = client.db("bistroDB").collection("reviews");
    const cartCollection = client.db("bistroDB").collection("carts");
    const usersCollection = client.db("bistroDB").collection("users");

    // users data store 
    app.post("/users", async (req,res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user)
      res.send(result)
    })
  // get all menu
    app.get("/menu", async(req, res) => {
        const result = await menuCollection.find().toArray()
        res.send(result)
    })

    // get user reviews
    app.get("/reviews", async(req, res) => {
        const result = await reviewsCollection.find().toArray()
        res.send(result)
    })

    // add to cart menu
    app.post("/carts", async(req, res ) => {
      const item = req.body;
      const result = await cartCollection.insertOne(item);
      res.send(result);
    })

    // get cart data by user email 
    app.get('/carts/', async (req, res) => {
      const email = req.query.email;
      if (!email) {
        res.send([])
      } else {
        const query = {email: email}
        const result = await cartCollection.find(query).toArray()
        res.send(result)
      }
    } )

    // delete cart item 
    app.delete('/carts/:id', async (req,res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await cartCollection.deleteOne(query)
      res.send(result)
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}

run().catch(console.dir);

// routes
app.get("/", (req, res) => {
    res.send('<h1 style="color: red; text-align: center; margin-top: 200px">Bistro Boss Server Running</h1>')
})

// listening server
app.listen(PORT, ()=> {
    console.log(`server running on ${PORT} port`)
})