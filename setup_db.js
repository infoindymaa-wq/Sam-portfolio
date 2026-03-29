const { Client } = require('pg');

// Safe connection with manual parameters to avoid symbol errors
const client = new Client({
    user: 'postgres',
    host: 'db.svsusxfshnxjozbdtchz.supabase.co',
    database: 'postgres',
    password: 'Indymaa@9508#*', // Your raw password
    port: 5432,
    ssl: { rejectUnauthorized: false } // Required for Supabase
});

async function setup() {
    try {
        console.log("Connecting to Supabase...");
        await client.connect();
        console.log("Connected!");

        // 1. Create table
        await client.query(`
            CREATE TABLE IF NOT EXISTS portfolio (
                id bigint PRIMARY KEY,
                content JSONB NOT NULL
            );
        `);
        console.log("✅ Table 'portfolio' ready.");

        // 2. Clear old data
        await client.query("DELETE FROM portfolio WHERE id = 1;");

        // 3. Insert initial data
        const initialData = {
            logo: "SAM",
            heroTag: "I am Sam",
            heroTitle: "Full Stack Developer",
            heroDesc: "Cloud-powered portfolio live!",
            heroImg: "https://i.ibb.co/d4ttY6Vp/vecteezy-3d-male-character-sitting-on-a-sofa-and-working-on-a-laptop-24785790.png",
            footer: "© 2024 Sam",
            socials: { github: "", linkedin: "", instagram: "" },
            projects: [],
            skills: []
        };

        await client.query("INSERT INTO portfolio (id, content) VALUES (1, $1);", [JSON.stringify(initialData)]);
        console.log("✅ Initial row created.");

        // 4. Disable RLS
        await client.query("ALTER TABLE portfolio DISABLE ROW LEVEL SECURITY;");
        console.log("✅ Security unlocked for Builder.");

        console.log("\n🔥 ALL DONE! Refresh builder.html and try saving.");
    } catch (err) {
        console.error("❌ Setup Error:", err.message);
    } finally {
        await client.end();
    }
}

setup();
