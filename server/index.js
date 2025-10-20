const express = require("express");
const { dashboardRoute } = require("./routes/dashboardRoute");
const { materialsRoute } = require("./routes/materialsRoute");
const { clientRoute } = require("./routes/clientRoute");
const authMiddleware = require("./middleware/authMiddleware");
const app = express();

app.use(express.json());


app.get("/", (req, res) => {
    res.send("main route")
})

app.use("/dashboard", authMiddleware, dashboardRoute)
app.use("/materials", authMiddleware, materialsRoute)



app.listen(3000);