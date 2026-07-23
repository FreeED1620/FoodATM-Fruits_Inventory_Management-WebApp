DO $$ BEGIN
CREATE TYPE user_role AS ENUM ('EMPLOYEE','SUPERVISOR','ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE TYPE inventory_status AS ENUM ('AVAILABLE','SOLD','DISTRIBUTED','TRANSFERRED','EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE TYPE action_type AS ENUM ('SELL','DISTRIBUTE','TRANSFER','ADJUST');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 1. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    code VARCHAR(5) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Initial Categories
INSERT INTO public.categories (name, code)
VALUES 
    ('Fruit', 'F'),
    ('Vegetables', 'V'),
    ('Dry Fruits', 'D')
ON CONFLICT (code) DO NOTHING;

-- 2. FoodATM Branches Table (For Warehouse Transfer Locations)
CREATE TABLE IF NOT EXISTS public.foodatmbranches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Initial Branches
INSERT INTO public.foodatmbranches (name)
VALUES 
    ('Branch 1 (Main Cold Storage)'),
    ('Branch 2 (North Warehouse)'),
    ('Branch 3 (South Warehouse)'),
    ('Branch 4 (East Warehouse)')
ON CONFLICT (name) DO NOTHING;

-- 3. Batches Table
CREATE TABLE IF NOT EXISTS public.batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_number INT NOT NULL UNIQUE,
    arrival_time TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Inventory Items Table (Core Table)
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id VARCHAR(25) NOT NULL UNIQUE,
    fruit_name VARCHAR(100) NOT NULL,
    category_code VARCHAR(5) DEFAULT 'F' REFERENCES public.categories(code),
    quantity INT NOT NULL CHECK (quantity >= 0),
    batch_number INT NOT NULL,
    seq_number INT NOT NULL,
    received_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE NOT NULL,
    status inventory_status DEFAULT 'AVAILABLE',
    added_in_shift INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_expiry_after_received CHECK (expiry_date >= received_date)
);

CREATE INDEX IF NOT EXISTS idx_inventory_expiry_date ON public.inventory_items(expiry_date);
CREATE INDEX IF NOT EXISTS idx_inventory_batch_number ON public.inventory_items(batch_number);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON public.inventory_items(status);
CREATE INDEX IF NOT EXISTS idx_inventory_id ON public.inventory_items(inventory_id);

-- 5. Inventory Logs Table (Audit Trail for Sell, Distribute, Transfer)
CREATE TABLE IF NOT EXISTS public.inventory_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    inventory_id VARCHAR(25) NOT NULL,
    action action_type NOT NULL,
    quantity_affected INT NOT NULL,
    recipient_destination VARCHAR(200),       -- NULL for Sell/Distribute, Branch name for Transfer
    shift_number INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Triggers for Auto Inventory ID & Timestamps
CREATE OR REPLACE FUNCTION generate_inventory_id_trigger()
RETURNS TRIGGER AS $$
DECLARE
    next_seq INT;
    batch_prefix TEXT;
    cat_code TEXT;
BEGIN
    IF NEW.seq_number IS NULL OR NEW.seq_number = 0 THEN
        SELECT COALESCE(MAX(seq_number),0)+1
        INTO next_seq
        FROM public.inventory_items
        WHERE batch_number = NEW.batch_number;

        NEW.seq_number := next_seq;
    END IF;

    IF NEW.inventory_id IS NULL OR NEW.inventory_id = '' THEN
        cat_code := COALESCE(NEW.category_code,'F');
        batch_prefix := 'B' || LPAD(NEW.batch_number::TEXT,2,'0');
        NEW.inventory_id := batch_prefix || '-' || cat_code || LPAD(NEW.seq_number::TEXT,3,'0');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_inventory_id ON public.inventory_items;

CREATE TRIGGER trigger_auto_inventory_id
BEFORE INSERT ON public.inventory_items
FOR EACH ROW
EXECUTE FUNCTION generate_inventory_id_trigger();

CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_inventory_items_modtime ON public.inventory_items;

CREATE TRIGGER update_inventory_items_modtime
BEFORE UPDATE ON public.inventory_items
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
