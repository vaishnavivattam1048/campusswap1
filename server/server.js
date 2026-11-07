
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

const URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!URL || !SERVICE_KEY || !ANON_KEY) {
    throw new Error(
        "Missing Supabase environment variables. Check server/.env"
    );
}

// Server-side database client
const supabase = createClient(URL, SERVICE_KEY);

// Authentication client
const authClient = createClient(URL, ANON_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    }
});

app.get("/", (req, res) => {
    res.send("CampusSwap1 Backend is Running!");
});

// Test database connection
app.get("/test-db", async (req, res) => {
    const { data, error } = await supabase
        .from("items")
        .select("id")
        .limit(1);

    if (error) {
        return res.status(500).json({
            success: false,
            message: "Supabase connection failed",
            error: error.message
        });
    }

    res.json({
        success: true,
        message: "CampusSwap1 connected to Supabase!",
        itemsFound: data.length
    });
});

// Register a student or faculty member
app.post("/auth/register", async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            branch,
            college_name,
            department,
            role
        } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required."
            });
        }

        if (typeof password !== "string" || password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 6 characters."
            });
        }

        const userRole = role === "faculty" ? "faculty" : "student";

        const { data, error } = await authClient.auth.signUp({
            email: email.trim(),
            password,
            options: {
                data: {
                    name: name.trim(),
                    branch: branch || "",
                    college_name: college_name || "",
                    department: department || "",
                    role: userRole
                }
            }
        });

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(201).json({
            success: true,
            message: data.session
                ? "Registration successful! You can now log in."
                : "Registration successful! Check your email if verification is required.",
            user: data.user,
            session: data.session
        });
    } catch (error) {
        console.error("Registration error:", error.message);

        res.status(500).json({
            success: false,
            message: "Registration failed. Please try again."
        });
    }
});

// Log in
app.post("/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        const { data, error } =
            await authClient.auth.signInWithPassword({
                email: email.trim(),
                password
            });

        if (error) {
            return res.status(401).json({
                success: false,
                message: error.message
            });
        }

        res.json({
            success: true,
            message: "Login successful!",
            user: data.user,
            session: data.session
        });
    } catch (error) {
        console.error("Login error:", error.message);

        res.status(500).json({
            success: false,
            message: "Login failed. Please try again."
        });
    }
});

// Fetch listings
app.get("/items", async (req, res) => {
    const { data, error } = await supabase
        .from("items")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }

    res.json(data);
});

// Add a listing
app.post("/items", async (req, res) => {
    const {
        name,
        category,
        type,
        price,
        condition,
        description,
        image_url,
        seller
    } = req.body;

    if (!name || !category || !type) {
        return res.status(400).json({
            success: false,
            message: "Name, category and type are required."
        });
    }

    const { data, error } = await supabase
        .from("items")
        .insert([{
            name,
            category,
            type,
            price: price ?? 0,
            condition,
            description,
            image_url,
            seller
        }])
        .select()
        .single();

    if (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }

    res.status(201).json({
        success: true,
        message: "Item added successfully!",
        item: data
    });
});

const PORT = 5000;

app.listen(PORT, () => {
    console.log(
        `CampusSwap1 Backend running at http://localhost:${PORT}`
    );
});
// ---------- SUPABASE WISHLIST API ----------

app.get("/wishlist", async (req, res) => {
    try {
        const email = req.query.user_email;

        if (!email) {
            return res.status(400).json({ error: "User email is required." });
        }

        const { data, error } = await supabase
            .from("wishlist")
            .select("*")
            .eq("user_email", email)
            .order("created_at", { ascending: false });

        if (error) throw error;

        res.json(data || []);
    } catch (error) {
        console.error("Wishlist fetch error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post("/wishlist", async (req, res) => {
    try {
        const { user_email, item_id, item_name } = req.body;

        if (!user_email || !Number.isInteger(Number(item_id)) || !item_name) {
            return res.status(400).json({
                error: "Valid user email, item ID and item name are required."
            });
        }

        const { data, error } = await supabase
            .from("wishlist")
            .upsert(
                {
                    user_email,
                    item_id: Number(item_id),
                    item_name
                },
                { onConflict: "user_email,item_id" }
            )
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (error) {
        console.error("Wishlist save error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

app.delete("/wishlist", async (req, res) => {
    try {
        const { user_email, item_id } = req.body;

        if (!user_email || !Number.isInteger(Number(item_id))) {
            return res.status(400).json({
                error: "Valid user email and item ID are required."
            });
        }

        const { error } = await supabase
            .from("wishlist")
            .delete()
            .eq("user_email", user_email)
            .eq("item_id", Number(item_id));

        if (error) throw error;

        res.json({ success: true, message: "Removed from wishlist." });
    } catch (error) {
        console.error("Wishlist delete error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// ---------- SUPABASE INTEREST REQUEST API ----------

app.get("/interest-requests", async (req, res) => {
    try {
        const email = req.query.requester_email;

        if (!email) {
            return res.status(400).json({ error: "Requester email is required." });
        }

        const { data, error } = await supabase
            .from("interest_requests")
            .select("*")
            .eq("requester_email", email)
            .order("created_at", { ascending: false });

        if (error) throw error;

        res.json(data || []);
    } catch (error) {
        console.error("Interest request fetch error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post("/interest-requests", async (req, res) => {
    try {
        const {
            item_id,
            item_name,
            requester_name,
            requester_email,
            seller
        } = req.body;

        if (!item_name || !requester_name || !requester_email) {
            return res.status(400).json({
                error: "Item name, requester name and requester email are required."
            });
        }

        const requestData = {
            item_name,
            requester_name,
            requester_email,
            seller: seller || "",
            status: "Pending"
        };

        if (Number.isInteger(Number(item_id)) && Number(item_id) > 0) {
            requestData.item_id = Number(item_id);
        }

        const { data, error } = await supabase
            .from("interest_requests")
            .insert(requestData)
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (error) {
        console.error("Interest request save error:", error.message);
        res.status(500).json({ error: error.message });
    }
});