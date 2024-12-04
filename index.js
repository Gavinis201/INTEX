const express = require("express");

let app = express();

let path = require("path");

const port = process.env.PORT || 3000;

app.set("view engine", "ejs");

app.use(express.urlencoded({extended: true}));

const knex = require("knex")({
    client: "pg", 
    connection: {
        host: process.env.RDS_HOSTNAME || "localhost", 
        user: process.env.RDS_USERNAME || "intex", 
        password: process.env.RDS_PASSWORD || "password", 
        database: process.env.RDS_DB_NAME || "intex_test10", 
        port: process.env.RDS_PORT || 5432, 
    }
});

app.use(express.static(path.join(__dirname, "public") ))

// Route to serve the landing page
app.get('/', (req, res) => {
  res.render('index')
});

// Route to serve the login page
app.get('/loginPage', (req, res) => {
  res.render('loginPage')
});

// Temporary route to view events page through login button
app.post('/login', (req, res) => {
  knex.select('*')
  .from('event_requests')
  .then( event_requests => {
        res.render("view_events", { event_requests });
    }).catch(err => {
        console.log(err);
        res.status(500).json({err});
    });
})

app.listen(port, () => console.log("My INTEX website is listening"));
