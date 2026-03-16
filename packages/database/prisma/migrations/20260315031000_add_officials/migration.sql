-- CreateTable: nigerian_officials
CREATE TABLE "nigerian_officials" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(200) NOT NULL,
    "party" VARCHAR(50),
    "image_url" VARCHAR(500),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "nigerian_officials_pkey" PRIMARY KEY ("id")
);

-- CreateTable: official_positions
CREATE TABLE "official_positions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "official_id" UUID NOT NULL,
    "role" VARCHAR(50) NOT NULL,
    "jurisdiction_type" VARCHAR(20) NOT NULL,
    "jurisdiction_code" VARCHAR(30) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "official_positions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "official_positions_official_id_fkey"
        FOREIGN KEY ("official_id") REFERENCES "nigerian_officials"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "idx_positions_jurisdiction_current"
    ON "official_positions" ("jurisdiction_code", "jurisdiction_type", "is_current");
CREATE INDEX "idx_positions_official"
    ON "official_positions" ("official_id");

-- Partial unique index: only one current holder per role per jurisdiction
CREATE UNIQUE INDEX "uq_current_official_per_role"
    ON "official_positions" ("jurisdiction_type", "jurisdiction_code", "role")
    WHERE "is_current" = true;

-- ============================================================
-- Seed: 37 current state governors (as of 2026)
-- ============================================================
-- Uses a CTE to insert officials and positions in one statement.
-- All governors inaugurated 2023-05-29 unless noted.

WITH govs (name, party, state_code, start_date) AS (VALUES
    -- North Central
    ('Alia Iyorchia Ayu',     'APC', 'benue',       '2023-05-29'::date),
    ('Ahmed Usman Ododo',     'APC', 'kogi',        '2024-01-27'::date),
    ('AbdulRahman AbdulRazaq','APC', 'kwara',       '2023-05-29'::date),
    ('Abdullahi Sule',        'APC', 'nasarawa',    '2023-05-29'::date),
    ('Mohammed Umar Bago',    'APC', 'niger',       '2023-05-29'::date),
    ('Caleb Manasseh Mutfwang','PDP', 'plateau',    '2023-05-29'::date),
    ('Nyesom Wike',           'PDP', 'fct',         '2023-08-21'::date),

    -- North East
    ('Ahmadu Umaru Fintiri',  'PDP', 'adamawa',     '2023-05-29'::date),
    ('Bala Mohammed',         'PDP', 'bauchi',      '2023-05-29'::date),
    ('Babagana Umara Zulum',  'APC', 'borno',       '2023-05-29'::date),
    ('Muhammadu Inuwa Yahaya','APC', 'gombe',       '2023-05-29'::date),
    ('Agbu Kefas',            'PDP', 'taraba',      '2023-05-29'::date),
    ('Mai Mala Buni',         'APC', 'yobe',        '2023-05-29'::date),

    -- North West
    ('Umar Namadi',           'APC', 'jigawa',      '2023-05-29'::date),
    ('Uba Sani',              'APC', 'kaduna',      '2023-05-29'::date),
    ('Abba Kabir Yusuf',      'NNPP','kano',        '2023-05-29'::date),
    ('Dikko Umaru Radda',     'APC', 'katsina',     '2023-05-29'::date),
    ('Nasir Idris',           'APC', 'kebbi',       '2023-05-29'::date),
    ('Ahmad Aliyu',           'APC', 'sokoto',      '2023-05-29'::date),
    ('Dauda Lawal',           'PDP', 'zamfara',     '2023-05-29'::date),

    -- South East
    ('Alex Otti',             'LP',  'abia',        '2023-05-29'::date),
    ('Charles Soludo',        'APGA','anambra',     '2023-05-29'::date),
    ('Francis Nwifuru',       'APC', 'ebonyi',      '2023-05-29'::date),
    ('Peter Mbah',            'PDP', 'enugu',       '2023-05-29'::date),
    ('Hope Uzodimma',         'APC', 'imo',         '2023-05-29'::date),

    -- South South
    ('Umo Eno',               'PDP', 'akwa_ibom',  '2023-05-29'::date),
    ('Douye Diri',            'PDP', 'bayelsa',     '2023-05-29'::date),
    ('Bassey Otu',            'APC', 'cross_river', '2023-05-29'::date),
    ('Sheriff Oborevwori',    'PDP', 'delta',       '2023-05-29'::date),
    ('Monday Okpebholo',      'APC', 'edo',         '2024-11-12'::date),
    ('Siminalayi Fubara',     'PDP', 'rivers',      '2023-05-29'::date),

    -- South West
    ('Biodun Abayomi Oyebanji','APC','ekiti',       '2023-05-29'::date),
    ('Babajide Sanwo-Olu',    'APC', 'lagos',       '2023-05-29'::date),
    ('Dapo Abiodun',          'APC', 'ogun',        '2023-05-29'::date),
    ('Lucky Aiyedatiwa',      'APC', 'ondo',        '2023-12-21'::date),
    ('Ademola Adeleke',       'PDP', 'osun',        '2023-05-29'::date),
    ('Seyi Makinde',          'PDP', 'oyo',         '2023-05-29'::date)
),
inserted_officials AS (
    INSERT INTO "nigerian_officials" ("name", "party")
    SELECT name, party FROM govs
    RETURNING id, name
)
INSERT INTO "official_positions" ("official_id", "role", "jurisdiction_type", "jurisdiction_code", "start_date", "is_current")
SELECT io.id, 'governor', 'state', g.state_code, g.start_date, true
FROM inserted_officials io
JOIN govs g ON g.name = io.name;
