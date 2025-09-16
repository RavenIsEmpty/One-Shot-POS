const express = require("express");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files (e.g., index.html, styles.css, etc.)
app.use(express.static(path.join(__dirname)));

// Root route to serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Endpoint to save ticket to manifest.json
app.post("/save-ticket", async (req, res) => {
  console.log("Raw received body:", req.body, "Type:", typeof req.body); // Debug raw data and type
  try {
    const ticketData = req.body;
    if (!Array.isArray(ticketData) || ticketData.length === 0) {
      throw new Error("Invalid or empty ticket data array received");
    }

    // Validate each item
    const validData = ticketData.filter(
      (item) =>
        item &&
        typeof item === "object" &&
        item.name &&
        typeof item.name === "string" &&
        item.timestamp &&
        typeof item.timestamp === "string" &&
        item.quantity !== undefined &&
        item.quantity !== null &&
        !isNaN(item.quantity)
    );
    if (validData.length !== ticketData.length) {
      console.warn(
        "Filtered out invalid items:",
        ticketData.filter((item) => !validData.includes(item))
      );
      if (validData.length === 0) {
        throw new Error("No valid ticket items received");
      }
    }

    const manifestPath = path.join(__dirname, "manifest.json");

    // Read existing manifest.json or create empty array
    let manifestArray = [];
    try {
      const data = await fs.readFile(manifestPath, "utf8");
      manifestArray = JSON.parse(data);
      if (!Array.isArray(manifestArray)) {
        console.warn("manifest.json is not an array, resetting to empty array");
        manifestArray = [];
      }
    } catch (error) {
      if (error.code !== "ENOENT") throw error; // Ignore file not found
      console.log("manifest.json not found, creating new array");
    }

    // Append only valid data
    manifestArray.push(...validData);
    console.log(
      "Updated manifest array:",
      JSON.stringify(manifestArray, null, 2)
    );

    // Write updated array
    await fs.writeFile(
      manifestPath,
      JSON.stringify(manifestArray, null, 2),
      "utf8"
    );
    console.log("Successfully wrote to manifest.json");

    res.json({ message: "Ticket saved successfully" });
  } catch (error) {
    console.error("Error saving ticket:", error.message);
    res
      .status(400)
      .json({ error: "Failed to save ticket", details: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
