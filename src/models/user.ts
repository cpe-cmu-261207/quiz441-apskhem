import { Model, DataTypes } from "sequelize";
import { sequelize } from "../configs/sequelize";

export interface UserModel {
    username: string;
    password: string;
    firstname: string;
    lastname: string;
    balance: number;
}

export class UserDB extends Model<UserModel> { }

UserDB.init({
    username: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    firstname: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    lastname: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    balance: {
        type: DataTypes.REAL,
        allowNull: false,
    }
}, { sequelize, modelName: "user" });
