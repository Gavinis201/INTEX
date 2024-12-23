DDL Statements to create and populate tables

-----------------------------------CREATE DATABASE SCRIPT-----------------------------------
-- Table: sewing_level
CREATE TABLE sewing_level (
    sewing_level_id INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY ,
    sewing_level_description VARCHAR(15)
);

-- Table: volunteer_source
CREATE TABLE volunteer_source (
    volunteer_source_id INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY ,
    source_description VARCHAR(20)
);

-- Table: volunteer_travel_range_id
CREATE TABLE volunteer_travel_range_id (
    volunteer_travel_range_id INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    volunteer_travel_range_description VARCHAR(20)
);

-- Table: space_size
CREATE TABLE space_size (
    space_size_id INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    space_size_description VARCHAR(15)
);

-- Table: event_type
CREATE TABLE event_type (
    event_type_id INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    event_type_description VARCHAR(20)
);

-- Table: event_status
CREATE TABLE event_status (
    event_status_id INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    event_status_description VARCHAR(15)
);

-- Table: products
CREATE TABLE products (
    product_id INT  GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    product_name VARCHAR(25)
);

-- Table: volunteers
CREATE TABLE volunteers (
    volunteer_id INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    volunteer_first_name VARCHAR(30),
    volunteer_last_name VARCHAR(30),
    volunteer_phone VARCHAR(15),
    volunteer_email VARCHAR(75),
    volunteer_city VARCHAR(35),
    volunteer_state VARCHAR(2),
    volunteer_zip VARCHAR(5),
    sewing_level_id INT,
    volunteer_source_id INT,
    volunteer_travel_range_id INT,
    willing_to_lead BOOLEAN,
    willing_to_sew BOOLEAN,
    volunteer_hours_per_month INT,
    FOREIGN KEY (sewing_level_id) REFERENCES sewing_level(sewing_level_id),
    FOREIGN KEY (volunteer_source_id) REFERENCES volunteer_source(volunteer_source_id),
    FOREIGN KEY (volunteer_travel_range_id) REFERENCES volunteer_travel_range(volunteer_travel_range_id)
);

-- Table: event_requests
CREATE TABLE event_requests (
    event_id INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    estimated_participant_count INT,
    space_size_id INT,
    event_type_id INT,
    first_choice_event_date DATE,
    second_choice_event_date DATE,
    third_choice_event_date DATE,
    event_city VARCHAR(35),
    event_state VARCHAR(2),
    event_zip VARCHAR(5),
    estimated_event_start_time TIME,
    estimated_event_duration_hours DECIMAL(5, 2),
    event_contact_first_name VARCHAR(30),
    event_contact_last_name VARCHAR(30),
    event_contact_phone VARCHAR(15),
    event_contact_email VARCHAR(75),
    jen_story BOOLEAN,
    multi_day_event BOOLEAN,
    event_status_id INT,
    FOREIGN KEY (space_size_id) REFERENCES space_size(space_size_id),
    FOREIGN KEY (event_type_id) REFERENCES event_type(event_type_id),
    FOREIGN KEY (event_status_id) REFERENCES event_status(event_status_id)
);

-- Table: completed_event_products
CREATE TABLE completed_event_products (
    event_id INT,
    product_id INT,
    quantity_produced INT,
    PRIMARY KEY (event_id, product_id),
    FOREIGN KEY (event_id) REFERENCES event_requests(event_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- Table: users
CREATE TABLE users (
    volunteer_id INT PRIMARY KEY,
    username VARCHAR(30),
    password VARCHAR(30),
    admin_email VARCHAR(75),
    FOREIGN KEY (volunteer_id) REFERENCES volunteers(volunteer_id)
);

-- Table: completed_event_details
CREATE TABLE completed_event_details (
    event_id INT PRIMARY KEY,
    completed_participants_count INT,
    completed_event_notes TEXT,
    FOREIGN KEY (event_id) REFERENCES event_requests(event_id)
);

-- Table: event_people
CREATE TABLE event_volunteers (
    volunteer_id INT,
    event_id INT,
    PRIMARY KEY (volunteer_id, event_id),
    FOREIGN KEY (volunteer_id) REFERENCES volunteers(volunteer_id),
    FOREIGN KEY (event_id) REFERENCES event_requests(event_id)
);

-- Table: approved_event_details
CREATE TABLE approved_event_details (
    event_id INT PRIMARY KEY,
    approved_event_date DATE,
    approved_event_start_time TIME,
    approved_event_duration_hours DECIMAL(5, 2),
    event_address VARCHAR(75),
    estimated_team_members_needed INT,
    number_of_sewers INT,
    sewing_machines_to_bring INT,
    sergers_to_bring INT,
    approved_event_notes TEXT,
    FOREIGN KEY (event_id) REFERENCES event_requests(event_id)
);



---------------------------------INSERT DUMMY DATA SCRIPT----------------------------------------
-- Insert data into sewing_level
INSERT INTO sewing_level (sewing_level_description) VALUES
('Beginner'),
('Intermediate'),
('Experienced');

-- Insert data into volunteer_source
INSERT INTO volunteer_source (source_description) VALUES
('Social Media'),
('Word of Mouth'),
('Community Events'),
('Email/Newsletter'),
('Podcast'),
('Other');

-- Insert data into volunteer_travel_range
INSERT INTO volunteer_travel_range (volunteer_travel_range_description) VALUES
('Within City'),
('Within County'),
('Outside County');

-- Insert data into space_size
INSERT INTO space_size (space_size_description) VALUES
('Small'),
('Medium'),
('Large');

-- Insert data into event_type
INSERT INTO event_type (event_type_description) VALUES
('Sewing'),
('Non-sewing'),
('Both');

-- Insert data into event_status
INSERT INTO event_status (event_status_description) VALUES
('Approved'),
('Declined'),
('Pending'),
('Completed'),
('Canceled');

-- Insert data into products
INSERT INTO products (product_name) VALUES
('Pocket'),
('Collar'),
('Envelope'),
('Vest'),
('Completed Product');

-- Insert data into volunteers
INSERT INTO volunteers (volunteer_first_name, volunteer_last_name, volunteer_phone, volunteer_email, volunteer_city,
    volunteer_state, volunteer_zip, sewing_level_id, volunteer_source_id, volunteer_travel_range_id, 
    willing_to_lead, willing_to_sew, volunteer_hours_per_month)
VALUES
('Matthew', 'Jones', '(111)-222-3333', 'matthew.jones@example.com', 'Salt Lake City', 'UT', '84102', 1, 1, 1, TRUE, TRUE, 10),
('Isabella', 'Taylor', '(222)-333-4444', 'isabella.taylor@example.com', 'Provo', 'UT', '84603', 2, 2, 2, FALSE, TRUE, 8),
('Olivia', 'Martinez', '(333)-444-5555', 'olivia.martinez@example.com', 'Ogden', 'UT', '84402', 3, 3, 1, TRUE, TRUE, 12),
('Liam', 'Harris', '(444)-555-6666', 'liam.harris@example.com', 'Logan', 'UT', '84322', 1, 2, 3, FALSE, FALSE, 6),
('Sophia', 'Clark', '(555)-666-7777', 'sophia.clark@example.com', 'St. George', 'UT', '84771', 2, 3, 2, TRUE, TRUE, 15),
('Ethan', 'Davis', '(666)-777-8888', 'ethan.davis@example.com', 'Salt Lake City', 'UT', '84103', 1, 1, 1, TRUE, TRUE, 9),
('Amelia', 'García', '(777)-888-9999', 'amelia.garcia@example.com', 'Provo', 'UT', '84605', 2, 1, 1, FALSE, TRUE, 7),
('James', 'Lopez', '(888)-999-0000', 'james.lopez@example.com', 'Ogden', 'UT', '84403', 3, 2, 2, TRUE, TRUE, 18),
('Benjamin', 'Walker', '(999)-000-1111', 'benjamin.walker@example.com', 'Logan', 'UT', '84323', 1, 3, 3, FALSE, FALSE, 10),
('Charlotte', 'Young', '(101)-111-2222', 'charlotte.young@example.com', 'St. George', 'UT', '84772', 2, 3, 1, TRUE, TRUE, 20),
('Amos', 'King', '(212)-323-4343', 'amos.king@example.com', 'Salt Lake City', 'UT', '84104', 1, 1, 2, TRUE, TRUE, 8),
('Mia', 'Scott', '(323)-434-5454', 'mia.scott@example.com', 'Provo', 'UT', '84606', 3, 2, 1, FALSE, TRUE, 12);

INSERT INTO event_requests (
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
    estimated_event_duration_hours,
    event_contact_first_name,
    event_contact_last_name,
    event_contact_phone,
    event_contact_email,
    jen_story,
    multi_day_event,
    event_status_id
)
VALUES
-- Past events: 2 Completed, 1 Declined
(30, 2, 1, '2023-10-10', NULL, NULL, 'Salt Lake City', 'UT', '84102', '10:00:00', 4.0, 'John', 'Doe', '123-456-7890', 'johndoe@example.com', FALSE, FALSE, 4),
(40, 3, 3, '2023-08-15', NULL, NULL, 'Provo', 'UT', '84603', '14:00:00', 5.0, 'Jane', 'Smith', '234-567-8901', 'janesmith@example.com', TRUE, FALSE, 4),
(20, 1, 2, '2023-07-20', NULL, NULL, 'Ogden', 'UT', '84402', '09:00:00', 3.5, 'Bob', 'White', '345-678-9012', 'bobwhite@example.com', FALSE, TRUE, 2),

-- Future events: 2 Approved, 2 Pending, 1 Declined
(50, 3, 1, '2025-06-15', NULL, NULL, 'Logan', 'UT', '84321', '13:00:00', 6.0, 'Alice', 'Brown', '456-789-0123', 'alicebrown@example.com', TRUE, FALSE, 1),
(60, 2, 3, '2025-07-10', NULL, NULL, 'St. George', 'UT', '84770', '11:00:00', 5.5, 'Carol', 'Green', '567-890-1234', 'carolgreen@example.com', FALSE, FALSE, 1),
(25, 1, 2, '2025-09-05', NULL, NULL, 'Salt Lake City', 'UT', '84103', '15:00:00', 4.0, 'Eve', 'King', '678-901-2345', 'eveking@example.com', TRUE, TRUE, 3),
(35, 2, 1, '2025-08-20', NULL, NULL, 'Provo', 'UT', '84604', '10:30:00', 3.0, 'Liam', 'Scott', '789-012-3456', 'liamscott@example.com', FALSE, FALSE, 3),
(15, 1, 2, '2025-10-01', NULL, NULL, 'Ogden', 'UT', '84405', '09:30:00', 2.5, 'Mia', 'Johnson', '890-123-4567', 'miajohnson@example.com', TRUE, FALSE, 2);


INSERT INTO approved_event_details (
    event_id,
    approved_event_date,
    approved_event_start_time,
    approved_event_duration_hours,
    event_address,
    estimated_team_members_needed,
    number_of_sewers,
    sewing_machines_to_bring,
    sergers_to_bring,
    approved_event_notes
)
VALUES
-- Completed events (past dates)
(1, '2023-10-10', '10:00:00', 4.0, '123 Main St', 5, 3, 2, 1, 'Well-organized event'),
(2, '2023-08-15', '14:00:00', 5.0, '456 Elm St', 6, 4, 3, 2, 'Great turnout'),

-- Approved events (future dates in 2025)
(4, '2025-06-15', '13:00:00', 6.0, '789 Pine St', 8, 5, 4, 3, 'Preparations underway'),
(5, '2025-07-10', '11:00:00', 5.5, '101 Maple Ave', 7, 6, 5, 2, 'Venue confirmed');



INSERT INTO completed_event_products (
    event_id,
    product_id,
    quantity_produced
)
VALUES
(1, 1, 30),
(1, 2, 25),
(1, 3, 20),
(2, 1, 35),
(2, 3, 40),
(2, 4, 15);


INSERT INTO completed_event_details (
    event_id,
    completed_participants_count,
    completed_event_notes
)
VALUES
(1, 25, 'Participants enjoyed the sewing activities.'),
(2, 40, 'Exceeded expectations for attendance.');


INSERT INTO event_volunteers (
    volunteer_id,
    event_id
)
VALUES
(1, 1),
(2, 1),
(3, 2),
(4, 2),
(5, 4),
(6, 4),
(7, 5),
(8, 5),
(1, 5),
(9, 1);

-- Insert data into users
INSERT INTO users (volunteer_id, username, password, admin_email)
VALUES
(1, 'johndoe', 'securepassword123', 'admin1@example.com'),
(2, 'janesmith', 'password456!', 'admin2@example.com'),
(3, 'alicebrown', 'safeP@ssword!', 'admin3@example.com'),
(4, 'bobwhite', 'Pa$$w0rd!', 'admin4@example.com'),
(5, 'carolgreen', 'Green@123', 'admin5@example.com');
