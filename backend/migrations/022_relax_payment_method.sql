-- 022_relax_payment_method.sql

DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    SELECT tc.constraint_name INTO constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
    WHERE tc.table_name = 'orders' 
    AND tc.constraint_type = 'CHECK'
    AND cc.check_clause LIKE '%payment_method%';

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE orders DROP CONSTRAINT ' || constraint_name;
    END IF;
END $$;
