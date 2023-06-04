const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const cors = require("cors")
require('dotenv').config()
var jwt = require('jsonwebtoken');
const app = express()
const PORT = process.env.PORT || 5000;


// middleware
app.use(express.json())
app.use(cors())
//  verify user middleware
const verifyUser = (req, res, next) =>{
  const authorization = req.header.authorization;
  console.log(authorization)
  if (!authorization) {
    res.status(401).send({error: true, message: 'unauthorized Access' })
  }
  const token = authorization.split(' ')[1]
  jwt.verify(token, process.env.USER_ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(401).send({error: true, message: 'unauthorized access'})
    }
    req.decoded = decoded;
    next()
  })
}
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

    // jwt 
    app.post('/jwt', (req, res)=>{
      const user = req.body;
      const token = jwt.sign(user, process.env.USER_ACCESS_TOKEN, {expiresIn: "1h"});
      res.send({token});
    })

    // users data store 
    app.post("/users", async (req,res) => {
      const user = req.body;
      const query = {userEmail: user.userEmail}
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({message: "user Already Exist"})
      }
      const result = await usersCollection.insertOne(user)
      res.send(result)
    })

    // get user
    app.get("/users", verifyUser, async (req, res) => {
      const users = await usersCollection.find().toArray();
      res.send(users)
    })

    //  set user roll
    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const updateUser = {
        $set: {
          role : "admin"
        }
      }
      const result = await usersCollection.updateOne(query, updateUser)
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
    app.post("/carts",  async(req, res ) => {
      const item = req.body;
      const result = await cartCollection.insertOne(item);
      res.send(result);
    })

    // get cart data by user email 
    app.get('/carts/',verifyUser, async (req, res) => {
      const email = req.query.email;
      if (!email) {
        res.send([])
      } 
      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res.status(403).send({error: true, message: "forbidden  access"})
      }
        const query = {email: email}
        const result = await cartCollection.find(query).toArray()
        res.send(result)
      
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