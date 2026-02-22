-- ============================================================
-- Demo users: update display names to final list
-- Run after schema. Passwords unchanged: Admin@123 (admin), Demo@123 (others).
-- ============================================================
-- | Role   | Name                  | Email             |
-- |--------|----------------------|-------------------|
-- | Admin  | Selvanayaki G        | admin@nexus.com   |
-- | Buyer  | Tamilarasu           | buyer1@demo.com   |
-- | Buyer  | Kavitha Nagaraj      | buyer2@demo.com   |
-- | Buyer  | Priya Mukherjee      | buyer3@demo.com   |
-- | Weaver | Karthikeyan Murugan  | weaver1@demo.com  |
-- | Weaver | Ramesh Prasad Gupta  | weaver2@demo.com  |
-- | Weaver | Lakshmi Devi Sharma  | weaver3@demo.com  |
-- ============================================================

USE handloom_nexus;

UPDATE users SET name = 'Selvanayaki G'        WHERE email = 'admin@nexus.com';
UPDATE users SET name = 'Tamilarasu'           WHERE email = 'buyer1@demo.com';
UPDATE users SET name = 'Kavitha Nagaraj'       WHERE email = 'buyer2@demo.com';
UPDATE users SET name = 'Priya Mukherjee'      WHERE email = 'buyer3@demo.com';
UPDATE users SET name = 'Karthikeyan Murugan' WHERE email = 'weaver1@demo.com';
UPDATE users SET name = 'Ramesh Prasad Gupta'  WHERE email = 'weaver2@demo.com';
UPDATE users SET name = 'Lakshmi Devi Sharma'  WHERE email = 'weaver3@demo.com';
