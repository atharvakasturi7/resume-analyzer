const express = require('express');
const app = express();
const port = 3000

const {globalLogger} = require('./middleware/loggerMiddleware')
app.use(globalLogger);

const userRoutes = require('./route/resumeRoutes')
app.use('/', userRoutes);

app.set("view engine", "ejs")
app.get('/', (req, res) => {
  res.send('Hello World!')
})



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})




