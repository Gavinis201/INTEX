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
        user: process.env.RDS_USERNAME || "testuser", 
        password: process.env.RDS_PASSWORD || "test", 
        database: process.env.RDS_DB_NAME || "Intex", 
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
    const { username, admin_email, password } = req.body;

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
    await knex('users').insert({ username, admin_email, password });
    res.redirect('/displayUsers')
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

app.post('/editUsers/:id', async (req, res) => {
  const userId = req.params.id;
  const { username, email, password } = req.body;

  try {
    const user = await User.findById(userId); // Fetch the user from the database
    if (!user) {
      return res.status(404).send('User not found');
    }

    // Update user details
    user.username = username;
    user.admin_email = email;

    // Update password only if provided
    if (password && password.trim() !== '') {
      user.password = password; // Hash the password if required
    }

    await user.save(); // Save the updated user to the database
    res.redirect('/users'); // Redirect to the user list or another relevant page
  } catch (error) {
    console.error(error);
    res.render('editUser', {
      user: { _id: userId, username, admin_email: email },
      formSubmitted: true,
      error: 'Failed to update user. Please try again.',
    });
  }
});

app.post('/deleteUsers/:id', async (req, res) => {
    knex('users').where({ volunteer_id: req.params.id }).del().then(users => {
      res.redirect('/users');
    }).catch (error => {
    console.error("Error deleting user:", error);
    res.status(500).send("Error deleting user.");
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

app.listen(port, () => console.log("My INTEX website is listening!"));
