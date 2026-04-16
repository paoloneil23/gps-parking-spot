const http = require("http");

const testApiCall = () => {
  // Simulate a user ID that would come from frontend
  const userId = "test_user_" + Date.now();
  
  const payload = {
    userId: userId,
    maxPrice: 50,
    onlyAvailable: true,
    freeOnly: false,
    parkingType: ["regular", "EV"],
  };

  console.log("Testing API call with userId:", userId);
  console.log("Payload:", JSON.stringify(payload, null, 2));

  const options = {
    hostname: "localhost",
    port: 5000,
    path: `/api/preferences/${userId}`,
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": JSON.stringify(payload).length,
    },
  };

  const req = http.request(options, (res) => {
    let data = "";

    console.log(`\nResponse Status: ${res.statusCode}`);
    console.log("Response Headers:", res.headers);

    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      console.log("Response Body:", data);
      
      // Now test GET to verify it was saved
      testGetPreferences(userId);
    });
  });

  req.on("error", (error) => {
    console.error("API Error:", error);
  });

  req.write(JSON.stringify(payload));
  req.end();
};

const testGetPreferences = (userId) => {
  console.log("\n--- Testing GET API ---");
  console.log("Fetching preferences for userId:", userId);

  const options = {
    hostname: "localhost",
    port: 5000,
    path: `/api/preferences/${userId}`,
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const req = http.request(options, (res) => {
    let data = "";

    console.log(`Response Status: ${res.statusCode}`);

    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      console.log("Retrieved Preferences:", data);
      process.exit(0);
    });
  });

  req.on("error", (error) => {
    console.error("API Error:", error);
  });

  req.end();
};

// Wait a bit for server to process the PUT request
setTimeout(testApiCall, 1000);
