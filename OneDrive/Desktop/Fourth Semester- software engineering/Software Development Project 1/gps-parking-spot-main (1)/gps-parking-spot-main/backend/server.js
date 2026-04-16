const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const ensureAdminUser = require("./utils/ensureAdminUser");

dotenv.config();

const app = express();


app.use(cors());
app.use(express.json());

app.use("/api/parking", require("./routes/parkingRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/preferences", require("./routes/preferencesRoutes"));

app.get("/", (req, res) => {
  res.send("Backend is running...");
});


const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await ensureAdminUser();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();