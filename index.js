const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const express = require('express')
const app = express()
const port = process.env.PORT || 5000;
const cors = require('cors')
const jwt = require('jsonwebtoken');

app.use(cors());
app.use(express.json());


const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  console.log(authorization)
  if (!authorization) {
    return res.status(401).send({ error: true, message: "unauthorize access" })
  }
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: "unauthorize access" })
    }
    req.decoded = decoded;
    next();
  })
}



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
    //=================================>>>    await client.connect();
    const courseCullection = client.db("PhotographyCullection").collection("CoursesData");
    const instructorsCullection = client.db("PhotographyCullection").collection("AllinstructorsData");
    const usersCullection = client.db("PhotographyCullection").collection("usersData");
    const AddCourseCullection = client.db("PhotographyCullection").collection("AddCourseData");

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.SECRET_JWT_TOKEN, { expiresIn: "1h" })
      res.send({ token })
    })


    //=============================>>>>>> user cullection 
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
      res.send(result)
    })

    //=================================>>>   added class  cullections 
    app.post("/course", async (req, res) => {
      const course = req.body;
      const result = await AddCourseCullection.insertOne(course)
      res.send(result)
    })

    //=================================>>>     get Course API
    app.get("/course", async (req, res) => {
      const result = await AddCourseCullection.find().toArray();
      res.send(result)
    })
    //=================================>>>   course delete Api
    app.delete("/course/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await AddCourseCullection.deleteOne(query)
      res.send(result)
    })







    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Hello World!!!!!!!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})