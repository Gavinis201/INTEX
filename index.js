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
      user: process.env.RDS_USERNAME || "intex", 
      password: process.env.RDS_PASSWORD || "password", 
      database: process.env.RDS_DB_NAME || "intex_test20", 
      port: process.env.RDS_PORT || 5432,
      // ssl: { rejectUnauthorized: false } // Enable SSL for AWS RDS PostgreSQL
    }
});

app.use(express.static(path.join(__dirname, "public") ));

// This formats time so that if it's stored as 09:00:00, we can display it as 9 AM
const formattedTime = (time) => {
  // Convert "09:00:00" to a Date object
  const date = new Date(`1970-01-01T${time}Z`);  // Use a dummy date
  let output = '';

  // Get the hour in 24-hour format
  let hour = date.getUTCHours();
  let min = date.getUTCMinutes();

  // Determine AM or PM
  const period = hour >= 12 ? 'PM' : 'AM';

  // Convert hour to 12-hour format
  if (hour > 12) {
    hour -= 12;
  } else if (hour === 0) {
    hour = 12; // Midnight case
  }
  if (min>=10) {
    output = `${hour}:${min} ${period}`
  }
  else if (min<10) {
    output = `${hour}:0${min} ${period}`
  }
  // Return formatted time like "9 AM"
  return output;
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
app.get('/editEventDetails/:id/:status', (req, res) => {
  let id = req.params.id;
  let status = req.params.status

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
  .where('event_requests.event_id',id)
  .first()
  .then(event => {
      if (!event) {
          return res.status(404).send('Event not found');
      }

      knex.select('*')
      .from('products')
      .orderBy('products.product_id','asc')
      .then(products => {

        knex.select('*')
        .from('completed_event_products')
        .join('products', 'completed_event_products.product_id','=','products.product_id' )
        .where('event_id',id)
        .orderBy('products.product_id','desc')
        .then( event_products => {
          res.render('editEventDetails', {event, status, products, event_products});
        })
        .catch(err => {
          console.log(err);
          res.status(500).json({err})
        });
      })
      .catch(err => {
        console.log(err);
        res.status(500).json({err})
      });
  })
  .catch(err => {
    console.log(err);
    res.status(500).json({err})
  });
});

app.post('/editEventDetails/:id/:status', (req,res) => {
  const id = req.params.id;
  const status = req.params.status
  if (status === 'Approved') {
    // Assign data from req.body to variables and ensure correct type conversion
    const event_contact_first_name = req.body.event_contact_first_name;
    const event_contact_last_name = req.body.event_contact_last_name;
    const event_address = req.body.event_address;
    const event_city = req.body.event_city;
    const event_state = req.body.event_state;
    const event_zip = req.body.event_zip;

    // Convert number fields to integers
    const estimated_team_members_needed = parseInt(req.body.estimated_team_members_needed);
    const sewing_machines_to_bring = parseInt(req.body.sewing_machines_to_bring);
    const sergers_to_bring = parseInt(req.body.sergers_to_bring);
    const estimated_participant_count = parseInt(req.body.estimated_participant_count);
    const approved_event_duration_hours = parseFloat(req.body.approved_event_duration_hours);
    const number_of_sewers = parseInt(req.body.number_of_sewers);

    // Convert space size and event type to integers
    const space_size_id = parseInt(req.body.space_size_id);
    const event_type_id = parseInt(req.body.event_type_id);

    // Convert checkbox field to boolean
    const jen_story = req.body.jen_story === 'true'; // true if checked, false if not

    // Convert date and time fields to the correct formats for PostgreSQL
    const approved_event_date = req.body.approved_event_date ? new Date(req.body.approved_event_date).toISOString().slice(0, 10) : null;
    const approved_event_start_time = req.body.approved_event_start_time ? req.body.approved_event_start_time : null;

    // Contact Information
    const event_contact_phone = req.body.event_contact_phone;
    const event_contact_email = req.body.event_contact_email;

    knex('event_requests')
    .where('event_id', id)
    .update({
      event_contact_first_name: event_contact_first_name,
      event_contact_last_name: event_contact_last_name,
      event_city: event_city,
      event_state: event_state,
      event_zip: event_zip,
      estimated_participant_count: estimated_participant_count,
      space_size_id: space_size_id,
      event_type_id: event_type_id,
      jen_story: jen_story,
      event_contact_phone: event_contact_phone,
      event_contact_email: event_contact_email
    })
    .then(() => {
      knex('approved_event_details')
      .where('event_id', id)
      .update({
        event_address: event_address, 
        estimated_team_members_needed: estimated_team_members_needed, 
        sewing_machines_to_bring: sewing_machines_to_bring, 
        sergers_to_bring: sergers_to_bring, 
        approved_event_duration_hours: approved_event_duration_hours, 
        number_of_sewers: number_of_sewers, 
        approved_event_date: approved_event_date, 
        approved_event_start_time: approved_event_start_time
      })
      .then(() => {
        res.redirect('/view_events');
      });
      
  })
  .catch(err => {
    console.log(err);
    res.status(500).json({err})
  });
  } else if (status === 'Pending') {
    // Assign data from req.body to variables and ensure correct type conversion
    const event_contact_first_name = req.body.event_contact_first_name;
    const event_contact_last_name = req.body.event_contact_last_name;
    const event_city = req.body.event_city;
    const event_state = req.body.event_state;
    const event_zip = req.body.event_zip;

    // Convert number fields to integers
    const estimated_participant_count = parseInt(req.body.estimated_participant_count);
    const estimated_event_duration_hours = parseFloat(req.body.estimated_event_duration_hours);

    // Convert space size and event type to integers
    const space_size_id = parseInt(req.body.space_size_id);
    const event_type_id = parseInt(req.body.event_type_id);

    // Convert checkbox field to boolean
    const jen_story = req.body.jen_story === 'true'; // true if checked, false if not

    // Convert date and time fields to the correct formats for PostgreSQL
    const first_choice_event_date = req.body.first_choice_event_date ? new Date(req.body.first_choice_event_date).toISOString().slice(0, 10) : null;
    const second_choice_event_date = req.body.second_choice_event_date ? new Date(req.body.second_choice_event_date).toISOString().slice(0, 10) : null;
    const third_choice_event_date = req.body.third_choice_event_date ? new Date(req.body.third_choice_event_date).toISOString().slice(0, 10) : null;
    const estimated_event_start_time = req.body.estimated_event_start_time ? req.body.estimated_event_start_time : null;

    // Contact Information
    const event_contact_phone = req.body.event_contact_phone;
    const event_contact_email = req.body.event_contact_email;

    knex('event_requests')
    .where('event_id', id)
    .update({
      event_contact_first_name: event_contact_first_name,
      event_contact_last_name: event_contact_last_name,
      event_city: event_city,
      event_state: event_state,
      event_zip: event_zip,
      estimated_participant_count: estimated_participant_count,
      space_size_id: space_size_id,
      event_type_id: event_type_id,
      jen_story: jen_story,
      event_contact_phone: event_contact_phone,
      event_contact_email: event_contact_email,
      first_choice_event_date:first_choice_event_date,
      second_choice_event_date:second_choice_event_date,
      third_choice_event_date:third_choice_event_date,
      estimated_event_start_time:estimated_event_start_time
    })
    .then(() => {
      res.redirect('/view_events')
    });


  } else if (status === 'Declined') {

    // Assign data from req.body to variables and ensure correct type conversion
    const event_contact_first_name = req.body.event_contact_first_name;
    const event_contact_last_name = req.body.event_contact_last_name;
    const event_city = req.body.event_city;
    const event_state = req.body.event_state;
    const event_zip = req.body.event_zip;

    // Convert number fields to integers
    const estimated_participant_count = parseInt(req.body.estimated_participant_count);
    const estimated_event_duration_hours = parseFloat(req.body.estimated_event_duration_hours);

    // Convert space size and event type to integers
    const space_size_id = parseInt(req.body.space_size_id);
    const event_type_id = parseInt(req.body.event_type_id);

    // Convert checkbox field to boolean
    const jen_story = req.body.jen_story === 'true'; // true if checked, false if not

    // Convert date and time fields to the correct formats for PostgreSQL
    const first_choice_event_date = req.body.first_choice_event_date ? new Date(req.body.first_choice_event_date).toISOString().slice(0, 10) : null;
    const estimated_event_start_time = req.body.estimated_event_start_time ? req.body.estimated_event_start_time : null;

    // Contact Information
    const event_contact_phone = req.body.event_contact_phone;
    const event_contact_email = req.body.event_contact_email;

    knex('event_requests')
    .where('event_id', id)
    .update({
      event_contact_first_name: event_contact_first_name,
      event_contact_last_name: event_contact_last_name,
      event_city: event_city,
      event_state: event_state,
      event_zip: event_zip,
      estimated_participant_count: estimated_participant_count,
      space_size_id: space_size_id,
      event_type_id: event_type_id,
      jen_story: jen_story,
      event_contact_phone: event_contact_phone,
      event_contact_email: event_contact_email,
      first_choice_event_date:first_choice_event_date,
      estimated_event_start_time:estimated_event_start_time
    })
    .then(() => {
      res.redirect('/view_events')
    });

  }

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
