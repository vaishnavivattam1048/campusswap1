/* ==========================================
   CAMPUSSWAP — FRONTEND INTERACTIONS
   Theme | Listings | Search | Wishlist | Demo accounts
========================================== */

"use strict";

const API_URL = "https://campusswap1.onrender.com";
let supabaseItems = [];

// ---------- STORAGE HELPERS ----------

const STORAGE = {
    theme: "campusSwapTheme",
    items: "campusSwapItems",
    requests: "campusSwapRequests",
    wishlist: "campusSwapWishlist",
    accounts: "campusSwapDemoAccounts",
    session: "campusSwapDemoSession"
};

function readStorage(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : JSON.parse(value);
    } catch (error) {
        return fallback;
    }
}

function writeStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        return false;
    }
}

function makeId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---------- THEME SWITCHER ----------

const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

function applyTheme(theme) {
    const selectedTheme = theme === "dark" ? "dark" : "light";

    document.documentElement.dataset.theme = selectedTheme;

    if (themeIcon) {
        themeIcon.textContent = selectedTheme === "dark" ? "☀" : "☾";
    }

    if (themeToggle) {
        const nextTheme = selectedTheme === "dark" ? "light" : "dark";

        themeToggle.setAttribute(
            "aria-label",
            "Switch to " + nextTheme + " mode"
        );

        themeToggle.title = "Switch to " + nextTheme + " mode";
    }

    const themeColor = document.querySelector('meta[name="theme-color"]');

    if (themeColor) {
        themeColor.content =
            selectedTheme === "dark" ? "#151b17" : "#f5f7f1";
    }

    writeStorage(STORAGE.theme, selectedTheme);
}

const savedTheme = readStorage(STORAGE.theme, "light");
applyTheme(savedTheme);

if (themeToggle) {
    themeToggle.addEventListener("click", function () {
        const currentTheme =
            document.documentElement.dataset.theme || "light";

        applyTheme(currentTheme === "light" ? "dark" : "light");
    });
}

// ---------- PRODUCT PHOTOS ----------

const categoryPhotos = {
    Books: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=850&q=85",
    Electronics: "https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&w=850&q=80",
    Stationery: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=850&q=80",
    Accessories: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=850&q=80",
    Other: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=850&q=80"
};

function getPhoto(category) {
    return categoryPhotos[category] || categoryPhotos.Other;
}

// ---------- DEMO LISTINGS ----------


const sampleItems = [
    {
        id: "sample-calculator",
        name: "Scientific Calculator",
        category: "Electronics",
        type: "Sell",
        price: 350,
        condition: "Like new",
        description: "A handy scientific calculator for classes, labs and exams.",
        image: categoryPhotos.Electronics,
        owner: "CampusSwap",
        sample: true
    },
    {
        id: "sample-backpack",
        name: "Everyday Campus Backpack",
        category: "Accessories",
        type: "Swap",
        price: 0,
        condition: "Good",
        description: "A practical backpack. Open to swapping for another useful item.",
        image: categoryPhotos.Accessories,
        owner: "CampusSwap",
        sample: true
    },
    {
        id: "sample-notes",
        name: "Notebook Set",
        category: "Stationery",
        type: "Free",
        price: 0,
        condition: "Good",
        description: "Extra notebooks available for a student who needs them.",
        image: categoryPhotos.Stationery,
        owner: "CampusSwap",
        sample: true
    },
    {
        id: "sample-study",
        name: "Study Desk Organiser",
        category: "Other",
        type: "Free",
        price: 0,
        condition: "Good",
        description: "A simple organiser to keep your study space tidy.",
        image: categoryPhotos.Other,
        owner: "CampusSwap",
        sample: true
    }
];

function getCustomItems() {
    const items = readStorage(STORAGE.items, []);
    return Array.isArray(items) ? items : [];
}


function getAllItems() {
    const combinedItems = [
        ...supabaseItems,
        ...getCustomItems(),
        ...sampleItems
    ];

    const uniqueItems = new Map();

    combinedItems.forEach(function (item) {
        if (String(item.category || "").toLowerCase() === "clothing") {
            return;
        }

        const key = [
            String(item.name || "").trim().toLowerCase(),
            String(item.category || "").trim().toLowerCase()
        ].join("|");

        if (!uniqueItems.has(key)) {
            uniqueItems.set(key, item);
        }
    });

    return Array.from(uniqueItems.values());
}

async function loadDatabaseItems() {
    try {
        const response = await fetch(`${API_URL}/items`);

        if (!response.ok) {
            throw new Error("Could not load listings");
        }

        const data = await response.json();

        supabaseItems = data.map(function (item) {
            return {
                ...item,
                image: item.image_url || getPhoto(item.category),
                owner: item.seller || "CampusSwap",
                sample: false
            };
        });

        renderItems();
    } catch (error) {
        console.error("Database loading error:", error);
    }
}

function getRequests() {
    const requests = readStorage(STORAGE.requests, []);
    return Array.isArray(requests) ? requests : [];
}

function getWishlist() {
    const wishlist = readStorage(STORAGE.wishlist, []);
    return Array.isArray(wishlist) ? wishlist : [];
}

// ---------- CREATE SAFE HTML ELEMENTS ----------

function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text !== undefined && text !== null) {
        element.textContent = String(text);
    }

    return element;
}

function formatPrice(item) {
    if (item.type === "Free") return "Free";
    if (item.type === "Swap") return "Swap";

    return "₹" + Number(item.price || 0).toLocaleString("en-IN");
}

function createItemCard(item) {
    const card = createElement("article", "item-card");
    const photoWrap = createElement("div", "item-photo-wrap");

    const image = createElement("img", "item-photo");

    image.src = item.image || getPhoto(item.category);
    image.alt = item.name || "Campus item";
    image.loading = "lazy";

    image.onerror = function () {
        this.onerror = null;
        this.src = getPhoto(item.category);
    };

    const badge = createElement(
        "span",
        "item-badge",
        item.type === "Free" ? "FREE ITEM" :
        item.type === "Swap" ? "SWAP" : "FOR SALE"
    );

    const wishlistButton = createElement(
        "button",
        "wishlist-button",
        getWishlist().includes(item.id) ? "♥" : "♡"
    );

    wishlistButton.type = "button";

    wishlistButton.setAttribute(
        "aria-label",
        getWishlist().includes(item.id)
            ? "Remove from wishlist"
            : "Add to wishlist"
    );

    if (getWishlist().includes(item.id)) {
        wishlistButton.classList.add("is-saved");
    }

    wishlistButton.addEventListener("click", function () {
        toggleWishlist(item.id);
    });

    photoWrap.append(image, badge, wishlistButton);

    const info = createElement("div", "item-info");
    const meta = createElement("div", "item-meta");

    meta.append(
        createElement("span", "item-category", item.category),
        createElement("span", "item-condition", item.condition || "Used")
    );

    const title = createElement("h3", "", item.name);

    const description = createElement(
        "p",
        "item-description",
        item.description || "A useful item for the campus community."
    );

    const footer = createElement("div", "item-footer");
    const price = createElement("strong", "item-price", formatPrice(item));

    const interestButton = createElement(
        "button",
        "interest-button",
        "I'm Interested"
    );

    interestButton.type = "button";
    interestButton.addEventListener("click", function () {
        expressInterest(item);
    });

    footer.append(price, interestButton);
    info.append(meta, title, description, footer);
    card.append(photoWrap, info);

    return card;
}

function renderItems() {
    const container =
        document.getElementById("itemsGrid") ||
        document.getElementById("itemsContainer") ||
        document.getElementById("browseGrid");

    if (!container) return;

    const searchInput = document.getElementById("searchInput");
    const categoryFilter = document.getElementById("categoryFilter");
    const typeFilter = document.getElementById("typeFilter");

    const searchTerm = searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";

    const selectedCategory = categoryFilter
        ? categoryFilter.value
        : "All Categories";

    const selectedType = typeFilter
        ? typeFilter.value
        : "All Types";

    const filteredItems = getAllItems().filter(function (item) {
        const matchesSearch =
            !searchTerm ||
            String(item.name || "").toLowerCase().includes(searchTerm) ||
            String(item.description || "").toLowerCase().includes(searchTerm) ||
            String(item.category || "").toLowerCase().includes(searchTerm);

        const matchesCategory =
            !selectedCategory ||
            selectedCategory === "All Categories" ||
            selectedCategory === "all" ||
            item.category === selectedCategory;

        const matchesType =
            !selectedType ||
            selectedType === "All Types" ||
            selectedType === "all" ||
            item.type === selectedType;

        return matchesSearch && matchesCategory && matchesType;
    });

    container.replaceChildren();

    if (filteredItems.length === 0) {
        const emptyMessage = createElement(
            "p",
            "empty-state",
            "No items found. Try another search or category."
        );

        container.appendChild(emptyMessage);
        return;
    }

    filteredItems.forEach(function (item) {
        container.appendChild(createItemCard(item));
    });
}
// ---------- WISHLIST ----------

function toggleWishlist(itemId) {
    let wishlist = getWishlist();

    if (wishlist.includes(itemId)) {
        wishlist = wishlist.filter(function (id) {
            return id !== itemId;
        });

        showMessage("Removed from your wishlist.", "success");
    } else {
        wishlist.push(itemId);
        showMessage("Added to your wishlist!", "success");
    }

    writeStorage(STORAGE.wishlist, wishlist);
    renderItems();
    updateDashboard();
    renderWishlist();
}

function renderWishlist() {
    const container =
        document.getElementById("wishlistItems") ||
        document.getElementById("wishlistGrid");

    if (!container) return;

    container.replaceChildren();

    const savedIds = getWishlist();
    const savedItems = getAllItems().filter(function (item) {
        return savedIds.includes(item.id);
    });

    if (savedItems.length === 0) {
        container.appendChild(
            createElement(
                "p",
                "empty-state",
                "Your wishlist is empty. Save items you like!"
            )
        );
        return;
    }

    savedItems.forEach(function (item) {
        container.appendChild(createItemCard(item));
    });
}

// ---------- INTEREST REQUESTS ----------

function getCurrentSession() {
    return readStorage(STORAGE.session, null);
}

function expressInterest(item) {
    const session = getCurrentSession();

    if (!session || !session.email) {
        showMessage("Please log in before expressing interest.", "error");
        showAuthSection("login");
        return;
    }

    const requests = getRequests();

    const alreadyRequested = requests.some(function (request) {
        return String(request.itemId) === String(item.id) &&
            request.requesterEmail === session.email;
    });

    if (alreadyRequested) {
        showMessage("You have already expressed interest in this item.", "info");
        return;
    }

    const request = {
        id: makeId(),
        itemId: item.id,
        itemName: item.name,
        requesterName: session.name || session.user_metadata?.name || "Student",
        requesterEmail: session.email,
        seller: item.seller || item.owner || "CampusSwap",
        status: "Pending",
        createdAt: new Date().toISOString()
    };

    requests.push(request);
    writeStorage(STORAGE.requests, requests);

    showMessage("Interest recorded successfully!", "success");
    updateDashboard();
    renderRequests();
}

function renderRequests() {
    const container =
        document.getElementById("requestsList") ||
        document.getElementById("interestRequests");

    if (!container) return;

    container.replaceChildren();

    const session = getCurrentSession();

    if (!session) {
        container.appendChild(
            createElement("p", "empty-state", "Log in to view your requests.")
        );
        return;
    }

    const requests = getRequests().filter(function (request) {
        return request.requesterEmail === session.email ||
            request.seller === session.email ||
            request.seller === session.name;
    });

    if (requests.length === 0) {
        container.appendChild(
            createElement("p", "empty-state", "No interest requests yet.")
        );
        return;
    }

    requests.forEach(function (request) {
        const card = createElement("div", "request-card");

        card.append(
            createElement("h3", "", request.itemName),
            createElement("p", "", "Status: " + (request.status || "Pending")),
            createElement(
                "p",
                "",
                "Requested by: " + (request.requesterName || "Student")
            ),
            createElement(
                "p",
                "",
                "Email: " + (request.requesterEmail || "")
            )
        );

        container.appendChild(card);
    });
}

// ---------- ADD A LISTING ----------

function addItem(event) {
    if (event) event.preventDefault();

    const session = getCurrentSession();

    if (!session) {
        showMessage("Please log in before adding a listing.", "error");
        showAuthSection("login");
        return;
    }

    const nameField =
        document.getElementById("itemName") ||
        document.getElementById("listingName");

    const categoryField =
        document.getElementById("itemCategory") ||
        document.getElementById("listingCategory");

    const typeField =
        document.getElementById("itemType") ||
        document.getElementById("listingType");

    const priceField =
        document.getElementById("itemPrice") ||
        document.getElementById("listingPrice");

    const conditionField =
        document.getElementById("itemCondition") ||
        document.getElementById("listingCondition");

    const descriptionField =
        document.getElementById("itemDescription") ||
        document.getElementById("listingDescription");

    const imageField =
        document.getElementById("itemImage") ||
        document.getElementById("listingImage");

    if (!nameField || !categoryField || !typeField) {
        showMessage("Listing form fields could not be found.", "error");
        return;
    }

    const name = nameField.value.trim();
    const category = categoryField.value;
    const type = typeField.value;
    const price = Number(priceField?.value || 0);
    const condition = conditionField?.value || "Good";
    const description = descriptionField?.value.trim() || "";

    if (!name) {
        showMessage("Please enter the item name.", "error");
        nameField.focus();
        return;
    }

    if (type === "Sell" && price <= 0) {
        showMessage("Please enter a valid selling price.", "error");
        priceField?.focus();
        return;
    }

    const imageFile = imageField?.files?.[0];

    if (imageFile && imageFile.size > 2 * 1024 * 1024) {
        showMessage("Please choose an image smaller than 2 MB.", "error");
        return;
    }

    function saveListing(imageUrl) {
        const listing = {
            id: makeId(),
            name: name,
            category: category,
            type: type,
            price: type === "Sell" ? price : 0,
            condition: condition,
            description: description,
            image: imageUrl || getPhoto(category),
            owner: session.name || session.email,
            seller: session.email,
            createdAt: new Date().toISOString()
        };

        fetch(`${API_URL}/items`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: listing.name,
                category: listing.category,
                type: listing.type,
                price: listing.price,
                condition: listing.condition,
                description: listing.description,
                image_url: listing.image,
                seller: listing.seller
            })
        })
        .then(async function (response) {
            const data = await response.json().catch(function () {
                return {};
            });

            if (!response.ok) {
                throw new Error(data.error || "Could not save listing.");
            }

            showMessage("Your listing has been added!", "success");

            if (event?.target?.reset) {
                event.target.reset();
            }

            loadDatabaseItems();
            updateDashboard();
        })
        .catch(function (error) {
            console.error("Listing save error:", error);

            const localItems = getCustomItems();
            localItems.unshift(listing);
            writeStorage(STORAGE.items, localItems);

            showMessage(
                "Could not reach the database. Listing saved in this browser only.",
                "error"
            );

            renderItems();
            updateDashboard();
        });
    }

    if (imageFile) {
        const reader = new FileReader();

        reader.onload = function () {
            saveListing(reader.result);
        };

        reader.onerror = function () {
            showMessage("Could not read the selected image.", "error");
        };

        reader.readAsDataURL(imageFile);
    } else {
        saveListing(getPhoto(category));
    }
}

// ---------- MESSAGE DISPLAY ----------

function showMessage(message, type) {
    const messageBox =
        document.getElementById("globalMessage") ||
        document.getElementById("toastMessage") ||
        document.getElementById("registerMessage") ||
        document.getElementById("loginMessage");

    if (messageBox) {
        messageBox.textContent = message;
        messageBox.className = "message " + (type || "info");
        messageBox.style.display = "block";
    } else {
        alert(message);
    }
}

// ---------- AUTH SECTION NAVIGATION ----------

function showAuthSection(section) {
    const target = section === "register" ? "registerSection" : "loginSection";

    const targetElement = document.getElementById(target);

    if (targetElement) {
        targetElement.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}

// ---------- DASHBOARD ----------

function updateDashboard() {
    const session = getCurrentSession();

    const userItems = getAllItems().filter(function (item) {
        return session &&
            (item.seller === session.email || item.owner === session.name);
    });

    const userRequests = getRequests().filter(function (request) {
        return session && request.requesterEmail === session.email;
    });

    const userWishlist = getWishlist();

    const listingCount = document.getElementById("listingCount");
    const requestCount = document.getElementById("requestCount");
    const wishlistCount = document.getElementById("wishlistCount");

    if (listingCount) listingCount.textContent = userItems.length;
    if (requestCount) requestCount.textContent = userRequests.length;
    if (wishlistCount) wishlistCount.textContent = userWishlist.length;
}

// ---------- END OF PART 2 ----------

// Continue with Part 3 after this section.
// ---------- REGISTRATION WITH SUPABASE ----------

const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const name = document.getElementById("registerName")?.value.trim();
        const email = document.getElementById("registerEmail")?.value.trim();
        const college = document.getElementById("registerCollege")?.value.trim();
        const branch = document.getElementById("registerBranch")?.value.trim();
        const password = document.getElementById("registerPassword")?.value;
        const role = (
            document.getElementById("accountType")?.value || "student"
        ).toLowerCase();

        const message = document.getElementById("registerMessage");

        if (!name || !email || !password || !college) {
            showMessage("Please fill in all required fields.", "error");
            return;
        }

        if (password.length < 6) {
            showMessage("Password must contain at least 6 characters.", "error");
            return;
        }

        if (message) {
            message.textContent = "Creating your account...";
        }

        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    password: password,
                    college_name: college,
                    branch: role === "student" ? branch : "",
                    department: role === "faculty" ? branch : "",
                    role: role
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.error || result.message || "Registration failed."
                );
            }

            if (message) {
                message.textContent =
                    "Account created successfully! Please log in.";
            }

            showMessage("Registration successful! Please log in.", "success");
            registerForm.reset();
            showAuthSection("login");

        } catch (error) {
            console.error("Registration error:", error);
            showMessage(error.message || "Could not register.", "error");
        }
    });
}

// ---------- LOGIN WITH SUPABASE ----------

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document.getElementById("loginEmail")?.value.trim();
        const password = document.getElementById("loginPassword")?.value;
        const message = document.getElementById("loginMessage");

        if (!email || !password) {
            showMessage("Please enter your email and password.", "error");
            return;
        }

        if (message) {
            message.textContent = "Logging in...";
        }

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.error || result.message || "Login failed."
                );
            }

            const user = result.user || {};
            const metadata = user.user_metadata || {};

            const session = {
                id: user.id,
                email: user.email || email,
                name: metadata.name || email.split("@")[0],
                role: metadata.role || "student",
                college_name: metadata.college_name || "",
                branch: metadata.branch || "",
                department: metadata.department || "",
                access_token: result.session?.access_token || "",
                refresh_token: result.session?.refresh_token || ""
            };

            writeStorage(STORAGE.session, session);

            if (message) {
                message.textContent = "Login successful!";
            }

            loginForm.reset();
            updateDashboard();
            renderItems();
            renderWishlist();
            renderRequests();

            showMessage("Welcome to CampusSwap, " + session.name + "!", "success");

            const dashboard = document.getElementById("dashboardSection");

            if (dashboard) {
                dashboard.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }

            updateAuthUI();

        } catch (error) {
            console.error("Login error:", error);
            showMessage(error.message || "Could not log in.", "error");
        }
    });
}

// ---------- UPDATE LOGIN STATE ON PAGE ----------

function updateAuthUI() {
    const session = getCurrentSession();

    const loginLinks = document.querySelectorAll(".login-link");
    const registerLinks = document.querySelectorAll(".register-link");
    const logoutButton = document.getElementById("logoutButton");

    loginLinks.forEach(function (element) {
        element.style.display = session ? "none" : "";
    });

    registerLinks.forEach(function (element) {
        element.style.display = session ? "none" : "";
    });

    if (logoutButton) {
        logoutButton.style.display = session ? "" : "none";
    }

    const userName = document.getElementById("dashboardUserName");

    if (userName) {
        userName.textContent = session
            ? session.name || session.email
            : "Welcome to CampusSwap";
    }

    const userEmail = document.getElementById("dashboardUserEmail");

    if (userEmail) {
        userEmail.textContent = session ? session.email : "";
    }

    updateDashboard();
}

// ---------- LOGOUT ----------

const logoutButton = document.getElementById("logoutButton");

if (logoutButton) {
    logoutButton.addEventListener("click", function () {
        localStorage.removeItem(STORAGE.session);

        showMessage("You have logged out successfully.", "success");

        updateAuthUI();
        renderItems();
        renderWishlist();
        renderRequests();
    });
}

// ---------- SEARCH AND FILTER EVENTS ----------

[
    "searchInput",
    "categoryFilter",
    "typeFilter"
].forEach(function (id) {
    const element = document.getElementById(id);

    if (element) {
        element.addEventListener(
            id === "searchInput" ? "input" : "change",
            renderItems
        );
    }
});

// ---------- LISTING FORM EVENT ----------

const listingForm =
    document.getElementById("addItemForm") ||
    document.getElementById("listingForm");

if (listingForm) {
    listingForm.addEventListener("submit", addItem);
}

// ---------- NAVIGATION LINKS ----------

document.querySelectorAll("[data-show-auth]").forEach(function (element) {
    element.addEventListener("click", function (event) {
        event.preventDefault();
        showAuthSection(element.dataset.showAuth);
    });
});

// ---------- INITIALIZE WEBSITE ----------

document.addEventListener("DOMContentLoaded", function () {
    renderItems();
    renderWishlist();
    renderRequests();
    updateDashboard();
    updateAuthUI();
    loadDatabaseItems();
});

// Also initialize immediately if this script loads after DOMContentLoaded.
if (document.readyState !== "loading") {
    renderItems();
    renderWishlist();
    renderRequests();
    updateDashboard();
    updateAuthUI();
    loadDatabaseItems();
}
// ==========================================
// SUPABASE SYNC — WISHLIST & INTEREST REQUESTS
// ==========================================

// Load wishlist from Supabase after login
async function syncWishlistFromDatabase() {
    const session = getCurrentSession();
    if (!session?.email) return;

    try {
        const response = await fetch(
            `${API_URL}/wishlist?user_email=${encodeURIComponent(session.email)}`
        );

        if (!response.ok) throw new Error("Wishlist sync failed.");

        const rows = await response.json();
        const databaseIds = rows.map(row => Number(row.item_id));

        const localIds = getWishlist().filter(id => !Number.isInteger(Number(id)));
        writeStorage(STORAGE.wishlist, [...new Set([...localIds, ...databaseIds])]);

        renderItems();
        renderWishlist();
        updateDashboard();
    } catch (error) {
        console.error("Wishlist sync error:", error);
    }
}

// Override existing wishlist handler
async function toggleWishlist(itemId) {
    const session = getCurrentSession();

    if (!session?.email) {
        showMessage("Please log in to use your wishlist.", "error");
        showAuthSection("login");
        return;
    }

    const wishlist = getWishlist();
    const alreadySaved = wishlist.some(id => String(id) === String(itemId));
    const numericId = Number(itemId);
    const isDatabaseItem =
        Number.isInteger(numericId) && numericId > 0 &&
        supabaseItems.some(item => String(item.id) === String(itemId));

    if (alreadySaved) {
        writeStorage(
            STORAGE.wishlist,
            wishlist.filter(id => String(id) !== String(itemId))
        );

        if (isDatabaseItem) {
            try {
                const response = await fetch(`${API_URL}/wishlist`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        user_email: session.email,
                        item_id: numericId
                    })
                });

                if (!response.ok) {
                    throw new Error("Could not remove wishlist item from database.");
                }
            } catch (error) {
                console.error(error);
                showMessage("Removed locally, but database sync failed.", "error");
            }
        }

        showMessage("Removed from your wishlist.", "success");
    } else {
        writeStorage(STORAGE.wishlist, [...wishlist, itemId]);

        if (isDatabaseItem) {
            const item = supabaseItems.find(
                entry => String(entry.id) === String(itemId)
            );

            try {
                const response = await fetch(`${API_URL}/wishlist`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        user_email: session.email,
                        item_id: numericId,
                        item_name: item?.name || "Campus item"
                    })
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || "Wishlist save failed.");
                }

                showMessage("Saved to your Supabase wishlist!", "success");
            } catch (error) {
                console.error(error);
                showMessage("Saved in this browser, but database sync failed.", "error");
            }
        } else {
            showMessage("Added to your wishlist!", "success");
        }
    }

    renderItems();
    renderWishlist();
    updateDashboard();
}

// Load interest requests from Supabase
async function syncRequestsFromDatabase() {
    const session = getCurrentSession();
    if (!session?.email) return;

    try {
        const response = await fetch(
            `${API_URL}/interest-requests?requester_email=${encodeURIComponent(session.email)}`
        );

        if (!response.ok) throw new Error("Request sync failed.");

        const rows = await response.json();

        const databaseRequests = rows.map(row => ({
            id: "db-" + row.id,
            itemId: row.item_id,
            itemName: row.item_name,
            requesterName: row.requester_name,
            requesterEmail: row.requester_email,
            seller: row.seller,
            status: row.status,
            createdAt: row.created_at
        }));

        const localRequests = getRequests().filter(
            request => !String(request.id).startsWith("db-")
        );

        const merged = [
            ...databaseRequests,
            ...localRequests.filter(local =>
                !databaseRequests.some(db =>
                    String(db.itemId) === String(local.itemId) &&
                    db.requesterEmail === local.requesterEmail
                )
            )
        ];

        writeStorage(STORAGE.requests, merged);
        renderRequests();
        updateDashboard();
    } catch (error) {
        console.error("Interest request sync error:", error);
    }
}

// ==========================================
// SUPABASE SYNC — WISHLIST & INTEREST REQUESTS
// ==========================================

// Load wishlist from Supabase after login
async function syncWishlistFromDatabase() {
    const session = getCurrentSession();
    if (!session?.email) return;

    try {
        const response = await fetch(
            `${API_URL}/wishlist?user_email=${encodeURIComponent(session.email)}`
        );

        if (!response.ok) throw new Error("Wishlist sync failed.");

        const rows = await response.json();
        const databaseIds = rows.map(row => Number(row.item_id));

        const localIds = getWishlist().filter(id => !Number.isInteger(Number(id)));
        writeStorage(STORAGE.wishlist, [...new Set([...localIds, ...databaseIds])]);

        renderItems();
        renderWishlist();
        updateDashboard();
    } catch (error) {
        console.error("Wishlist sync error:", error);
    }
}

// Override existing wishlist handler
async function toggleWishlist(itemId) {
    const session = getCurrentSession();

    if (!session?.email) {
        showMessage("Please log in to use your wishlist.", "error");
        showAuthSection("login");
        return;
    }

    const wishlist = getWishlist();
    const alreadySaved = wishlist.some(id => String(id) === String(itemId));
    const numericId = Number(itemId);
    const isDatabaseItem =
        Number.isInteger(numericId) && numericId > 0 &&
        supabaseItems.some(item => String(item.id) === String(itemId));

    if (alreadySaved) {
        writeStorage(
            STORAGE.wishlist,
            wishlist.filter(id => String(id) !== String(itemId))
        );

        if (isDatabaseItem) {
            try {
                const response = await fetch(`${API_URL}/wishlist`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        user_email: session.email,
                        item_id: numericId
                    })
                });

                if (!response.ok) {
                    throw new Error("Could not remove wishlist item from database.");
                }
            } catch (error) {
                console.error(error);
                showMessage("Removed locally, but database sync failed.", "error");
            }
        }

        showMessage("Removed from your wishlist.", "success");
    } else {
        writeStorage(STORAGE.wishlist, [...wishlist, itemId]);

        if (isDatabaseItem) {
            const item = supabaseItems.find(
                entry => String(entry.id) === String(itemId)
            );

            try {
                const response = await fetch(`${API_URL}/wishlist`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        user_email: session.email,
                        item_id: numericId,
                        item_name: item?.name || "Campus item"
                    })
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || "Wishlist save failed.");
                }

                showMessage("Saved to your Supabase wishlist!", "success");
            } catch (error) {
                console.error(error);
                showMessage("Saved in this browser, but database sync failed.", "error");
            }
        } else {
            showMessage("Added to your wishlist!", "success");
        }
    }

    renderItems();
    renderWishlist();
    updateDashboard();
}

// Load interest requests from Supabase
async function syncRequestsFromDatabase() {
    const session = getCurrentSession();
    if (!session?.email) return;

    try {
        const response = await fetch(
            `${API_URL}/interest-requests?requester_email=${encodeURIComponent(session.email)}`
        );

        if (!response.ok) throw new Error("Request sync failed.");

        const rows = await response.json();

        const databaseRequests = rows.map(row => ({
            id: "db-" + row.id,
            itemId: row.item_id,
            itemName: row.item_name,
            requesterName: row.requester_name,
            requesterEmail: row.requester_email,
            seller: row.seller,
            status: row.status,
            createdAt: row.created_at
        }));

        const localRequests = getRequests().filter(
            request => !String(request.id).startsWith("db-")
        );

        const merged = [
            ...databaseRequests,
            ...localRequests.filter(local =>
                !databaseRequests.some(db =>
                    String(db.itemId) === String(local.itemId) &&
                    db.requesterEmail === local.requesterEmail
                )
            )
        ];

        writeStorage(STORAGE.requests, merged);
        renderRequests();
        updateDashboard();
    } catch (error) {
        console.error("Interest request sync error:", error);
    }
}

// Override existing interest handler
async function expressInterest(item) {
    const session = getCurrentSession();

    if (!session?.email) {
        showMessage("Please log in before expressing interest.", "error");
        showAuthSection("login");
        return;
    }

    const requests = getRequests();

    if (requests.some(request =>
        String(request.itemId) === String(item.id) &&
        request.requesterEmail === session.email
    )) {
        showMessage("You have already expressed interest in this item.", "info");
        return;
    }

    const payload = {
        item_id: Number.isInteger(Number(item.id)) && Number(item.id) > 0
            ? Number(item.id)
            : null,
        item_name: item.name,
        requester_name: session.name || "Student",
        requester_email: session.email,
        seller: item.seller || item.owner || ""
    };

    try {
        const response = await fetch(`${API_URL}/interest-requests`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Could not save interest request.");
        }

        const saved = await response.json();

        requests.unshift({
            id: "db-" + saved.id,
            itemId: saved.item_id ?? item.id,
            itemName: saved.item_name,
            requesterName: saved.requester_name,
            requesterEmail: saved.requester_email,
            seller: saved.seller,
            status: saved.status,
            createdAt: saved.created_at
        });

        writeStorage(STORAGE.requests, requests);

        showMessage("Interest request saved to Supabase!", "success");
        renderRequests();
        updateDashboard();
    } catch (error) {
        console.error("Interest request error:", error);
        showMessage("Could not save your request to Supabase: " + error.message, "error");
    }
}

// Refresh database data when a user logs in
const originalUpdateAuthUI = updateAuthUI;

updateAuthUI = function () {
    originalUpdateAuthUI();

    if (getCurrentSession()) {
        syncWishlistFromDatabase();
        syncRequestsFromDatabase();
    }
};

// ---------- CAMPUSSWAP LOGOUT BUTTON ----------

function addLogoutButton() {
    const nav = document.querySelector("header nav") ||
                document.querySelector("nav");

    if (!nav) return;

    let logoutButton = document.getElementById("logoutButton");

    if (!logoutButton) {
        logoutButton = document.createElement("button");
        logoutButton.id = "logoutButton";
        logoutButton.type = "button";
        logoutButton.textContent = "Logout";

        logoutButton.style.cssText = `
            padding: 10px 18px;
            margin-left: 12px;
            border: 1px solid #315c49;
            border-radius: 8px;
            background: #315c49;
            color: white;
            cursor: pointer;
            font: inherit;
        `;

        logoutButton.addEventListener("click", function () {
            localStorage.removeItem(STORAGE.session);
            window.location.reload();
        });

        nav.appendChild(logoutButton);
    }

    logoutButton.style.display =
        getCurrentSession() ? "inline-block" : "none";
}

const previousAuthUI = updateAuthUI;

updateAuthUI = function () {
    previousAuthUI();
    addLogoutButton();
};

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", addLogoutButton);
} else {
    addLogoutButton();
}


/* ==========================================
   CAMPUSSWAP — FIX WISHLIST, INTEREST & LOGOUT
========================================== */

// 1. WISHLIST: reliable add and remove
async function toggleWishlist(itemId) {
    const session = getCurrentSession();

    if (!session || !session.email) {
        showMessage("Please log in to use your wishlist.", "error");
        showAuthSection("login");
        return;
    }

    let wishlist = getWishlist();
    const saved = wishlist.some(id => String(id) === String(itemId));

    if (saved) {
        wishlist = wishlist.filter(id => String(id) !== String(itemId));
    } else {
        wishlist.push(itemId);
    }

    // Update the screen immediately.
    writeStorage(STORAGE.wishlist, wishlist);
    renderItems();
    renderWishlist();
    updateDashboard();

    showMessage(
        saved ? "Removed from your wishlist." : "Added to your wishlist!",
        "success"
    );

    // Synchronize database items in the background.
    const numericId = Number(itemId);
    const isDatabaseItem =
        Number.isInteger(numericId) &&
        supabaseItems.some(item => String(item.id) === String(itemId));

    if (isDatabaseItem) {
        try {
            const response = await fetch(`${API_URL}/wishlist`, {
                method: saved ? "DELETE" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(
                    saved
                        ? {
                            user_email: session.email,
                            item_id: numericId
                        }
                        : {
                            user_email: session.email,
                            item_id: numericId,
                            item_name:
                                supabaseItems.find(
                                    item => String(item.id) === String(itemId)
                                )?.name || "Campus item"
                        }
                )
            });

            if (!response.ok) {
                const result = await response.json().catch(() => ({}));
                throw new Error(result.error || "Database update failed.");
            }
        } catch (error) {
            console.error("Wishlist database error:", error);
            showMessage(
                "Wishlist updated on this device, but database sync failed. Check the server/database error.",
                "error"
            );
        }
    }
}


// Prevent an old database sync from restoring removed wishlist items.
async function syncWishlistFromDatabase() {
    renderItems();
    renderWishlist();
    updateDashboard();
}


// 2. I'M INTERESTED: show the request immediately
async function expressInterest(item) {
    const session = getCurrentSession();

    if (!session || !session.email) {
        showMessage("Please log in before expressing interest.", "error");
        showAuthSection("login");
        return;
    }

    const requests = getRequests();

    const alreadyRequested = requests.some(request =>
        String(request.itemId) === String(item.id) &&
        request.requesterEmail === session.email
    );

    if (alreadyRequested) {
        showMessage("You have already expressed interest in this item.", "info");
        return;
    }

    const request = {
        id: makeId(),
        itemId: item.id,
        itemName: item.name,
        requesterName: session.name || "Student",
        requesterEmail: session.email,
        seller: item.seller || item.owner || "CampusSwap",
        status: "Pending",
        createdAt: new Date().toISOString()
    };

    // Save locally first so the list and count update immediately.
    requests.unshift(request);
    writeStorage(STORAGE.requests, requests);
    renderRequests();
    updateDashboard();

    showMessage("Interest recorded successfully!", "success");

    // Save to the database as well, without blocking the screen update.
    try {
        const response = await fetch(`${API_URL}/interest-requests`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                item_id:
                    Number.isInteger(Number(item.id)) && Number(item.id) > 0
                        ? Number(item.id)
                        : null,
                item_name: item.name,
                requester_name: request.requesterName,
                requester_email: session.email,
                seller: request.seller
            })
        });

        if (!response.ok) {
            const result = await response.json().catch(() => ({}));
            throw new Error(result.error || "Database save failed.");
        }

        const saved = await response.json();

        // Replace the temporary local ID with the database ID.
        const updatedRequests = getRequests().map(entry =>
            entry.id === request.id
                ? {
                    ...entry,
                    id: "db-" + saved.id,
                    status: saved.status || "Pending",
                    createdAt: saved.created_at || entry.createdAt
                }
                : entry
        );

        writeStorage(STORAGE.requests, updatedRequests);
        renderRequests();
        updateDashboard();

    } catch (error) {
        console.error("Interest database error:", error);
        showMessage(
            "Request is visible on this device, but database saving failed. Check the server/database error.",
            "error"
        );
    }
}


// Avoid replacing locally displayed requests with a failed/empty sync.
async function syncRequestsFromDatabase() {
    renderRequests();
    updateDashboard();
}


// 3. LOGOUT: create a separate button in the navigation
function setupCampusSwapLogout() {
    const nav =
        document.querySelector(".nav-actions") ||
        document.querySelector("header nav") ||
        document.querySelector("nav");

    if (!nav) return;

    let button = document.getElementById("navLogoutButton");

    if (!button) {
        button = document.createElement("button");
        button.id = "navLogoutButton";
        button.type = "button";
        button.textContent = "Logout";
        button.style.cssText =
            "display:none; padding:10px 16px; margin-left:10px;" +
            "border:1px solid #315c49; border-radius:8px;" +
            "background:#315c49; color:white; cursor:pointer; font:inherit;";

        button.addEventListener("click", function () {
            localStorage.removeItem(STORAGE.session);
            updateAuthUI();
            renderItems();
            renderWishlist();
            renderRequests();
            showMessage("You have logged out successfully.", "success");
            showAuthSection("login");
        });

        nav.appendChild(button);
    }

    button.style.display = getCurrentSession() ? "inline-block" : "none";
}


// Replace the previous auth UI updater without removing dashboard updates.
updateAuthUI = function () {
    const session = getCurrentSession();

    document.querySelectorAll(".login-link, .register-link").forEach(element => {
        element.style.display = session ? "none" : "";
    });

    const oldLogout = document.getElementById("logoutButton");
    if (oldLogout) oldLogout.style.display = "none";

    const userName = document.getElementById("dashboardUserName");
    if (userName) {
        userName.textContent = session
            ? (session.name || session.email)
            : "Welcome to CampusSwap";
    }

    const userEmail = document.getElementById("dashboardUserEmail");
    if (userEmail) userEmail.textContent = session ? session.email : "";

    setupCampusSwapLogout();
    updateDashboard();
};


// Correct the login/register scroll targets.
showAuthSection = function (section) {
    const target = section === "register" ? "registerForm" : "loginForm";
    const element =
        document.getElementById(target) ||
        document.getElementById("account");

    if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
};


// Run after the page is ready.
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
        setupCampusSwapLogout();
        updateAuthUI();
        renderItems();
        renderWishlist();
        renderRequests();
        updateDashboard();
    });
} else {
    setupCampusSwapLogout();
    updateAuthUI();
    renderItems();
    renderWishlist();
    renderRequests();
    updateDashboard();
}


/* FIX: PUBLISH LISTING FORM + REFRESH MY LISTINGS COUNT */

// Connect the actual form in index.html to the listing function.
const campusSwapItemForm = document.getElementById("itemForm");

if (campusSwapItemForm) {
    campusSwapItemForm.addEventListener("submit", function (event) {
        addItem(event);
    });
}

// Refresh the dashboard after listings finish loading from the database.
const campusSwapOriginalLoadItems = loadDatabaseItems;

loadDatabaseItems = async function () {
    await campusSwapOriginalLoadItems();
    updateDashboard();
};
