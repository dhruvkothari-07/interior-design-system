const express = require("express");
const { dashboardRoute } = require("./routes/dashboardRoute");
const { materialsRoute } = require("./routes/materialsRoute");
const { clientRoute } = require("./routes/clientRoute");
const app = express();

app.use(express.json());


app.get("/", (req, res) => {
    res.send("main route")
})

app.use("/dashboard", dashboardRoute)
app.use("/materials", materialsRoute)



app.listen(3000);