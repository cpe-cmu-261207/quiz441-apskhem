import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sequelize } from "./configs/sequelize"
import { body, query, validationResult } from "express-validator";
import { UserDB } from "./models/user";

dotenv.config();
const app = express();

app.use(bodyParser.json());
app.use(cors());

const PORT = process.env.PORT || 3000;
const SECRET = process.env.SECRET as string;

interface JWTPayload {
    username: string;
    password: string;
}

// route: @post[/login]
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    const user_encap = await UserDB.findOne({ where: { username } });

    if (!user_encap) {
        return res.status(400).json({ message: "Invalid username or password" });
    }
    
    const user_res = user_encap.get();

    if (!user_res || !bcrypt.compareSync(password, user_res.password)) {
        return res.status(400).json({ message: "Invalid username or password" });
    }
    else {
        // Use username and password to create token.
        const obj = { username, password } as JWTPayload;
        const token = jwt.sign(obj, SECRET);

        return res.json({ message: "Login successfully", token });
    }
});

// route: @post[/register]
app.post("/register", async (req, res) => {
    try {
        req.body.password = bcrypt.hashSync(req.body.password, 10);
        req.body.balance = 0;

        await UserDB.create(req.body);
        
        return res.json({ message: "Register successfully" });
    }
    catch (e) {
        return res.status(400).json({ message: "Username is already in used" });
    }
});

// route: @get[/balance]
app.get("/balance", async (req, res) => {
    const token = req.query.token as string;

    try {
        const { username } = jwt.verify(token, SECRET) as JWTPayload;

        const user_encap = await UserDB.findOne({ where: { username } });
        
        // if the user does not exist
        if (!user_encap) {
            throw new Error();
        }

        const { firstname, lastname, balance } = user_encap.get();
        const name = `${firstname} ${lastname}`;

        return res.json({ name, balance });
    }
    catch (e) {
        return res.status(401).json({ message: "Invalid token" });
    }
})

// route: @post[/deposit]
app.post("/deposit", body("amount").isInt({ min: 1 }), async (req, res) => {
    const amount = req.body.amount;
    const token = req.query?.token as string;
    const { username } = jwt.verify(token, SECRET) as JWTPayload;

    // Is amount <= 0 ?
    if (!validationResult(req).isEmpty()) {
        return res.status(400).json({ message: "Invalid data" });
    }
    else {
        try {
            const user_encap = await UserDB.findOne({ where: { username } });
        
            // if the user does not exist
            if (!user_encap) {
                throw new Error();
            }
    
            user_encap.increment("balance", { by: amount });

            const { balance } = user_encap.get();
    
            return res.json({ message: "Deposit successfully", balance: amount + balance });
        }
        catch (e) {
            return res.status(400).json({ message: "Invalid token" });
        }
    }
})

// route: @post[/withdraw]
app.post("/withdraw", async (req, res) => {
    const amount = req.body.amount;
    const token = req.query?.token as string;
    const { username } = jwt.verify(token, SECRET) as JWTPayload;

    try {
        const user_encap = await UserDB.findOne({ where: { username } });        
    
        // if the user does not exist
        if (!user_encap) {
            throw new Error();
        }

        const { balance } = user_encap.get();

        if (balance >= amount) {
            user_encap.decrement("balance", { by: amount });

            return res.json({ message: "Withdraw successfully", balance: balance - amount });
        }
        else {
            return res.status(400).json({ message: "Invalid data" });
        }
    }
    catch (e) {
        return res.status(401).json({ message: "Invalid token" });
    }
});

// route: @delete[/reset]
app.delete("/reset", (req, res) => {
    UserDB.destroy({ where: {}, truncate: true });

    return res.json({ message: "Reset database successfully" });
});

// route: @get[/me]
app.get("/me", (req, res) => {
    return res.json({
        firstname: "Apisit",
        lastname : "Ritreungroj",
        code : 620610820,
        gpa : 4.00
    });
});

// route: @get[/demo]
app.get("/demo", (req, res) => {
    return res.json({ message: "This message is returned from demo route." });
});

// server initialization
app.listen(PORT, async () => {
    await sequelize.sync()
    console.log(`Server is running at ${PORT}`)
})