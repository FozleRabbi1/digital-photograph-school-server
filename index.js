const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()
const express = require('express')
const app = express()
const port = process.env.PORT || 5000;
const cors = require('cors')
const jwt = require('jsonwebtoken');

app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ra0tvnn.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // await client.connect();
    const courseCullection = client.db("PhotographyCullection").collection("CoursesData");
    const instructorsCullection = client.db("PhotographyCullection").collection("AllinstructorsData");
    const usersCullection = client.db("PhotographyCullection").collection("usersData");

    // ===========>>>>>> user cullection 

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email }
      const existingUser = await usersCullection.findOne(query)
      if (existingUser) {
          return res.send({ message: "user already exists" })
      }
      const result = await usersCullection.insertOne(user);
      res.send(result);
  })


    app.get("/courses", async (req, res) => {
      const result = await courseCullection.find().sort({ numberOfStudents: -1 }).toArray();
      res.send(result)
    })


    app.get("/instructors", async (req, res) => {
      const result = await instructorsCullection.find().sort({ numberOfStudents: -1 }).toArray();
      // const result = await instructorsCullection.find().toArray();
      res.send(result)
    })





    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Hello World!!!!!!!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})