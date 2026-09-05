const dbcreds = require('./DbConfig');
const mysql = require('mysql2');

const con = mysql.createConnection({
    host: dbcreds.DB_HOST,
    user: dbcreds.DB_USER,
    password: dbcreds.DB_PWD,
    database: dbcreds.DB_DATABASE
});

con.query('CREATE TABLE IF NOT EXISTS students (id INT NOT NULL AUTO_INCREMENT, name VARCHAR(100) NOT NULL, salary VARCHAR(100) NOT NULL, field VARCHAR(100) NOT NULL, PRIMARY KEY(id))', function(err){
    if (err) console.error('Could not initialize students table:', err.message);
    con.query('ALTER TABLE students MODIFY COLUMN salary VARCHAR(100) NULL', function(migrationError){
        if (migrationError) console.error('Could not migrate students salary column:', migrationError.message);
        con.query('ALTER TABLE students ADD COLUMN field VARCHAR(100) NULL', function(fieldError){
            if (fieldError && fieldError.code !== 'ER_DUP_FIELDNAME') console.error('Could not add student field column:', fieldError.message);
        });
        con.query('ALTER TABLE students MODIFY COLUMN roll_no VARCHAR(50) NULL, MODIFY COLUMN class_name VARCHAR(50) NULL', function(columnError){
            if (columnError && columnError.code !== 'ER_BAD_FIELD_ERROR') console.error('Could not update old student columns:', columnError.message);
        });
    });
});

function addTransaction(amount,desc){
    var mysql = `INSERT INTO \`transactions\` (\`amount\`, \`description\`) VALUES ('${amount}','${desc}')`;
    con.query(mysql, function(err,result){
        if (err) throw err;
        console.log("Adding to the table should have worked");
    }) 
    return 200;
}

function getAllTransactions(callback){
    var mysql = "SELECT * FROM transactions";
    con.query(mysql, function(err,result){
        if (err) throw err;
        console.log("Getting all transactions...");
        return(callback(result));
    });
}

function findTransactionById(id,callback){
    var mysql = `SELECT * FROM transactions WHERE id = ${id}`;
    con.query(mysql, function(err,result){
        if (err) throw err;
        console.log(`retrieving transactions with id ${id}`);
        return(callback(result));
    }) 
}

function deleteAllTransactions(callback){
    var mysql = "DELETE FROM transactions";
    con.query(mysql, function(err,result){
        if (err) throw err;
        console.log("Deleting all transactions...");
        return(callback(result));
    }) 
}

function deleteTransactionById(id, callback){
    var mysql = `DELETE FROM transactions WHERE id = ${id}`;
    con.query(mysql, function(err,result){
        if (err) throw err;
        console.log(`Deleting transactions with id ${id}`);
        return(callback(result));
    }) 
}

function getAllStudents(callback){
    con.query('SELECT * FROM students ORDER BY id DESC', function(err, result){
        if (err) throw err;
        callback(result);
    });
}

function addStudent(student, callback){
    con.query('INSERT INTO students (name, salary, field) VALUES (?, ?, ?)', [student.name, student.salary, student.field], callback);
}

function updateStudent(id, student, callback){
    con.query('UPDATE students SET name = ?, salary = ?, field = ? WHERE id = ?', [student.name, student.salary, student.field, id], callback);
}

function deleteStudent(id, callback){
    con.query('DELETE FROM students WHERE id = ?', [id], callback);
}


module.exports = {addTransaction, getAllTransactions, deleteAllTransactions, findTransactionById, deleteTransactionById, getAllStudents, addStudent, updateStudent, deleteStudent};







