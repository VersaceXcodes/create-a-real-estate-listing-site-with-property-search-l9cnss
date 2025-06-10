-- Create table for users
CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  phone         TEXT,
  role          TEXT NOT NULL,
  company_name  TEXT,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

-- Create table for property_listings
CREATE TABLE property_listings (
  id            TEXT PRIMARY KEY,
  agent_id      TEXT NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT NOT NULL,
  property_type TEXT NOT NULL,
  price         NUMERIC NOT NULL,
  address       TEXT NOT NULL,
  city          TEXT NOT NULL,
  zip_code      TEXT NOT NULL,
  amenities     JSON,
  bedrooms      INTEGER NOT NULL,
  bathrooms     INTEGER NOT NULL,
  area          NUMERIC NOT NULL,
  latitude      NUMERIC,
  longitude     NUMERIC,
  status        TEXT NOT NULL,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  published_at  TEXT,
  FOREIGN KEY (agent_id) REFERENCES users(id)
);

-- Create table for property_images
CREATE TABLE property_images (
  id                    TEXT PRIMARY KEY,
  property_listing_id   TEXT NOT NULL,
  image_url             TEXT NOT NULL,
  alt_text              TEXT,
  display_order         INTEGER NOT NULL,
  created_at            TEXT NOT NULL,
  FOREIGN KEY (property_listing_id) REFERENCES property_listings(id)
);

-- Create table for favorites
CREATE TABLE favorites (
  id                   TEXT PRIMARY KEY,
  user_id              TEXT NOT NULL,
  property_listing_id  TEXT NOT NULL,
  created_at           TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (property_listing_id) REFERENCES property_listings(id)
);

-- Create table for inquiries
CREATE TABLE inquiries (
  id                  TEXT PRIMARY KEY,
  property_listing_id TEXT NOT NULL,
  sender_name         TEXT NOT NULL,
  sender_email        TEXT NOT NULL,
  sender_phone        TEXT,
  message             TEXT NOT NULL,
  is_read             BOOLEAN NOT NULL DEFAULT false,
  created_at          TEXT NOT NULL,
  FOREIGN KEY (property_listing_id) REFERENCES property_listings(id)
);

-- Create table for listing_audits
CREATE TABLE listing_audits (
  id                  TEXT PRIMARY KEY,
  property_listing_id TEXT NOT NULL,
  action              TEXT NOT NULL,
  change_details      JSON,
  performed_by        TEXT NOT NULL,
  performed_at        TEXT NOT NULL,
  FOREIGN KEY (property_listing_id) REFERENCES property_listings(id),
  FOREIGN KEY (performed_by) REFERENCES users(id)
);

-- Create table for password_resets
CREATE TABLE password_resets (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL,
  reset_token  TEXT NOT NULL UNIQUE,
  created_at   TEXT NOT NULL,
  expires_at   TEXT NOT NULL,
  used         BOOLEAN NOT NULL DEFAULT false,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

---------------------------------------------------------------
-- SEED DATA
---------------------------------------------------------------

-- Insert seed data for users
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, company_name, created_at, updated_at) VALUES
  ('user1', 'seeker1@example.com', 'hashedpassword1', 'Alice', 'Smith', '123-456-7890', 'seeker', NULL, '2023-10-01T12:00:00Z', '2023-10-01T12:00:00Z'),
  ('user2', 'seeker2@example.com', 'hashedpassword2', 'Bob', 'Jones', '234-567-8901', 'seeker', NULL, '2023-10-01T13:00:00Z', '2023-10-01T13:00:00Z'),
  ('agent1', 'agent1@example.com', 'hashedpassword3', 'Charlie', 'Brown', '345-678-9012', 'agent', 'Dream Homes Realty', '2023-10-01T14:00:00Z', '2023-10-01T14:00:00Z'),
  ('agent2', 'agent2@example.com', 'hashedpassword4', 'Diana', 'Prince', '456-789-0123', 'agent', 'Super Realty', '2023-10-01T15:00:00Z', '2023-10-01T15:00:00Z'),
  ('admin1', 'admin1@example.com', 'adminhash', 'Ethan', 'Hunt', '567-890-1234', 'admin', NULL, '2023-10-01T16:00:00Z', '2023-10-01T16:00:00Z');

-- Insert seed data for property_listings
INSERT INTO property_listings (id, agent_id, title, description, property_type, price, address, city, zip_code, amenities, bedrooms, bathrooms, area, latitude, longitude, status, created_at, updated_at, published_at) VALUES
  ('listing1', 'agent1', 'Cozy Apartment in Downtown', 'A beautiful and cozy apartment in the heart of the city, close to all amenities.', 'apartment', 250000, '123 Main St', 'Metropolis', '12345', '["pool", "gym"]', 2, 1, 850, 40.7128, -74.0060, 'published', '2023-10-02T08:00:00Z', '2023-10-02T08:00:00Z', '2023-10-02T09:00:00Z'),
  ('listing2', 'agent1', 'Luxury Condo with Sea View', 'Experience luxury living with breathtaking sea views and top-notch amenities.', 'condo', 750000, '456 Ocean Dr', 'Coast City', '54321', '["balcony", "gym", "parking"]', 3, 2, 2000, 34.0195, -118.4912, 'draft', '2023-10-03T10:00:00Z', '2023-10-03T10:00:00Z', NULL),
  ('listing3', 'agent2', 'Suburban Family House', 'A spacious house perfect for a family, located in a tranquil suburb.', 'house', 500000, '789 Suburban Rd', 'Smallville', '67890', '["garden", "garage"]', 4, 3, 3000, 37.7749, -122.4194, 'published', '2023-10-04T11:00:00Z', '2023-10-04T11:00:00Z', '2023-10-04T12:00:00Z');

-- Insert seed data for property_images
INSERT INTO property_images (id, property_listing_id, image_url, alt_text, display_order, created_at) VALUES
  ('img1', 'listing1', 'https://picsum.photos/seed/listing1a/600', 'Living room view', 1, '2023-10-02T09:05:00Z'),
  ('img2', 'listing1', 'https://picsum.photos/seed/listing1b/600', 'Bedroom view', 2, '2023-10-02T09:06:00Z'),
  ('img3', 'listing2', 'https://picsum.photos/seed/listing2a/600', 'Sea view', 1, '2023-10-03T10:05:00Z'),
  ('img4', 'listing3', 'https://picsum.photos/seed/listing3a/600', 'Front view', 1, '2023-10-04T12:05:00Z'),
  ('img5', 'listing3', 'https://picsum.photos/seed/listing3b/600', 'Backyard view', 2, '2023-10-04T12:06:00Z'),
  ('img6', 'listing3', 'https://picsum.photos/seed/listing3c/600', 'Kitchen view', 3, '2023-10-04T12:07:00Z');

-- Insert seed data for favorites
INSERT INTO favorites (id, user_id, property_listing_id, created_at) VALUES
  ('fav1', 'user1', 'listing1', '2023-10-05T10:00:00Z'),
  ('fav2', 'user1', 'listing3', '2023-10-05T10:05:00Z'),
  ('fav3', 'user2', 'listing2', '2023-10-06T11:00:00Z'),
  ('fav4', 'user2', 'listing1', '2023-10-06T11:05:00Z');

-- Insert seed data for inquiries
INSERT INTO inquiries (id, property_listing_id, sender_name, sender_email, sender_phone, message, is_read, created_at) VALUES
  ('inquiry1', 'listing1', 'John Doe', 'john.doe@example.com', '555-1234', 'I am interested in this property. Please contact me with more details.', false, '2023-10-07T08:00:00Z'),
  ('inquiry2', 'listing3', 'Jane Roe', 'jane.roe@example.com', NULL, 'Could I schedule a visit?', false, '2023-10-08T09:00:00Z');

-- Insert seed data for listing_audits
INSERT INTO listing_audits (id, property_listing_id, action, change_details, performed_by, performed_at) VALUES
  ('audit1', 'listing1', 'created', '{"fields_changed": ["title", "price"]}', 'agent1', '2023-10-02T09:00:00Z'),
  ('audit2', 'listing2', 'updated', '{"fields_changed": ["description", "amenities"]}', 'agent1', '2023-10-03T11:00:00Z'),
  ('audit3', 'listing3', 'published', '{"fields_changed": ["status"]}', 'agent2', '2023-10-04T12:00:00Z');

-- Insert seed data for password_resets
INSERT INTO password_resets (id, user_id, reset_token, created_at, expires_at, used) VALUES
  ('pr1', 'user1', 'reset_token_abc123', '2023-10-07T10:00:00Z', '2023-10-07T12:00:00Z', false),
  ('pr2', 'agent1', 'reset_token_def456', '2023-10-07T11:00:00Z', '2023-10-07T13:00:00Z', false);