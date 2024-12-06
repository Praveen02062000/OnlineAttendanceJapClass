const express = require('express');
const StudentRouter = express.Router();
const DbConnection = require("../Database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const files = require("fs");
const DB = DbConnection();
const ExcelCovert = require('xlsx');








let salt = bcrypt.genSaltSync(8);


function Idgen(pre) {
    const hashcode = bcrypt.hashSync("praveen kumar there", salt);
    return pre + hashcode;
}


function ExcelCovertMethod(data) {
    try {
        const workbook = ExcelCovert.utils.book_new();

        const workSheet = ExcelCovert.utils.json_to_sheet(data);

        ExcelCovert.utils.book_append_sheet(workbook, workSheet, 'sheet1');

        ExcelCovert.writeFile(workbook, './ExcelFile/Studentdata.xlsx');
    }
    catch (err) {
        console.log(err);
    }

}


StudentRouter.get("/student/data/download/:batch_id", (req, res) => {
    try {
        let { batch_id } = req.params;
        // console.log(batch_id)
        let sqlquery = `select * from AttendanceTable where batch_id = "${batch_id}"`;
        DB.all(sqlquery, [], (err, row) => {
            if (err) {
                console.log(err.message)
                res.send({ "status": "Error" });
            } else {
                console.log(row)
                res.send({ "status": "success", "data": row });
            }
        })
    }
    catch (err) {
        console.log(err.message)
        res.send({ "status": "Error" });
    }
})



StudentRouter.post('/student/attendance/update', (req, res) => {
    try {
        const data = req.body;
        let flag = false;
        if (data.length > 0) {
            for (const x of data) {
                let sql = `update AttendanceTable set action_attend = "${x.action_attend}" where attendance_id = "${x.attendance_id}"`;
                DB.run(sql, (err) => {
                    if (err) {
                        console.log(err);
                        flag = true;
                    } else {
                        console.log("updated")
                    }
                });


                if (flag) {
                    break;
                }

            }
        }

        if (!flag) {
            res.send({ status: "Updated" })
        }
        res.send({ status: "error" })


    }
    catch (err) {
        console.log(err.message)
        res.send({ status: "error" })
    }
})

StudentRouter.post('/student/feeUpdate', (req, res) => {
    try {
        const { id, action } = req.body;
        let sql = `update Student set feepayment = ${action} where id = "${id}"`;
        DB.run(sql, (err) => {
            if (err) {
                console.log(err.message);

            } else {
                res.send({ "status": "update feepayment for : " + id });
            }
        })
    } catch (err) {
        console.log(err.message);
    }
})


StudentRouter.delete('/studentdelete/:id', (req, res) => {
    try {
        const { id } = req.params;
        let sql = `select * from Student where id = "${id}"`;
        // console.log(id)
        DB.all(sql, [], (err, row) => {
            if (err) {
                console.log(err.message);
            } else {
                if (row.length > 0) {
                    // console.log(row);

                    let deletesql = `delete from Student where id = "${id}"`;
                    DB.run(deletesql, (err) => {
                        if (err) {
                            console.log(err.message)
                        } else {
                            let attendsql = `select student_id from AttendanceTable where student_id = "${id}"`;
                            DB.all(attendsql, [], (err, row) => {
                                if (err) {
                                    console.log(err.message)
                                } else {
                                    if (row.length > 0) {
                                        let deleteAttendancestudent = `delete from AttendanceTable where student_id = "${id}"`;
                                        DB.run(deleteAttendancestudent, (err) => {
                                            if (err) {
                                                console.log(err.message);
                                            } else {
                                                res.send({ "status": "deleted" + id });
                                            }
                                        })
                                        // res.send({ "status": "deleted" + id });
                                    } else {
                                        res.send({ "status": "deleted" + id });
                                    }
                                }
                            })
                            // /res.send({ "status": "deleted" + id });
                        }
                    })
                }
            }
        })
    }
    catch (err) {
        console.log(err.message)
    }
})


StudentRouter.get('/getStudentbatch/:batch', (req, res) => {
    try {
        const { batch } = req.params;
        let sql = `SELECT * FROM Student WHERE batch_id = "${batch}"`;
        DB.all(sql, [], (err, row) => {
            if (err) {
                res.send({ data: [], err: err.message });
            } else {
                res.send({ data: row, err: false })
            }
        })

    } catch (err) {
        res.send({ data: [], err: err.message });
    }
})


StudentRouter.get('/allstudent', (req, res) => {
    try {
        // const { token } = req.params;
        files.readFile('./Routers/privateKey.txt', 'utf-8', (err, data) => {
            if (err) {
                console.log(err.message)
            } else {
                try {
                    // const verify = jwt.verify(token, data);
                    let sql = 'SELECT * FROM Student;'
                    DB.all(sql, [], (err, rows) => {
                        if (err) {
                            res.send("No data Found").status(404);
                        } else {
                            res.send(rows);
                        }
                    })
                } catch (Err) {
                    console.log(Err.message)
                    res.send(Err.message)
                }
            }
        })
        // 

    } catch (err) {
        console.log(`Erron on student get method ${err.message}`);
    }
})

// console.log("heelo");


StudentRouter.post('/addStudent', (req, res) => {
    try {

        let sql = `INSERT INTO Student(id,batch_id,name,feepayment) VALUES`;
        const studentsData = req.body;
        if (studentsData) {
            const sqlJoin = studentsData.map((val) => `("${val.id}","${val.batch_id}","${val.name}",${val.feepayment})`).join(',');
            DB.run(sql + sqlJoin, (err) => {
                if (err) {
                    res.send({ status: String(err.message), err: true }).status(500);
                } else {
                    // console.log("Success")
                    res.send({ status: "successfully add", err: false });
                }
            })
        } else {
            res.send("data is not founded").status(300);
        }


    } catch (err) {
        console.log(err.message);
        res.send({ status: String(err.message), err: true }).status(500);
    }
})

StudentRouter.post('/setAttendance/:batch_id', (req, res) => {
    try {
        const { batch_id } = req.params;
        const data = req.body;
        if (batch_id) {
            let sql = `INSERT INTO AttendanceTable(attendance_id,student_id,batch_id,action_attend,classdate) VALUES`
            const sqlJoin = data.maindata.map((val) => `("${val.attendance_id}","${val.studentId}","${val.batch_id}","${(val.action_attend === null || !val.action_attend) ? false : true}","${val.classdate}")`).join(',');
            DB.run(sql + sqlJoin, (err) => {
                if (err) {
                    res.send({ status: String(err.message), err: true }).status(500);
                } else {
                    // console.log("Success")
                    res.send({ status: "successfully add", err: false });
                }
            })
            // console.log(sql + sqlJoin)
            // res.send(sql + sqlJoin)
        }


    } catch (err) {
        console.log(err.message)
    }
})


StudentRouter.get("/getAttendance/:batch_id", (req, res) => {
    try {
        const { batch_id } = req.params;
        let sql = `SELECT * FROM AttendanceTable WHERE batch_id = "${batch_id}"`;

        DB.all(sql, [], (err, rows) => {
            if (err) {
                res.send({ status: String(err.message), err: true, data: [] }).status(500);
            } else {
                // console.log("Success")
                // console.log(rows)
                res.send({ status: "successfully", err: false, data: rows });
            }
        })
    }

    catch (err) {
        console.log(err.message)
    }
})

StudentRouter.post('/addBatch', (req, res) => {
    try {
        let sql = `INSERT INTO Batch(batch_id,title,createdate,levelname) VALUES(?,?,?,?);`;
        const { batch_id, title, createdate, levelname } = req.body;
        DB.run(sql, [batch_id, title, createdate, levelname], (err) => {
            if (err) {
                res.send({ status: String(err.message), err: true }).status(500);

            } else {
                // console.log("Success")
                res.send({ status: "successfully add", err: false });
            }
        })
    } catch (err) {
        console.log(err.message);
        res.send({ status: String(err.message), err: true }).status(500);
    }
})

StudentRouter.delete('/deleteBatch/:id', (req, res) => {
    try {
        const { id } = req.params;
        console.log(id)
        let sqlBatch = `delete from Batch where batch_id = "${id}"`;
        DB.run(sqlBatch, (err) => {
            if (err) {
                res.send(err.message + 1)
            } else {
                let sqlStudent = `delete from Student where batch_id = "${id}"`;
                DB.run(sqlStudent, (err) => {
                    if (err) {
                        res.send(err.message + 2)
                    } else {
                        let sqlAttendance = `delete from AttendanceTable where batch_id = "${id}"`;
                        DB.run(sqlAttendance, (err) => {
                            if (err) {
                                res.send(err.message + 3)
                            } else {
                                res.send({ status: "successfully deleted " + id })
                            }
                        })
                    }
                })
            }
        })
    }
    catch (err) {
        console.log(err)
    }
})


StudentRouter.get('/AllGetBatch', (req, res) => {
    try {
        let sql = `SELECT * FROM Batch;`;
        DB.all(sql, [], (err, row) => {
            if (err) {
                console.log("error on getbatch", err.message);
                res.send("Error on Batch" + err.message).status(500)
            } else {
                res.send(row);
            }
        });
    } catch (err) {
        console.log("error on getbatch", err.message)
    }
})


StudentRouter.post('/sandhiya/login', (req, res) => {
    try {
        const { username, password } = req.body;
        console.log(username, password)
        let validateSql = `SELECT * FROM AdminAuth where username = "${username}"`;
        DB.all(validateSql, [], (err, row) => {
            if (err) {
                console.log(err.message);
                res.send({ err: err.message })
            } else {
                console.log(row)
                const resHash = bcrypt.compareSync(password, row[0].password_auth);
                if (resHash) {
                    const data = files.readFile('./Routers/privateKey.txt', 'utf-8', (err, data) => {
                        if (err) {
                            console.log(err.message)

                        } else {
                            const textdata = data;
                            const Token = jwt.sign({ foo: 'boo' }, textdata, { expiresIn: 60 * 60 });
                            const resobj = { loginToken: Token, expiresIn: 60 * 60 };
                            console.log(resobj)
                            res.send(resobj)
                        }
                    });
                } else {
                    const resobj = { "status": "failed", "err": "invalid user certinrals" }
                    res.send(resobj)
                }

            }
        })
    }
    catch (err) {
        console.log(err.message)
    }
})



StudentRouter.post('/sandhiya/createaccount', (req, res) => {
    try {
        const { username, password } = req.body;
        let sql = `SELECT username FROM AdminAuth where username = "${username}"`;
        DB.all(sql, [], (err, row) => {
            if (err) {
                const errors = `SQLITE_ERROR: no such column: ${username}`;
                if (errors === err.message) {
                    const hash = bcrypt.hashSync(password, salt);
                    let setValueSql = 'INSERT INTO AdminAuth(username,password_auth) VALUES (?,?)';
                    // console.log(hash)
                    DB.run(setValueSql, [username, hash], (err) => {
                        if (err) {
                            console.log(err.message);
                            res.send(err.message)
                        } else {
                            res.send('Account created successfully');
                        }
                    })
                } else {
                    res.send(err.message)
                }

            } else {
                if (row.length > 0) {
                    res.send({ 'status': "failed", "msg": "username is already taken" });
                } else {
                    res.send({ 'status': "failed", "msg": "username is already taken" });
                }
            }
        });


    } catch (err) {
        console.log(err.message)
    }
})



StudentRouter.post("/student/fee/:id/:action", (req, res) => {
    try {
        const { id, action } = req.params;
        if (id) {
            let sql = `update Student set feepayment = ${action === "true" ? true : false} where id = "${id}"`
            DB.run(sql, (err) => {
                if (err) {
                    res.send(err.message)
                } else {
                    console.log("done");

                    res.send("success")
                }
            })
        } else {
            res.send("not")
        }

    }
    catch (Err) {
        console.log(Err.message)
    }
})




module.exports = StudentRouter;