document.addEventListener("DOMContentLoaded", () => {
  const catalog = document.getElementById("catalog");
  const lines = document.getElementById("lines");
  const totalDisplay = document.getElementById("total");
  const saveBtn = document.getElementById("saveBtn");
  const exportBtn = document.getElementById("exportBtn");
  const chargeBtn = document.getElementById("chargeBtn");


  let ticketItems = [];

  // Verify DOM elements
  if (
    !catalog ||
    !lines ||
    !totalDisplay ||
    !saveBtn ||
    !exportBtn ||
    !chargeBtn 
    
  ) {
    console.error("One or more DOM elements not found:", {
      catalog,
      lines,
      totalDisplay,
      saveBtn,
      exportBtn,
      chargeBtn
    });
    return;
  }

  // Fetch and populate catalog from desserts.json
  fetch("desserts.json")
    .then((response) => {
      if (!response.ok)
        throw new Error(`Failed to load desserts.json: ${response.statusText}`);
      return response.json();
    })
    .then((data) => {
      console.log("Loaded desserts:", data);
      data.forEach((item) => {
        const card = document.createElement("div");
        card.className = `card ${item.imageClass}`;
        card.dataset.name = item.name;
        card.dataset.price = item.price;
        card.innerHTML = `<div class="label">${item.name}</div>`;
        catalog.appendChild(card);
      });
    })
    .catch((error) => {
      console.error("Error loading desserts:", error);
      catalog.innerHTML =
        '<p style="color: red;">Error loading catalog items. Check console for details.</p>';
    });

  // Add item to ticket
  catalog.addEventListener("click", (e) => {
    const card = e.target.closest(".card:not(.discount)");
    if (!card) return;

    const name = card.dataset.name;
    const price = parseFloat(card.dataset.price);
    if (isNaN(price)) {
      console.error(`Invalid price for ${name}: ${card.dataset.price}`);
      return;
    }

    const existingItem = ticketItems.find((item) => item.name === name);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      ticketItems.push({ name, price, quantity: 1 });
    }

    console.log("Ticket items:", ticketItems);
    updateTicket();
  });

  // Remove or adjust item quantity
  lines.addEventListener("click", (e) => {
    const btn = e.target.closest(".qty button, .remove");
    if (!btn) return;

    if (btn.classList.contains("remove")) {
      const line = btn.closest(".line");
      const index = parseInt(line.dataset.index);
      ticketItems.splice(index, 1);
    } else {
      const line = btn.closest(".line");
      const index = parseInt(line.dataset.index);
      const action = btn.textContent; // '+' or '-'

      if (action === "+") {
        ticketItems[index].quantity += 1;
      } else if (action === "-") {
        ticketItems[index].quantity -= 1;
        if (ticketItems[index].quantity <= 0) {
          ticketItems.splice(index, 1);
        }
      }
    }

    console.log("Updated ticket items:", ticketItems);
    updateTicket();
  });

  // Update ticket display and calculations
  function updateTicket() {
    lines.innerHTML = "";
    let subtotal = 0;

    ticketItems.forEach((item, index) => {
      const total = item.price * item.quantity;
      subtotal += total;

      const li = document.createElement("li");
      li.className = "line";
      li.dataset.index = index;
      li.innerHTML = `
                <div class="name">${item.name}</div>
                <div class="price meta">$${total.toFixed(2)}</div>
                <div class="qty">
                    <button>-</button>
                    <span>${item.quantity}</span>
                    <button>+</button>
                </div>
                <button class="remove">×</button>
            `;
      lines.appendChild(li);
    });

    console.log("Subtotal:", subtotal);
    totalDisplay.textContent = `$${subtotal.toFixed(2)}`;
  }

  // Save ticket to manifest.json via server
  saveBtn.addEventListener("click", () => {
    if (ticketItems.length === 0) {
      alert("No items to save!");
      return;
    }

    const ticketData = ticketItems.map((item) => ({
      name: item.name || "Unknown",
      timestamp: new Date().toISOString(),
      quantity: item.quantity || 0,
    }));

    console.log("Ticket items before mapping:", ticketItems);
    console.log("Ticket data to send:", JSON.stringify(ticketData, null, 2)); // Debug with stringified data

    if (
      !ticketData ||
      ticketData.length === 0 ||
      ticketData.some((item) => !item.name || item.quantity === null)
    ) {
      console.error("Invalid ticket data:", ticketData);
      alert("Failed to save: Invalid data.");
      return;
    }

    fetch("http://localhost:3000/save-ticket", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ticketData),
    })
      .then((response) => {
        console.log("Fetch response status:", response.status); // Debug response status
        if (!response.ok)
          throw new Error(`Server error: ${response.statusText}`);
        return response.json();
      })
      .then((data) => {
        console.log("Server response:", data);
        alert("Ticket saved to manifest.json!");
      })
      .catch((error) => {
        console.error("Error saving to manifest.json:", error);
        alert("Failed to save ticket. Check console for details.");
      });
  });

  // Export ticket to Excel
  exportBtn.addEventListener("click", () => {
    if (ticketItems.length === 0) {
      alert("No items to export!");
      return;
    }

    const exportData = ticketItems.map((item) => ({
      Name: item.name,
      Price: item.price,
      Quantity: item.quantity,
      Total: (item.price * item.quantity).toFixed(2),
    }));

    exportData.push({
      Name: "Total",
      Price: "",
      Quantity: "",
      Total: ticketItems
        .reduce((sum, item) => sum + item.price * item.quantity, 0)
        .toFixed(2),
    });

    console.log("Exporting to Excel:", exportData);

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ticket");

    XLSX.writeFile(wb, `ticket_${new Date().toISOString().split("T")[0]}.xlsx`);
  });

  // Charge button (placeholder for future functionality)
  chargeBtn.addEventListener("click", () => {
    alert("Processing payment...");
    ticketItems = [];
    updateTicket();
  });

  // Register service worker for PWA (optional, for offline)
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then(() => console.log("Service Worker registered"));
  }
});
