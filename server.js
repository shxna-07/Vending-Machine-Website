//import the express framework
var express = require("express");
var db = require("./db-connections");
var cors = require('cors');

//create an instance of express
var app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("./HTML and CSS"));

//get all vending machines
app.route("/api/vending-machines").get(function (req, res) {
    var sql = "SELECT vm.vending_machine_id, vm.vendor_name, l.block, l.floor FROM vending_machine vm JOIN location l ON vm.location_id = l.location_id";

    db.query(sql, function (error, result) {
        if (error) {
            throw error;
        } else {
            res.json(result);
        }
    });
});

//get all the items
app.route("/api/items").get(function (req, res) {
    var sql = "SELECT * FROM vending_machine.item";

    db.query(sql, function (error, result) {
        if (error) {
            throw error;
        } else {
            res.json(result);
        }
    });
});

//get items in a vending machines
app.route("/api/vending-machines/:id/items").get(function (req, res) {
    var id = req.params.id;
    var sql = `
    SELECT i.item_name, i.item_cost, i.item_image, i.availability, i.item_quantity
    FROM vending_item vi
    JOIN item i ON vi.item_id = i.item_id
    WHERE vi.vending_machine_id = ?
    `;

    db.query(sql, [id], function (error, result) {
        if (error) {
            throw error;
        } else {
            res.json(result);
        }
    })
});

//add a new item 
app.route("/api/items").post(function (req, res) {
    var item_name = req.body.item_name;
    var item_cost = Number(req.body.item_cost);
    var item_image = req.body.item_image;
    var availability = Number(req.body.availability);
    var item_quantity = Number(req.body.item_quantity);
    console.log(availability);
    console.log(typeof availability)

    if (isNaN(item_quantity) || item_quantity < 0 || isNaN(availability) || availability < 0 || availability > 1 || item_name.length > 100 || isNaN(item_cost) || item_cost <= 0) {
        res.status(400).json({ "error": "Incorrect inputs" });
    } else {
        console.log("Request received with data:", { item_name, item_cost, item_image, availability, item_quantity });

        //Insert into the 'item' table
        var sql1 = `
        INSERT INTO item (item_name, item_cost, item_image, availability, item_quantity)
        VALUES (?,?,?,?,?)
    `;

        db.query(sql1, [item_name, item_cost, item_image, availability, item_quantity], function (error, result) {
            if (error) {
                console.error("Error while inserting item:", error);
                res.status(401).json({ error: `Failed to add item ${error.message}` });
            } else {
                res.status(200).json({ message: "Item updated successfully!" });
            }
        });
    }
});


//update an item
app.route("/api/items/:id").put(function (req, res) {
    var id = req.params.id;
    var item_name = req.body.item_name;
    var item_cost = Number(req.body.item_cost);
    var item_image = req.body.item_image;
    var availability = Number(req.body.availability);
    var item_quantity = Number(req.body.item_quantity);

    if (isNaN(item_quantity) || item_quantity < 0 || isNaN(availability) || availability < 0 || availability > 1 || item_name.length > 100 || isNaN(item_cost) || item_cost <= 0) {
        res.status(400).json({ "error": "Incorrect inputs" });
    } else {
        var sql = `
            UPDATE item
            SET item_name = ?, item_cost = ?, item_image = ?, availability = ?, item_quantity = ?
            WHERE item_id = ?
        `;

        db.query(sql, [item_name, item_cost, item_image, availability, item_quantity, id], function (error, result) {
            if (error) {
                res.status(500).json({ error: "Failed to update the item" });
            } else {
                res.status(200).json({ message: "Item updated successfully!" });
            }
        });
    }
});

//delete an item 
app.route("/api/items/:id").delete(function (req, res) {
    var id = req.params.id;
    var sql = `
    DELETE FROM item
    WHERE item_id = ?
    `;

    db.query(sql, [id], function (error, result) {
        if (error) {
            res.status(500).json({ error: "Failed to delete item." });
        } else if (result.affectedRows === 0) {
            res.status(404).json({ error: "Invalid Item ID." });
        } else {
            res.status(200).json({ message: "Item deleted successfully!" });
        }
    });
});

// login api
app.route("/api/login").post(function (req, res) {
    const { username, password } = req.body;

    const query = 'SELECT * FROM login WHERE username = ? AND password = ?';
    db.query(query, [username, password], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (results.length > 0) {
            const role = results[0].username === 'admin' ? 'admin' : 'manager';
            res.status(200).json({ messsage: `${role} login successful!`, role: role });
        } else {
            res.status(400).json({ error: 'Invalid username or password' });
        }
    });
});

//search bar api
app.route("/api/search").get(function (req, res) {
    const { query } = req.query;
    let sql = `
        SELECT
            vm.vendor_name,
            l.school,
            l.block,
            l.floor,
            s.status_name,
            i.item_name,
            i.item_cost,
            i.availability,
            i.item_quantity,
            pm.payment_name
        FROM vending_machine vm
        JOIN location l ON vm.location_id = l.location_id
        JOIN status s ON vm.status_id = s.status_id
        JOIN vending_item vi ON vm.vending_machine_id = vi.vending_machine_id
        JOIN item i ON vi.item_id = i.item_id
        JOIN vending_payment vp ON vm.vending_machine_id = vp.vending_id
        JOIN payment_method pm ON vp.payment_id = pm.payment_id
    `;
    const queryParams = [];

    let whereClause = `WHERE l.school LIKE ? OR l.block LIKE ? OR l.floor LIKE ? OR s.status_name LIKE ? OR pm.payment_name LIKE ?
    OR vm.vendor_name LIKE ? OR i.item_name LIKE ?`;

    const searchPattern = `%${query}%`;
    queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);

    if (query && !isNaN(query)) {
        whereClause += `OR i.item_cost = ? OR i.availability = ? OR i.item_quantity = ?`;
        queryParams.push(parseFloat(query), parseFloat(query), parseFloat(query));
    }

    sql += whereClause;
    console.log(sql);
    console.log(queryParams);

    db.query(sql, queryParams, (err, results) => {
        if (err) {
            console.error("Error executing query:", err);
            return res.status(500).json({ error: "Database query failed." });
        }
        res.json(results);
    });
});

// for the overview of the vending machines
app.route("/api/overview/vending-machines").get(function (req, res) {
    var query = `
        SELECT vending_payment.payment_id, payment_method.payment_name,location.block,location.floor, vending_machine.vending_machine_id, location.school
        FROM vending_machine
        INNER JOIN vending_payment ON vending_machine.vending_machine_id = vending_payment.vending_id
        INNER JOIN payment_method ON vending_payment.payment_id = payment_method.payment_id
        INNER JOIN location ON vending_machine.location_id = location.location_id
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error("Failed to fetch data:", err);
            return;
        }
        res.json(results);
    });
});

//configure the server to listen to port 8080, IP address 127.0.0.1
app.listen(8080, "127.0.0.1", () => {
    console.log("web server running @ http://127.0.0.1:8080");
});

