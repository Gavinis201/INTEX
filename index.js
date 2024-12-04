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
        database: process.env.RDS_DB_NAME || "intex_test13", 
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
  res.render('loginPage')
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

app.get('/volunteerSignUpPage', (req, res) => {
  // Fetch Pokémon types to populate the dropdown
  knex('sewing_level')
    .select('sewing_level_id', 'sewing_level_description')
    .then(sewing_types => {

      knex('volunteer_source')
        .select('volunteer_source_id', 'source_description')
        .then(volunteer_source_types => {

          knex('volunteer_travel_range_id')
            .select('volunteer_travel_range_id', 'volunteer_travel_range_description')
            .then(volunteer_travel_range_types => {
          
            // Render the add form with the Pokémon types data
            res.render('volunteerSignUpPage', { sewing_types, volunteer_source_types, volunteer_travel_range_types});
          })
        })
    })
    .catch(error => {
      console.error('Error fetching Sewing, Volunteer Source and Volunter travel range types:', error);
      res.status(500).send('Internal Server Error');
    });
});

// view_events page code
app.post('/view_events', (req, res) => {
  knex.select('*')
  .from('event_requests')
  .join('event_status', 'event_requests.event_status_id','=','event_status.event_status_id' )
  .join('space_size', 'event_requests.space_size_id','=','space_size.space_size_id' )
  .join('event_type', 'event_requests.event_type_id','=','event_type.event_type_id' )
  .orderBy('first_choice_event_date')
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
        return event;
      });
      // Format the time for each event request
      event_requests.forEach(event => {
        event.formatted_time = formattedTime(event.estimated_event_start_time);
      });
    res.render("view_events", { event_requests });
  }).catch(err => {
      console.log(err);
      res.status(500).json({err});
    })
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
