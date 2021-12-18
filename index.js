const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const { MongoClient } = require('mongodb')
require('dotenv').config()
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1ssjj.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const app = express()
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', (req, res) => {
    res.send('hello world')
})

// firebase admin jwt token 
const admin = require("firebase-admin");
const serviceAccount = require("./configs/random-projects-authentication-firebase-adminsdk-2mlfp-1cd0e56f0d.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});


// mongoDb connection
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const bookings = client.db(process.env.DB_NAME).collection(process.env.DB_SUB_BOOKING);

    // get method [load data from mongodb]
    app.get('/bookingList', (req, res) => {
        const bearer = req.headers.authorization
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];
            // idToken comes from the client app
            admin.auth()
                .verifyIdToken(idToken)
                .then((decodedToken) => {
                    const tokenEmail = decodedToken.email;
                    const queryEmail = req.query.email;
                    if (tokenEmail == req.query.email) {
                        bookings.find({ email: queryEmail })
                            .toArray((err, document) => {
                                res.status(200).send(document)
                            })
                    }
                    else {
                        res.status(401).send('unauthorize access')
                    }
                })
                .catch((error) => {
                    res.status(401).send('unauthorize access')
                });
        }
        else {
            res.status(401).send('unauthorize access')
        }
    })

    // post method [send data to mongodb]
    app.post('/addBookings', (req, res) => {
        const newBooking = req.body;
        bookings.insertOne(newBooking)
            .then(result => {
                res.send(result)
            })
    })
    console.log('database connected')
});


const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`port listening ${port}`)
})