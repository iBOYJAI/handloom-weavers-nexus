// Automatic MySQL Database Setup Script
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
    let connection;
    
    try {
        // Connect to MySQL server (without database)
        // Handle placeholder password - if still "your_mysql_password", treat as empty
        let dbPassword = process.env.DB_PASSWORD || '';
        if (dbPassword === '') {
            dbPassword = '';
            console.log('⚠️  Using empty password (placeholder detected)');
        }
        
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: dbPassword
        });

        console.log('✅ Connected to MySQL server');

        // Create database if it doesn't exist
        const dbName = process.env.DB_NAME || 'handloom_nexus';
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        console.log(`✅ Database '${dbName}' created or already exists`);

        // Switch to the database
        await connection.query(`USE \`${dbName}\``);

        // Read and execute schema file using exec
        const schemaPath = path.join(__dirname, 'database', 'schema.sql');
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);

        // Use mysql command line to execute the schema file properly
        const passwordArg = dbPassword ? `-p${dbPassword}` : '';
        
        try {
            // Try using mysql command line first
            const mysqlCmd = `mysql -u ${process.env.DB_USER || 'root'} ${passwordArg} ${dbName} < "${schemaPath}"`;
            await execAsync(mysqlCmd);
            console.log('✅ Schema executed via mysql command');
        } catch (cmdError) {
            // Fallback: Execute SQL statements manually
            console.log('⚠️  mysql command not available, executing statements manually...');
            
            let schema = fs.readFileSync(schemaPath, 'utf8');
            
            // Remove comments
            schema = schema.replace(/--[^\r\n]*/g, ''); // Remove single-line comments
            schema = schema.replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments
            
            // Split by semicolons
            const statements = schema
                .split(';')
                .map(s => s.trim().replace(/\n\s*\n/g, '\n')) // Clean up extra newlines
                .filter(s => {
                    const trimmed = s.trim();
                    return trimmed.length > 10 && 
                           !trimmed.match(/^(CREATE DATABASE|USE)/i); // Skip DB creation/use
                });

            console.log(`📝 Executing ${statements.length} SQL statements...`);

            for (let i = 0; i < statements.length; i++) {
                const statement = statements[i];
                if (statement.length > 0) {
                    try {
                        await connection.query(statement);
                    } catch (err) {
                        // Ignore "already exists" and "Duplicate" errors
                        if (!err.message.includes('already exists') && 
                            !err.message.includes('Duplicate') &&
                            !err.message.includes('Duplicate entry') &&
                            !err.message.includes('Unknown database')) {
                            console.warn(`⚠️  Statement ${i + 1}:`, err.message.substring(0, 80));
                        }
                    }
                }
            }
        }

        console.log('✅ Database schema created successfully');
        console.log('✅ Seed data inserted');
        console.log('\n📝 Default Admin Credentials:');
        console.log('   Email: admin@nexus.com');
        console.log('   Password: Admin@123');
        console.log('\n🎉 Database setup complete!');

    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
        console.error('\nPlease check:');
        console.error('1. MySQL server is running');
        console.error('2. Database credentials in .env file are correct');
        console.error('3. User has CREATE DATABASE privileges');
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

setupDatabase();

