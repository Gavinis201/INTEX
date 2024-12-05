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

app.use(express.static(path.join(__dirname, "public") ));

// This formats time so that if it's stored as 09:00:00, we can display it as 9 AM
const formattedTime = (time) => {
  // Convert "09:00:00" to a Date object
  const date = new Date(`1970-01-01T${time}Z`);  // Use a dummy date

  // Get the hour in 24-hour format
  let hour = date.getUTCHours();

  // Determine AM or PM
  const period = hour >= 12 ? 'PM' : 'AM';

  // Convert hour to 12-hour format
  if (hour > 12) {
    hour -= 12;
  } else if (hour === 0) {
    hour = 12; // Midnight case
  }

  // Return formatted time like "9 AM"
  return `${hour} ${period}`;
};

// Route to serve the landing page
app.get('/', (req, res) => {
  res.render('index')
});

// Route to serve the login page
app.get('/loginPage', (req, res) => {
  const error = req.query.error;
  res.render("loginPage", { error });
});

// Route to login to administrator side
// Compares username and password
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Fetch the user by username
    const user = await knex('users')
      .select('*')
      .where({ username })
      .first(); // Fetch the first matching record

    if (!user) {
      // If no matching user is found
      console.log('No user found with username:', username); // Debugging line
      return res.redirect('/loginPage?error=invalid_credentials');
    }

    if (password === user.password) {
      // Passwords match
      return res.redirect('/loginHomePage');
    } else {
      // Passwords don't match
      console.log('Password does not match user', username);
      return res.redirect('/loginPage?error=invalid_credentials');
    }
  } catch (error) {
    // Handle any errors during the database query or password comparison
    console.error('Error during login:', error.message);
    return res.status(500).send('An error occurred. Please try again later.');
  }
});

// Route to serve the login landing page
app.get('/loginHomePage', (req, res) => {
  res.render('loginHomePage')
});

// Route to Volunteer Sign Up Page
app.get('/volunteerSignUpPage', (req, res) => {
  const { success } = req.query; 
  // Fetch types to populate the dropdown
  knex('sewing_level')
    .select('sewing_level_id', 'sewing_level_description')
    .then(sewing_types => {

      knex('volunteer_source')
        .select('volunteer_source_id', 'source_description')
        .then(volunteer_source_types => {

          knex('volunteer_travel_range_id')
            .select('volunteer_travel_range_id', 'volunteer_travel_range_description')
            .then(volunteer_travel_range_types => {
          
            // Render the add form with the sewing, volunteer source and volunteer travel range type
            res.render('volunteerSignUpPage', { sewing_types, volunteer_source_types, volunteer_travel_range_types, success});
          })
        })
    })
    .catch(error => {
      console.error('Error fetching Sewing, Volunteer Source and Volunter travel range types:', error);
      res.status(500).send('Internal Server Error');
    });
});

// Route to Create new volunteer
app.post('/volunteerSignUpPage', (req, res) => {
   // Extract form values from req.body
   const volunteer_first_name = req.body.volunteer_first_name || ''; // Default to empty string if not provided
   const volunteer_last_name = req.body.volunteer_last_name || ''; // Default to empty string if not provided
   const volunteer_phone = parseInt(req.body.volunteer_phone); // Convert to integer
   const volunteer_email = req.body.volunteer_email || '';
   const volunteer_city = req.body.volunteer_city || '';
   const volunteer_state = req.body.volunteer_state || '';
   const volunteer_zip = parseInt(req.body.volunteer_zip);
   const sewing_level_id = req.body.sewing_level_id || 'Beginner'; 
   const volunteer_source_id = req.body.volunteer_source_id || 'Other'; 
   const volunteer_travel_range_id = req.body.volunteer_travel_range_id || 'City'; 
   const willing_to_lead = req.body.willing_to_lead === 'true';
   const willing_to_sew = req.body.willing_to_sew === 'true'; 
   const volunteer_hours_per_month = parseInt(req.body.volunteer_hours_per_month);
 
   // Insert the new volunteer into the database
   knex('volunteers')
     .insert({
      volunteer_first_name: volunteer_first_name, 
      volunteer_last_name: volunteer_last_name,
      volunteer_phone: volunteer_phone,
      volunteer_email: volunteer_email,
      volunteer_city: volunteer_city,
      volunteer_state: volunteer_state,
      volunteer_zip: volunteer_zip,
      sewing_level_id: sewing_level_id,
      volunteer_source_id: volunteer_source_id,
      volunteer_travel_range_id: volunteer_travel_range_id,
      willing_to_lead: willing_to_lead,
      willing_to_sew: willing_to_sew,
      volunteer_hours_per_month: volunteer_hours_per_month
     })
     .then(() => {
         res.redirect('/volunteerSignUpPage?success=true'); // Redirect to the Home page after adding
     })
     .catch(error => {
         console.error('Error adding Volunteer:', error);
         res.status(500).send('Internal Server Error');
     });
});

// view_events page code
app.get('/view_events', (req, res) => {
  knex.select(
    'event_requests.*',
    'event_status.*',
    'space_size.*',
    'event_type.*',
    'approved_event_date',
    'approved_event_start_time',
    'approved_event_duration_hours',
    'event_address',
    'estimated_team_members_needed',
    'number_of_sewers',
    'sewing_machines_to_bring',
    'sergers_to_bring',
    'approved_event_notes',
    'completed_participants_count',
    'completed_event_notes'
  )
  .from('event_requests')
  .join('event_status', 'event_requests.event_status_id','=','event_status.event_status_id' )
  .join('space_size', 'event_requests.space_size_id','=','space_size.space_size_id' )
  .join('event_type', 'event_requests.event_type_id','=','event_type.event_type_id' )
  .leftJoin('approved_event_details', 'event_requests.event_id','=','approved_event_details.event_id' )
  .leftJoin('completed_event_details', 'event_requests.event_id','=','completed_event_details.event_id' )
  .orderByRaw(`
    CASE
      WHEN approved_event_details.approved_event_date IS NOT NULL THEN approved_event_details.approved_event_date
      ELSE event_requests.first_choice_event_date
    END
  `)
  .then( event_requests => {
      // Format the dates in the event_requests array
      event_requests = event_requests.map(event => {
        if (event.first_choice_event_date) { 
          const date = new Date(event.first_choice_event_date);
          event.first_choice_event_date = date.toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'}); // Formats as "January 10, 2024"
        }
        if (event.second_choice_event_date) { 
          const date = new Date(event.second_choice_event_date);
          event.second_choice_event_date = date.toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'}); // Formats as "January 10, 2024"
        }
        if (event.third_choice_event_date) { 
          const date = new Date(event.third_choice_event_date);
          event.third_choice_event_date = date.toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'}); // Formats as "January 10, 2024"
        }
        if (event.approved_event_date) { 
          const date = new Date(event.approved_event_date);
          event.approved_event_date = date.toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'}); // Formats as "January 10, 2024"
        }
        return event;
      });

      // Get current date
      const currentDate = new Date()

      // Format the time for each event request
      event_requests.forEach(event => {
        event.formatted_time_estimate = formattedTime(event.estimated_event_start_time);
        event.formatted_time_approved = formattedTime(event.approved_event_start_time);
      });

      knex.select('*')
      .from('completed_event_products')
      .join('products', 'completed_event_products.product_id','=','products.product_id' )
      .orderBy('products.product_id','desc')
      .then( products => {
        res.render("view_events", { event_requests, products, currentDate });
      }).catch(err => {
          console.log(err);
          res.status(500).json({err})
        })
  }).catch(err => {
      console.log(err);
      res.status(500).json({err});
    })
});

//
app.get('/editEventDetails/:id', (req, res) => {
  const eventId = req.params.id;
  res.render('editEventDetails', { eventId });
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


    
app.get('/searchVolunteer', (req, res) => {
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
        res.render("searchVolunteer", {
            volunteers: volunteers
        });
    }).catch(err => {
        console.error("Database error:", err);
        res.status(500).send("Internal Server Error");
    });
});

app.get('/eventRequest', (req, res) => {
  knex('space_size')
  .select()
  .then(space_sizes => {

    knex('event_type')
    .select()
    .then(event_types => {
      res.render('eventRequest', { event_types, space_sizes })
    })
  }).catch(error => {
    console.error('Error fetching event_type or space_size', error);
    res.status(500).send('Internal Server Error');
  });
  });

app.get('/displayUsers', (req, res) => {
    knex('users').select('volunteer_id', 'username', 'admin_email', 'password').then(users => {
      res.render("displayUsers", { users: users })
  }).catch(error => {
    console.error("Error fetching users:", error);
    res.status(500).send("Error fetching users.");
  })
});

app.get('/newUser', (req, res) => {
  res.render('newUser', {error: "Passwords do not match. Please try again.", formSubmitted: false});
});

app.get('/editUsers/:id', (req, res) => {
  knex('users').where( 'volunteer_id', req.params.id ).first()
  .then(user => {
  if (!user) return res.status(404).send("User not found");
    res.render('editUsers', { user });
    }).catch(err => {
      console.log(err)
      res.status(500).json(err)
  })
});

app.post('/newUser', async (req, res) => {
    const username = req.body.username;
    const admin_email = req.body.admin_email;
    const password = req.body.password
    const confirm_password = req.body.confirm_password

    // checks to see if passwords match
    if (password !== confirm_password) {
      return res.status(400).render('newUser', { 
        user: {  
          username, 
          admin_email,
        },
        error: "Passwords do not match. Please try again.",
        formSubmitted: true
      });
    }

    // adds the new user record to the database
    await knex('users').insert({ 
      username: username, 
      admin_email: admin_email,
      password: password })
      .then(() => {
    res.redirect('/displayUsers')
    })
    .catch (error => {
    console.error("Error adding user:", error);
    res.status(500).render('editUsers', { 
      user: {
        username, 
        admin_email 
      },
      error: "An error occurred adding updating the user. Please try again later.",
      formSubmitted: true
    });
  })
});

app.post('/editUsers/:volunteer_id', async (req, res) => {
  const id = req.params.volunteer_id;
  const username = req.body.username;
  const admin_email = req.body.admin_email;
  const password = req.body.password

  knex('users')
    .where('volunteer_id', id)
    .update({
      username: username,
      admin_email: admin_email,
      password: password
    })
    .then(() => {
      res.redirect('/displayUsers'); // Redirect to the user list or another relevant page
    }) 
    .catch (error => {
        console.error('Error updating User:', error);
        res.status(500).send('Internal Server Error');
    });
});

app.post('/deleteUsers/:volunteer_id', async (req, res) => {
    const id = req.params.volunteer_id;

    knex('users')
      .where('volunteer_id', id)
      .del()
      .then(() => {
        res.redirect('/displayUsers');
      })
      .catch (error => {
        console.error("Error deleting user:", error);
        res.status(500).send("Error deleting user");
    })
});


app.post('/eventRequest', async (req, res) => {
  try {
    // Destructure the request body for cleaner code
    const {
      estimated_participant_count,
      space_size_id,
      event_type_id,
      first_choice_event_date,
      second_choice_event_date,
      third_choice_event_date,
      event_city,
      event_state,
      event_zip,
      estimated_event_start_time,
      estimated_even_duration_hours,
      event_contact_first_name,
      event_contact_last_name,
      event_contact_phone,
      jen_story,
      multi_day_event,
      event_status_id
    } = req.body;

    // Insert data into the database
    await knex("event_requests").insert({
      estimated_participant_count,
      space_size_id,
      event_type_id,
      first_choice_event_date,
      second_choice_event_date: second_choice_event_date || null,
      third_choice_event_date: third_choice_event_date || null,
      event_city,
      event_state,
      event_zip,
      estimated_event_start_time,
      estimated_even_duration_hours,
      event_contact_first_name,
      event_contact_last_name,
      event_contact_phone,
      jen_story,
      multi_day_event: multi_day_event === "false", // Ensure proper boolean conversion if needed
      event_status_id: 3 // Default value for event_status
    });

    // Redirect or send a success response
    res.redirect('/eventRequest');
  } catch (error) {
    console.error("Error inserting event request:", error);

    // Provide an informative error message to the user
    res.status(500).send("An error occurred while processing your request. Please try again later.");
  }
});





app.listen(port, () => console.log("My INTEX website is listening"));
