// server.mjs

// Load environment variables before anything else
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import morgan from "morgan";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import pkg from "pg";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { fileURLToPath } from "url";
import sgMail from "@sendgrid/mail";

// Configure SendGrid API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const { Pool } = pkg;
const { DATABASE_URL, PGHOST, PGDATABASE, PGUSER, PGPASSWORD, PGPORT = 5432 } = process.env;
const isProduction = process.env.NODE_ENV === "production";
const pool = new Pool(
  DATABASE_URL
    ? {
        connectionString: DATABASE_URL,
        ssl: isProduction ? { require: true, rejectUnauthorized: false } : false
      }
    : {
        host: PGHOST,
        database: PGDATABASE,
        user: PGUSER,
        password: PGPASSWORD,
        port: Number(PGPORT),
        ssl: isProduction ? { require: true, rejectUnauthorized: false } : false
      }
);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("combined"));

/*
  Middleware to authenticate JWT tokens.
  Extracts Bearer token from Authorization header and verifies it.
*/
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Missing token" });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
}

/*
  Middleware to ensure that the authenticated user has the required role.
  Usage: requireRole("agent") or requireRole("admin")
*/
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: "Forbidden: Insufficient role" });
    }
    next();
  };
}

/*
  Helper function to generate JWT token with minimal user details.
*/
function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    first_name: user.first_name,
    last_name: user.last_name
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
}

/*
  Helper function to retrieve detailed property listing information
*/
async function getPropertyListingDetail(id) {
  const listingResult = await pool.query(`SELECT * FROM property_listings WHERE id = $1`, [id]);
  const listing = listingResult.rows[0];
  if (!listing) return null;
  const imagesResult = await pool.query(`SELECT * FROM property_images WHERE property_listing_id = $1 ORDER BY display_order ASC`, [id]);
  const images = imagesResult.rows;
  const agentResult = await pool.query(`SELECT id, email, first_name, last_name, phone, role, company_name, created_at, updated_at FROM users WHERE id = $1`, [listing.agent_id]);
  const agent = agentResult.rows[0];
  return { ...listing, images, agent };
}

/*
  API Endpoint: POST /api/auth/register
  Registers a new user (property seeker or agent)
*/
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, first_name, last_name, role, phone, company_name } = req.body;
    // Validate required fields
    if (!email || !password || !first_name || !last_name || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    // Hash the password
    const password_hash = await bcrypt.hash(password, 10);
    const id = uuidv4();
    const created_at = new Date().toISOString();
    const updated_at = created_at;
    
    // Insert new user record into the database
    await pool.query(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, company_name, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [id, email, password_hash, first_name, last_name, phone || null, role, company_name || null, created_at, updated_at]
    );
    const user = { id, email, first_name, last_name, phone: phone || null, role, company_name: company_name || null, created_at, updated_at };
    const token = generateToken(user);
    return res.json({ token, user });
  } catch (error) {
    console.error("Error in /api/auth/register:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/*
  API Endpoint: POST /api/auth/login
  Authenticates an existing user and returns a JWT token.
*/
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password" });
    }
    // Query user by email
    const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
    const userRecord = result.rows[0];
    if (!userRecord) {
      return res.status(400).json({ error: "Invalid credentials" });
    }
    // Compare password using bcrypt
    const isValid = await bcrypt.compare(password, userRecord.password_hash);
    if (!isValid) {
      return res.status(400).json({ error: "Invalid credentials" });
    }
    const user = {
      id: userRecord.id,
      email: userRecord.email,
      first_name: userRecord.first_name,
      last_name: userRecord.last_name,
      phone: userRecord.phone,
      role: userRecord.role,
      company_name: userRecord.company_name,
      created_at: userRecord.created_at,
      updated_at: userRecord.updated_at
    };
    const token = generateToken(user);
    return res.json({ token, user });
  } catch (error) {
    console.error("Error in /api/auth/login:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/*
  API Endpoint: POST /api/auth/password_resets
  Initiates a password reset process by generating a reset token.
  In a production system, an email service would be used to send reset instructions.
*/
app.post("/api/auth/password_resets", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });
    // Find user by email
    const userResult = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
    const userRecord = userResult.rows[0];
    if (!userRecord) {
      // For security, still return success even if user does not exist
      return res.json({ message: "If that email exists, password reset instructions have been sent." });
    }
    const resetId = uuidv4();
    const reset_token = uuidv4();
    const created_at = new Date().toISOString();
    const expires_at = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours expiry
    await pool.query(
      `INSERT INTO password_resets (id, user_id, reset_token, created_at, expires_at, used)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [resetId, userRecord.id, reset_token, created_at, expires_at, false]
    );
    // Construct reset link
    const resetLink = `${process.env.RESET_BASE_URL || "http://localhost:3000/reset"}?token=${reset_token}`;
    const emailMessage = {
      to: userRecord.email,
      from: process.env.SENDGRID_FROM_EMAIL || "no-reply@yourdomain.com",
      subject: "Password Reset Instructions",
      text: `You requested a password reset. Please use the following link to reset your password: ${resetLink}`,
      html: `<p>You requested a password reset.</p><p>Please click <a href="${resetLink}">here</a> to reset your password.</p>`
    };
    try {
      await sgMail.send(emailMessage);
      console.log("Reset instructions email sent successfully.");
    } catch (err) {
      console.error("Error sending reset email:", err);
      // Continue without exposing error to client
    }
    return res.json({ message: "Password reset instructions have been sent." });
  } catch (error) {
    console.error("Error in /api/auth/password_resets:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/*
  API Endpoint: GET /api/properties
  Retrieves a list of published property listings applying optional filters, sorting and pagination.
*/
app.get("/api/properties", async (req, res) => {
  try {
    const {
      keywords,
      price_min,
      price_max,
      bedrooms,
      bathrooms,
      property_type,
      city,
      page = 1,
      limit = 10,
      sort,
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;

    let query = `
      SELECT pl.*, 
        (SELECT image_url FROM property_images WHERE property_listing_id = pl.id ORDER BY display_order ASC LIMIT 1) AS primary_image_url
      FROM property_listings pl
      WHERE pl.status = 'published'
    `;
    const params = [];
    let count = 1;

    // Dynamic filters
    if (keywords) {
      query += ` AND (pl.title ILIKE $${count} OR pl.description ILIKE $${count})`;
      params.push(`%${keywords}%`);
      count++;
    }
    if (price_min) {
      query += ` AND pl.price >= $${count}`;
      params.push(price_min);
      count++;
    }
    if (price_max) {
      query += ` AND pl.price <= $${count}`;
      params.push(price_max);
      count++;
    }
    if (bedrooms) {
      query += ` AND pl.bedrooms = $${count}`;
      params.push(bedrooms);
      count++;
    }
    if (bathrooms) {
      query += ` AND pl.bathrooms = $${count}`;
      params.push(bathrooms);
      count++;
    }
    if (property_type) {
      query += ` AND pl.property_type = $${count}`;
      params.push(property_type);
      count++;
    }
    if (city) {
      query += ` AND pl.city ILIKE $${count}`;
      params.push(`%${city}%`);
      count++;
    }

    // Sorting
    if (sort === "price_asc") {
      query += ` ORDER BY pl.price ASC`;
    } else if (sort === "price_desc") {
      query += ` ORDER BY pl.price DESC`;
    } else if (sort === "newest") {
      query += ` ORDER BY pl.published_at DESC`;
    } else {
      query += ` ORDER BY pl.published_at DESC`;
    }

    // Pagination
    const offset = (pageNum - 1) * limitNum;
    query += ` LIMIT $${count} OFFSET $${count + 1}`;
    params.push(limitNum, offset);

    const result = await pool.query(query, params);
    return res.json(result.rows);
  } catch (error) {
    console.error("Error in GET /api/properties:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/*
  API Endpoint: GET /api/properties/:id
  Retrieves detailed information for a specific property listing including images and agent details.
*/
app.get("/api/properties/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const detailedListing = await getPropertyListingDetail(id);
    if (!detailedListing) {
      return res.status(404).json({ error: "Property listing not found" });
    }
    return res.json(detailedListing);
  } catch (error) {
    console.error("Error in GET /api/properties/:id:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/*
  API Endpoint: POST /api/properties
  Allows an authenticated agent to create a new property listing.
  Accepts listing details and an optional images array.
*/
app.post("/api/properties", authenticateToken, requireRole("agent"), async (req, res) => {
  try {
    const {
      title,
      description,
      property_type,
      price,
      address,
      city,
      zip_code,
      amenities,
      bedrooms,
      bathrooms,
      area,
      latitude,
      longitude,
      images, // Expecting an array of { image_url, alt_text, display_order }
    } = req.body;

    if (!title || !description || !property_type || !price || !address || !city || !zip_code || !bedrooms || !bathrooms || !area) {
      return res.status(400).json({ error: "Missing required property listing fields" });
    }

    const id = uuidv4();
    const created_at = new Date().toISOString();
    const updated_at = created_at;
    // For simplicity, set published_at to current time and status to 'published'
    const published_at = created_at;
    const status = "published";

    // Insert the property listing
    await pool.query(
      `INSERT INTO property_listings 
      (id, agent_id, title, description, property_type, price, address, city, zip_code, amenities, bedrooms, bathrooms, area, latitude, longitude, status, created_at, updated_at, published_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
      [
        id,
        req.user.id,
        title,
        description,
        property_type,
        price,
        address,
        city,
        zip_code,
        amenities ? JSON.stringify(amenities) : null,
        bedrooms,
        bathrooms,
        area,
        latitude || null,
        longitude || null,
        status,
        created_at,
        updated_at,
        published_at,
      ]
    );

    // If images array is provided, insert each image record
    if (images && Array.isArray(images)) {
      for (const img of images) {
        const imageId = uuidv4();
        await pool.query(
          `INSERT INTO property_images (id, property_listing_id, image_url, alt_text, display_order, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [imageId, id, img.image_url, img.alt_text || null, img.display_order || 0, new Date().toISOString()]
        );
      }
    }

    // Insert an audit log for creation
    const auditId = uuidv4();
    await pool.query(
      `INSERT INTO listing_audits (id, property_listing_id, action, change_details, performed_by, performed_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        auditId,
        id,
        "created",
        JSON.stringify({ fields_changed: Object.keys(req.body) }),
        req.user.id,
        new Date().toISOString(),
      ]
    );

    // Return the newly created listing (for brevity, reusing the GET by id endpoint logic)
    const newListingResult = await pool.query(`SELECT * FROM property_listings WHERE id = $1`, [id]);
    const newListing = newListingResult.rows[0];
    return res.json(newListing);
  } catch (error) {
    console.error("Error in POST /api/properties:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/*
  API Endpoint: PUT /api/properties/:id
  Allows an authenticated agent to update an existing listing.
  Checks that the listing belongs to the agent before updating.
*/
app.put("/api/properties/:id", authenticateToken, requireRole("agent"), async (req, res) => {
  try {
    const { id } = req.params;
    // First, verify if the listing belongs to the authenticated agent
    const listingResult = await pool.query(`SELECT * FROM property_listings WHERE id = $1`, [id]);
    const listing = listingResult.rows[0];
    if (!listing) {
      return res.status(404).json({ error: "Property listing not found" });
    }
    if (listing.agent_id !== req.user.id) {
      return res.status(403).json({ error: "You are not authorized to update this listing" });
    }

    const {
      title,
      description,
      property_type,
      price,
      address,
      city,
      zip_code,
      amenities,
      bedrooms,
      bathrooms,
      area,
      latitude,
      longitude,
      images, // New images array (if provided, we will replace existing images)
    } = req.body;

    // Update fields if provided, otherwise keep existing values
    const updatedListing = {
      title: title || listing.title,
      description: description || listing.description,
      property_type: property_type || listing.property_type,
      price: price || listing.price,
      address: address || listing.address,
      city: city || listing.city,
      zip_code: zip_code || listing.zip_code,
      amenities: amenities ? JSON.stringify(amenities) : listing.amenities,
      bedrooms: bedrooms || listing.bedrooms,
      bathrooms: bathrooms || listing.bathrooms,
      area: area || listing.area,
      latitude: latitude || listing.latitude,
      longitude: longitude || listing.longitude,
    };
    const updated_at = new Date().toISOString();

    await pool.query(
      `UPDATE property_listings
       SET title = $1, description = $2, property_type = $3, price = $4,
           address = $5, city = $6, zip_code = $7, amenities = $8, bedrooms = $9,
           bathrooms = $10, area = $11, latitude = $12, longitude = $13, updated_at = $14
       WHERE id = $15`,
      [
        updatedListing.title,
        updatedListing.description,
        updatedListing.property_type,
        updatedListing.price,
        updatedListing.address,
        updatedListing.city,
        updatedListing.zip_code,
        updatedListing.amenities,
        updatedListing.bedrooms,
        updatedListing.bathrooms,
        updatedListing.area,
        updatedListing.latitude,
        updatedListing.longitude,
        updated_at,
        id,
      ]
    );

    // If images are provided, delete existing images and insert new ones
    if (images && Array.isArray(images)) {
      await pool.query(`DELETE FROM property_images WHERE property_listing_id = $1`, [id]);
      for (const img of images) {
        const imageId = uuidv4();
        await pool.query(
          `INSERT INTO property_images (id, property_listing_id, image_url, alt_text, display_order, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [imageId, id, img.image_url, img.alt_text || null, img.display_order || 0, new Date().toISOString()]
        );
      }
    }

    // Insert an audit log for the update
    const auditId = uuidv4();
    await pool.query(
      `INSERT INTO listing_audits (id, property_listing_id, action, change_details, performed_by, performed_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        auditId,
        id,
        "updated",
        JSON.stringify({ fields_changed: Object.keys(req.body) }),
        req.user.id,
        new Date().toISOString(),
      ]
    );

    // Return the updated listing
    const updatedListingResult = await pool.query(`SELECT * FROM property_listings WHERE id = $1`, [id]);
    return res.json(updatedListingResult.rows[0]);
  } catch (error) {
    console.error("Error in PUT /api/properties/:id:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/*
  API Endpoint: DELETE /api/properties/:id
  Allows an authenticated agent to perform a soft delete on their listing by updating its status to 'deleted'.
*/
app.delete("/api/properties/:id", authenticateToken, requireRole("agent"), async (req, res) => {
  try {
    const { id } = req.params;
    // Verify listing ownership
    const listingResult = await pool.query(`SELECT * FROM property_listings WHERE id = $1`, [id]);
    const listing = listingResult.rows[0];
    if (!listing) {
      return res.status(404).json({ error: "Property listing not found" });
    }
    if (listing.agent_id !== req.user.id) {
      return res.status(403).json({ error: "You are not authorized to delete this listing" });
    }
    const updated_at = new Date().toISOString();
    await pool.query(
      `UPDATE property_listings SET status = $1, updated_at = $2 WHERE id = $3`,
      ["deleted", updated_at, id]
    );
    // Insert an audit log for deletion
    const auditId = uuidv4();
    await pool.query(
      `INSERT INTO listing_audits (id, property_listing_id, action, change_details, performed_by, performed_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        auditId,
        id,
        "deleted",
        JSON.stringify({}),
        req.user.id,
        new Date().toISOString(),
      ]
    );
    return res.json({ message: "Property listing deleted successfully." });
  } catch (error) {
    console.error("Error in DELETE /api/properties/:id:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/*
  API Endpoint: POST /api/inquiries
  Allows any user (logged in or guest) to submit an inquiry for a property listing.
*/
app.post("/api/inquiries", async (req, res) => {
  try {
    const { property_listing_id, sender_name, sender_email, sender_phone, message } = req.body;
    if (!property_listing_id || !sender_name || !sender_email || !message) {
      return res.status(400).json({ error: "Missing required inquiry fields" });
    }
    const id = uuidv4();
    const created_at = new Date().toISOString();
    await pool.query(
      `INSERT INTO inquiries (id, property_listing_id, sender_name, sender_email, sender_phone, message, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, property_listing_id, sender_name, sender_email, sender_phone || null, message, false, created_at]
    );
    // Return the submitted inquiry record
    const inquiryResult = await pool.query(`SELECT * FROM inquiries WHERE id = $1`, [id]);
    return res.json(inquiryResult.rows[0]);
  } catch (error) {
    console.error("Error in POST /api/inquiries:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/*
  API Endpoint: GET /api/favorites
  Retrieves favorite property listings for the authenticated property seeker.
*/
app.get("/api/favorites", authenticateToken, async (req, res) => {
  try {
    // Assuming only property seekers add favorites
    const result = await pool.query(`SELECT * FROM favorites WHERE user_id = $1`, [req.user.id]);
    return res.json(result.rows);
  } catch (error) {
    console.error("Error in GET /api/favorites:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/*
  API Endpoint: POST /api/favorites
  Adds a property listing to the authenticated property seeker's favorites.
*/
app.post("/api/favorites", authenticateToken, async (req, res) => {
  try {
    const { property_listing_id } = req.body;
    if (!property_listing_id) {
      return res.status(400).json({ error: "property_listing_id is required" });
    }
    const id = uuidv4();
    const created_at = new Date().toISOString();
    await pool.query(
      `INSERT INTO favorites (id, user_id, property_listing_id, created_at)
       VALUES ($1, $2, $3, $4)`,
      [id, req.user.id, property_listing_id, created_at]
    );
    const favResult = await pool.query(`SELECT * FROM favorites WHERE id = $1`, [id]);
    return res.json(favResult.rows[0]);
  } catch (error) {
    console.error("Error in POST /api/favorites:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/*
  API Endpoint: DELETE /api/favorites/:id
  Removes a favorite listing for the authenticated property seeker.
*/
app.delete("/api/favorites/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    // Verify that the favorite belongs to the authenticated user
    const favResult = await pool.query(`SELECT * FROM favorites WHERE id = $1`, [id]);
    const favorite = favResult.rows[0];
    if (!favorite) {
      return res.status(404).json({ error: "Favorite not found" });
    }
    if (favorite.user_id !== req.user.id) {
      return res.status(403).json({ error: "You are not authorized to remove this favorite" });
    }
    await pool.query(`DELETE FROM favorites WHERE id = $1`, [id]);
    return res.json({ message: "Favorite removed successfully." });
  } catch (error) {
    console.error("Error in DELETE /api/favorites/:id:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/*
  API Endpoint: GET /api/agent/inquiries
  Retrieves inquiries related to the authenticated agent's property listings.
*/
app.get("/api/agent/inquiries", authenticateToken, requireRole("agent"), async (req, res) => {
  try {
    const query = `
      SELECT i.* FROM inquiries i
      INNER JOIN property_listings pl ON i.property_listing_id = pl.id
      WHERE pl.agent_id = $1
      ORDER BY i.created_at DESC
    `;
    const result = await pool.query(query, [req.user.id]);
    return res.json(result.rows);
  } catch (error) {
    console.error("Error in GET /api/agent/inquiries:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/*
  API Endpoint: GET /api/admin/users
  Retrieves all user accounts (Admin only).
*/
app.get("/api/admin/users", authenticateToken, requireRole("admin"), async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM users`);
    return res.json(result.rows);
  } catch (error) {
    console.error("Error in GET /api/admin/users:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/*
  API Endpoint: GET /api/admin/listings
  Retrieves all property listings for moderation (Admin only).
*/
app.get("/api/admin/listings", authenticateToken, requireRole("admin"), async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM property_listings`);
    return res.json(result.rows);
  } catch (error) {
    console.error("Error in GET /api/admin/listings:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ESM workaround for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Catch-all route for Single Page Application routing
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start the server
app.listen(PORT, () => {
  console.log(`EstateFinder backend server is running on port ${PORT}`);
});