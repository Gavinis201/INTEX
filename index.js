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
          res.render("volunteer", { volunteers: volunteers });
      })
      .catch(err => {
          console.error("Database query error:", err);
          res.status(500).send("Internal Server Error");
      });
});


// Route for adding a new Volunteer
app.get("/addVolunteer", (req, res) => {
  // Query for sewing levels
  knex('sewing_level')
      .select('sewing_level_id', 'sewing_level_description')
      .then(sewingLevels => {
          // Query for volunteer sources
          return knex('volunteer_source')
              .select('volunteer_source_id', 'source_description')
              .then(volunteerSources => {
                  // Query for travel ranges
                  return knex('volunteer_travel_range_id')
                      .select('volunteer_travel_range_id', 'volunteer_travel_range_description')
                      .then(travelRanges => {
                          // Query for distinct volunteer states (we only need unique states)
                          return knex('volunteers')
                              .distinct('volunteers.volunteer_state')  // Get distinct states
                              .then(volunteersStates => {
                                  // Query for detailed volunteer information
                                  return knex('volunteers')
                                      .select(
                                          'volunteers.volunteer_id',
                                          'volunteers.volunteer_first_name',
                                          'volunteers.volunteer_last_name',
                                          'volunteers.volunteer_phone',
                                          'volunteers.volunteer_email',
                                          'volunteers.volunteer_city',
                                          'volunteers.volunteer_state',
                                          'volunteers.volunteer_zip',
                                          'sewing_level.sewing_level_description',
                                          'volunteer_source.source_description',
                                          'volunteer_travel_range_id.volunteer_travel_range_description',
                                          'volunteers.willing_to_lead',
                                          'volunteers.willing_to_sew',
                                          'volunteers.volunteer_hours_per_month'
                                      )
                                      .join('sewing_level', 'volunteers.sewing_level_id', '=', 'sewing_level.sewing_level_id')
                                      .join('volunteer_source', 'volunteers.volunteer_source_id', '=', 'volunteer_source.volunteer_source_id')
                                      .join('volunteer_travel_range_id', 'volunteers.volunteer_travel_range_id', '=', 'volunteer_travel_range_id.volunteer_travel_range_id')
                                      .then(volunteers => {
                                          // Combine all the data into one object to pass to the view
                                          const data = {
                                              volunteers,
                                              sewingLevels,
                                              volunteerSources,
                                              travelRanges,
                                              volunteersStates
                                          };
                                          res.render("addVolunteer", data);
                                      });
                              });
                      });
              });
      })
      .catch(err => {
          console.error("Database query error:", err);
          res.status(500).send("Internal Server Error");
      });
});

app.post("/addVolunteer", (req, res) => {
    // Extract form data from the request body
    const {
        volunteer_first_name,
        volunteer_last_name,
        volunteer_phone,
        volunteer_email,
        volunteer_city,
        volunteer_state,
        volunteer_zip,
        sewing_level_id,
        volunteer_source_id,
        volunteer_travel_range_id,
        willing_to_lead,
        willing_to_sew,
        volunteer_hours_per_month
    } = req.body;

    // Insert new volunteer into the database
    knex('volunteers')
        .insert({
            volunteer_first_name,
            volunteer_last_name,
            volunteer_phone,
            volunteer_email,
            volunteer_city,
            volunteer_state,
            volunteer_zip,
            sewing_level_id,
            volunteer_source_id,
            volunteer_travel_range_id,
            willing_to_lead: willing_to_lead ? true : false, // Convert to boolean
            willing_to_sew: willing_to_sew ? true : false,   // Convert to boolean
            volunteer_hours_per_month
        })
        .then(() => {
            // Redirect back to the addVolunteer page after successful insertion
            res.redirect("/volunteer");
        })
        .catch(err => {
            console.error("Database insertion error:", err);
            res.status(500).send("Internal Server Error");
        });
});


// Route for editing a specific Volunteer
// GET route to display the volunteer details in the edit form
app.get("/editVolunteer/:volunteer_id", (req, res) => {
    // Fetching volunteer data
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
          'sewing_level.sewing_level_description',
          'volunteer_source.source_description',
          'volunteer_travel_range_id.volunteer_travel_range_description',
          'volunteers.willing_to_lead',
          'volunteers.willing_to_sew',
          'volunteers.volunteer_hours_per_month'
        )
      .where("volunteers.volunteer_id", req.params.volunteer_id.toUpperCase())
      .then(volunteers => {
        // Fetching sewing levels, volunteer sources, and travel ranges
        knex('sewing_level').select('sewing_level_id', 'sewing_level_description')
          .then(sewing_levels => {
            knex('volunteer_source').select('volunteer_source_id', 'source_description')
              .then(volunteer_sources => {
                knex('volunteer_travel_range_id').select('volunteer_travel_range_id', 'volunteer_travel_range_description')
                  .then(travel_ranges => {
                    // Pass all data to the template
                    res.render("editVolunteer", {
                      volunteer: volunteers[0],
                      sewing_levels: sewing_levels,
                      volunteer_sources: volunteer_sources,
                      travel_ranges: travel_ranges
                    });
                  })
                  .catch(err => {
                    console.error("Error fetching travel ranges:", err);
                    res.status(500).send("Internal Server Error");
                  });
              })
              .catch(err => {
                console.error("Error fetching volunteer sources:", err);
                res.status(500).send("Internal Server Error");
              });
          })
          .catch(err => {
            console.error("Error fetching sewing levels:", err);
            res.status(500).send("Internal Server Error");
          });
      })
      .catch(err => {
        console.error("Database error:", err);
        res.status(500).send("Internal Server Error");
      });
});
app.post("/editVolunteer/:volunteer_id", (req, res) => {
    const { 
      volunteer_first_name,
      volunteer_last_name,
      volunteer_phone,
      volunteer_email,
      volunteer_city,
      volunteer_state,
      volunteer_zip,
      sewing_level_id,
      volunteer_source_id,
      volunteer_travel_range_id,
      willing_to_lead,
      willing_to_sew,
      volunteer_hours_per_month 
    } = req.body;
  
    const updateData = {
      volunteer_first_name,
      volunteer_last_name,
      volunteer_phone,
      volunteer_email,
      volunteer_city,
      volunteer_state,
      volunteer_zip,
      sewing_level_id,
      volunteer_source_id,
      volunteer_travel_range_id,
      willing_to_lead,
      willing_to_sew,
      volunteer_hours_per_month
    };
  
    knex('volunteers')
      .where('volunteer_id', req.params.volunteer_id)
      .update(updateData)
      .then(() => {
        // Redirect to /volunteer after the update
        res.redirect("/volunteer");
      })
      .catch(err => {
        console.error("Error updating volunteer:", err);
        res.status(500).send("Internal Server Error");
      });
  });
  
  app.post("/deleteVolunteer/:volunteer_id", (req, res) => {
    knex("volunteers")
        .where("volunteer_id", req.params.volunteer_id)
        .del()  // Deletes the record with the matching volunteer_id
        .then(() => {
            // Redirect to the correct page, like the volunteer list
            res.redirect("/volunteer");  // Redirect to the page showing the volunteer list
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({ error: err.message });  // Provide more useful error details
        });
});


    
app.get('/searchVolunteers', (req, res) => {
    const { searchFirstName, searchLastName } = req.query;

    // Build the query based on search parameters
    let query = knex('volunteers')
        .join('sewing_level', 'volunteers.sewing_level_id', '=', 'sewing_level.sewing_level_id')
        .join('volunteer_source', 'volunteers.volunteer_source_id', '=', 'volunteer_source.volunteer_source_id')
        .join('volunteer_travel_range_id', 'volunteers.volunteer_travel_range_id', '=', 'volunteer_travel_range_id.volunteer_travel_range_id')
        .select(
            'volunteers.volunteer_id',
            'volunteers.volunteer_first_name',
            'volunteers.volunteer_last_name',
            'volunteers.volunteer_phone',
            'volunteers.volunteer_email',
            'volunteers.volunteer_city',
            'volunteers.volunteer_state',
            'volunteers.volunteer_zip',
            'sewing_level.sewing_level_description',
            'volunteer_source.source_description',
            'volunteer_travel_range_id.volunteer_travel_range_description',
            'volunteers.willing_to_lead',
            'volunteers.willing_to_sew',
            'volunteers.volunteer_hours_per_month'
        );
    
    if (searchFirstName) {
        query.where('volunteers.volunteer_first_name', 'like', `%${searchFirstName}%`);
    }
    
    if (searchLastName) {
        query.where('volunteers.volunteer_last_name', 'like', `%${searchLastName}%`);
    }

    query.then(volunteers => {
        res.render("volunteers", {
            volunteers: volunteers
        });
    }).catch(err => {
        console.error("Database error:", err);
        res.status(500).send("Internal Server Error");
    });
});




app.listen(port, () => console.log("My INTEX website is listening"));
