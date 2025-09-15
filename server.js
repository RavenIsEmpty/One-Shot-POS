const express = require("express");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const port = 3000;

// Serve static files (e.g., index.html, styles.css, etc.)
app.use(express.static(path.join(__dirname)));

// Root route to serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Endpoint to save ticket to manifest.json
app.post("/save-ticket", async (req, res) => {
  try {
    const ticketData = req.body;
    const manifestPath = path.join(__dirname, "manifest.json");

    // Read existing manifest.json or create empty array if it doesn't exist
    let manifestArray = [];
    try {
      const data = await fs.readFile(manifestPath, "utf8");
      manifestArray = JSON.parse(data);
      if (!Array.isArray(manifestArray)) {
        manifestArray = [];
      }
    } catch (error) {
      if (error.code !== "ENOENT") throw error; // Ignore file not found error
    }

    // Append new ticket data
    manifestArray.push(ticketData);

    // Write updated array back to manifest.json
    await fs.writeFile(
      manifestPath,
      JSON.stringify(manifestArray, null, 2),
      "utf8"
    );
    console.log("Saved to manifest.json:", manifestArray);

    res.json({ message: "Ticket saved successfully" });
  } catch (error) {
    console.error("Error saving ticket:", error);
    res.status(500).json({ error: "Failed to save ticket" });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
