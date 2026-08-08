-- Add Shiprocket tracking columns to orders table

ALTER TABLE orders
ADD COLUMN shiprocket_order_id BIGINT,
ADD COLUMN shiprocket_shipment_id BIGINT,
ADD COLUMN awb_code TEXT,
ADD COLUMN courier_name TEXT,
ADD COLUMN tracking_status TEXT,
ADD COLUMN tracking_history JSONB,
ADD COLUMN tracking_last_updated TIMESTAMPTZ;
