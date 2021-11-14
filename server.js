const express = require("express");
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
require("dotenv").config();
const cors = require("cors");
const port = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("server is running");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hohs4.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    await client.connect();
    const database = client.db("runner");
    const product_Collection = database.collection("products");
    const cart_Collection = database.collection("cart");
    const user_Collection = database.collection("user");
    const review_Collection = database.collection("review");

    // load data get api
    app.get("/products", async (req, res) => {
      const size = parseInt(req.query.size);
      const page = req.query.page;
      const cursor = product_Collection.find({});
      const count = await cursor.count();
      let products;

      if (size && page) {
        products = await cursor
          .skip(size * page)
          .limit(size)
          .toArray();
      } else {
        products = await cursor.toArray();
      }
      res.json({ count, products });
    });

    // load review
    app.get("/reviews", async (req, res) => {
      const cursor = review_Collection.find({});
      const reviews = await cursor.toArray();
      res.send(reviews);
    })
    
    // load single data get api
    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const product = await product_Collection.findOne(query);
      res.json(product);
    });

    // load cart data according to user id get api
    app.get("/cart/:uid", async (req, res) => {
      const uid = req.params.uid;
      const query = { uid: uid };
      const result = await cart_Collection.find(query).toArray();
      res.json(result);
    });

    // add data to cart collection with additional info
    app.post("/product/add", async (req, res) => {
      const product = req.body;
      const result = await cart_Collection.insertOne(product);
      res.json(result);
    });

    // delete data from cart delete api
    app.delete("/delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await cart_Collection.deleteOne(query);
      res.json(result);
    });

    // purchase delete api
    app.delete("/purchase/:uid", async (req, res) => {
      const uid = req.params.uid;
      const query = { uid: uid };
      const result = await cart_Collection.deleteMany(query);
      res.json(result);
    });

    // orders get api
    app.get("/orders", async (req, res) => {
      const result = await cart_Collection.find({}).toArray();
      res.json(result);
    });

    // Confirmation put API
    app.put('/confirmation/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) }
      const updateProduct = {
        $set: {
          status: "Confirm"
        },
      };
      const result = await cart_Collection.updateOne(query, updateProduct);
      res.json(result)
    })

    // Add product API
    app.post('/newproduct/add', async (req, res) => {
      const user = req.body;
      const result = await product_Collection.insertOne(user);
      res.json(result);
    });

    // Add Review
    app.post('/review', async (req, res) => {
      const user = req.body;
      const result = await review_Collection.insertOne(user);
      res.json(result);
    })

    // Save users
    app.post('/users', async (req, res) => {
      const user = req.body;
      const result = await user_Collection.insertOne(user);
      console.log(result);
      res.json(result);
    });

    app.put('/users', async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await user_Collection.updateOne(filter, updateDoc, options);
      res.json(result);
    });

    // Add Admin
    app.put('/makeadmin', async (req, res) => {
      const user = req.body;
      console.log('put', user);
      const filter = { email: user.email };
      const updateDoc = { $set: { role: 'admin' } };
      const result = await user_Collection.updateOne(filter, updateDoc);
      res.json(result);
    })

    // Check Admin
    app.get('/users/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await user_Collection.findOne(query);
      let isAdmin = false;
      if (user?.role === 'admin') {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    })

    // Delete products (only admin)
    app.delete('/product/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await product_Collection.deleteOne(query);
      console.log('deleting product', result);
      res.json(1);
    })

  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log("server is running on port", port);
});
