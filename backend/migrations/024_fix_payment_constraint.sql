-- 024_fix_payment_constraint.sql

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
