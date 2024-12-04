// Create a view that shows all volunteers and their information. Allow the maintenance of the volunteer records
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
        user: process.env.RDS_USERNAME || "postgres", 
        password: process.env.RDS_PASSWORD || "Gavin12", 
        database: process.env.RDS_DB_NAME || "TurtleShelterProject", 
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

app.get("/volunteer", (req, res) => {
  knex('volunteers')
      .join('sewing_level', 'volunteers.sewing_level_id',"=",'sewing_level.sewing_level_id')
      .join('volunteer_source', 'volunteers.volunteer_source_id',"=", 'volunteer_source.volunteer_source_id')
      .join('volunteer_travel_range_id', 'volunteers.volunteer_travel_range_id',"=", 'volunteer_travel_range_id.volunteer_travel_range_id')
      .select(
          'volunteers.volunteer_id',
          'volunteers.volunteer_first_name',
          'volunteers.volunteer_last_name',
          'volunteers.volunteer_phone',
          'volunteers.volunteer_email',
          'volunteers.volunteer_city',
          'volunteers.volunteer_state',
          'volunteers.volunteer_zip',
          'sewing_level.sewing_level_description', // Assuming this is what you want
          'volunteer_source.source_description', // Example assuming you want the source name
          'volunteer_travel_range_id.volunteer_travel_range_description', // Example assuming you want the travel range description
          'volunteers.willing_to_lead',           // Ensure this is included
          'volunteers.willing_to_sew',            // Ensure this is included
          'volunteers.volunteer_hours_per_month',  
        )
      .then(volunteers => {
          res.render("volunteer", { volunteers });
      })
      .catch(err => {
          console.error("Database query error:", err);
          res.status(500).send("Internal Server Error");
      });
});







app.listen(port, () => console.log("My INTEX website is listening"));
