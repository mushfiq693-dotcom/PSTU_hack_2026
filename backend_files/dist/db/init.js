"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const db_1 = require("../config/db");
async function initializeDatabase() {
    const schemaPath = path_1.default.join(__dirname, 'schema.sql');
    const schemaSql = fs_1.default.readFileSync(schemaPath, 'utf8');
    try {
        await db_1.pool.query(schemaSql);
        console.log('✅ PostgreSQL Schema initialized successfully.');
    }
    catch (err) {
        console.error('❌ Failed to initialize PostgreSQL Schema:', err);
        throw err;
    }
}
if (require.main === module || process.argv[1]?.endsWith('init.ts')) {
    initializeDatabase()
        .then(() => process.exit(0))
        .catch((err) => {
        console.error(err);
        process.exit(1);
    });
}
