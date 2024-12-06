const express = require('express');
const StudentRouter = require("./Routers/Student");
const body_Parser = require("body-parser");
const cors = require("cors");



const PORT = 8000;
const App = express();


App.use(body_Parser.json());
App.use(body_Parser.urlencoded({ extended: true }));
App.use(cors())
App.use('/student', StudentRouter);




App.listen(PORT, () => {
    console.log("server is running on port number : ", PORT);
})










