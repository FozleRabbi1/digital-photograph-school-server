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
  // console.log(15, authorization)
  if (!authorization) {
    return res.status(401).send({ error: true, message: "unauthorize access" })
  }
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.SECRET_JWT_TOKEN, (err, decoded) => {
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


    //===========>>> jar modde pending : "pending ache sei data classer moddhe shod hobe na"
    app.get("/courses", async (req, res) => {
      const query = { pending: { $ne: "pending" } };
      const result = await courseCullection.find(query).sort({ numberOfStudents: -1 }).toArray();
      res.send(result)
    })

    app.get("/AdminRouterCourses", async (req, res) => {
      const query = { pending: { $in: ["pending", "approved"] } };
      const result = await courseCullection.find(query).sort({ numberOfStudents: -1 }).toArray();
      res.send(result)
    })

    //=======================>>
    app.patch("/adminAproveCourses/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          pending: "approved"
        }
      }
      const result = await courseCullection.updateOne(query, updatedDoc);
      res.send(result)
    })

    // added more course by instructor
    // app.post("/courses", verifyJWT, verifyInstructor, async (req, res) => {  //TODO verify korte hobe 


    app.post("/courses", verifyJWT, async (req, res) => {
      const newCurse = req.body;
      const result = await courseCullection.insertOne(newCurse);   /// added bistro Menu cullection
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
    // app.get("/course", async (req, res) => {
    //   const result = await AddCourseCullection.find().toArray();
    //   res.send(result)
    // })


    app.get("/course", verifyJWT, async (req, res) => {
      const email = req.query.email;
      if (!email) {
        return res.send([])
      }
      const decodedEmail = req.decoded?.email;
      if (decodedEmail !== email) {
        return res.status(403).send({ error: true, message: "forbidden access" })
      }
      const query = { email: email }
      const result = await AddCourseCullection.find(query).toArray()
      // console.log(result)
      res.send(result)
    })


    //=================================>>>   course delete Api
    app.delete("/course/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await AddCourseCullection.deleteOne(query)
      res.send(result)
    })

    // myClasses

    //=============================>>>>>> user cullection  (Admin route)     ( ======Manage Users==== )
    app.get("/users", async (req, res) => {
      const result = await usersCullection.find().toArray();
      res.send(result)
    })
    // ========================>>>>>>> make admin api
    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: "admin"
        }
      }
      const result = await usersCullection.updateOne(query, updatedDoc)
      res.send(result)

    })
    // ========================>>>>>>> make indtructor api
    app.patch("/users/instructor/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: "instructor"
        }
      }
      const result = await usersCullection.updateOne(query, updatedDoc)
      res.send(result)

    })
    // ========================>>>>>>> make user api
    app.patch("/users/user/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: "user"
        }
      }
      const result = await usersCullection.updateOne(query, updatedDoc)
      res.send(result)

    })

    //=====================>>>> isAdmin or Not API
    app.get("/users/admin/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email !== email) {
        return res.send({ admin: false })
      }
      const query = { email: email }
      const user = await usersCullection.findOne(query);
      const result = { admin: user?.role === "admin" };   // true/false return korbe
      res.send(result)
    })

    //=====================>>>> isInstructor or Not API
    app.get("/users/instructor/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      // console.log(182, email)
      if (req.decoded.email !== email) {
        return res.send({ instructor: false })
      }
      const query = { email: email }
      const user = await usersCullection.findOne(query);
      // console.log(188, user)
      const result = { instructor: user?.role === "instructor" };   // true/false return korbe
      res.send(result)
    })

    //=====================>>>> isInstructor or Not API
    app.get("/users/instructorSetCourse/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      // console.log(182, email)
      if (req.decoded.email !== email) {
        return res.send({ instructor: false })
      }
      const query = { email: email }
      const user = await usersCullection.findOne(query);
      // console.log(188, user)
      const isInstructor = { instructor: user?.role === "instructor" };   // true/false return korbe

      if (isInstructor) {
        const result = await courseCullection.find(query).toArray()
        return res.send(result)
      }
    })

    app.delete("/myClasses/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await courseCullection.deleteOne(query)
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