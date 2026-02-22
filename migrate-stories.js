const pool = require('./config/db');

async function migrate() {
    try {
        console.log('Starting migration...');

        // Add media_paths and media_types if they don't exist
        // Or just change media_path and media_type to store JSON
        // Actually, let's just add new columns for clarity or use existing as JSON

        // Check if table exists (it should)
        await pool.execute('DESCRIBE weaver_stories');

        // Add columns if not present
        // Note: In a real app, we'd use a migration tool. Here we use try/catch for "column already exists"
        try {
            await pool.execute('ALTER TABLE weaver_stories ADD COLUMN media_paths JSON AFTER caption');
            await pool.execute('ALTER TABLE weaver_stories ADD COLUMN media_types JSON AFTER media_paths');
            console.log('Added media_paths and media_types columns');
        } catch (err) {
            console.log('Optional columns might already exist or JSON not supported:', err.message);
        }

        console.log('Migration finished successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
