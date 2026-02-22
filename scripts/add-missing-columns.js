/**
 * Add missing columns to existing database tables
 * Run: node scripts/add-missing-columns.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function addMissingColumns() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'handloom_nexus',
            multipleStatements: true
        });

        console.log('🔧 Adding missing columns to database...\n');

        // Check and add is_approved to sarees table
        try {
            await connection.execute(`
                ALTER TABLE sarees 
                ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE
            `);
            console.log('✅ Added is_approved column to sarees table');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️  is_approved column already exists in sarees table');
            } else {
                // Try without IF NOT EXISTS (MySQL 5.7 doesn't support it)
                try {
                    await connection.execute(`
                        ALTER TABLE sarees 
                        ADD COLUMN is_approved BOOLEAN DEFAULT FALSE
                    `);
                    console.log('✅ Added is_approved column to sarees table');
                } catch (err2) {
                    if (err2.code === 'ER_DUP_FIELDNAME') {
                        console.log('ℹ️  is_approved column already exists in sarees table');
                    } else {
                        throw err2;
                    }
                }
            }
        }

        // Check and add is_approved to weaver_stories table
        try {
            await connection.execute(`
                ALTER TABLE weaver_stories 
                ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE
            `);
            console.log('✅ Added is_approved column to weaver_stories table');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️  is_approved column already exists in weaver_stories table');
            } else {
                try {
                    await connection.execute(`
                        ALTER TABLE weaver_stories 
                        ADD COLUMN is_approved BOOLEAN DEFAULT FALSE
                    `);
                    console.log('✅ Added is_approved column to weaver_stories table');
                } catch (err2) {
                    if (err2.code === 'ER_DUP_FIELDNAME') {
                        console.log('ℹ️  is_approved column already exists in weaver_stories table');
                    } else {
                        throw err2;
                    }
                }
            }
        }

        // Check and add offer_id to orders table
        try {
            await connection.execute(`
                ALTER TABLE orders 
                ADD COLUMN IF NOT EXISTS offer_id INT NULL
            `);
            console.log('✅ Added offer_id column to orders table');
            
            // Add foreign key constraint if it doesn't exist
            try {
                await connection.execute(`
                    ALTER TABLE orders 
                    ADD CONSTRAINT fk_orders_offer 
                    FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE SET NULL
                `);
                console.log('✅ Added foreign key constraint for offer_id');
            } catch (err) {
                if (err.code === 'ER_DUP_KEY_NAME' || err.code === 'ER_DUP_FK') {
                    console.log('ℹ️  Foreign key constraint already exists for offer_id');
                } else {
                    console.log('⚠️  Could not add foreign key constraint (offers table may not exist yet)');
                }
            }
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️  offer_id column already exists in orders table');
            } else {
                try {
                    await connection.execute(`
                        ALTER TABLE orders 
                        ADD COLUMN offer_id INT NULL
                    `);
                    console.log('✅ Added offer_id column to orders table');
                } catch (err2) {
                    if (err2.code === 'ER_DUP_FIELDNAME') {
                        console.log('ℹ️  offer_id column already exists in orders table');
                    } else {
                        throw err2;
                    }
                }
            }
        }

        // Add index for is_approved if it doesn't exist
        try {
            await connection.execute(`
                CREATE INDEX IF NOT EXISTS idx_is_approved ON sarees(is_approved)
            `);
            console.log('✅ Added index for is_approved on sarees table');
        } catch (err) {
            if (err.code === 'ER_DUP_KEYNAME') {
                console.log('ℹ️  Index already exists for is_approved');
            } else {
                // Try without IF NOT EXISTS
                try {
                    await connection.execute(`
                        CREATE INDEX idx_is_approved ON sarees(is_approved)
                    `);
                    console.log('✅ Added index for is_approved on sarees table');
                } catch (err2) {
                    if (err2.code === 'ER_DUP_KEYNAME') {
                        console.log('ℹ️  Index already exists for is_approved');
                    } else {
                        console.log('⚠️  Could not add index (may already exist)');
                    }
                }
            }
        }

        console.log('\n✅ Database migration complete!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

if (require.main === module) {
    addMissingColumns();
}

module.exports = { addMissingColumns };

