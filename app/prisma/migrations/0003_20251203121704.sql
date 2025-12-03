-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Test";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "icon_image_url" TEXT,
    "profile_is_public" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "habits" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" TEXT NOT NULL,
    "habit_name" TEXT NOT NULL,
    "departure_location" TEXT NOT NULL,
    "departure_latitude" REAL NOT NULL,
    "departure_longitude" REAL NOT NULL,
    "destination_location" TEXT NOT NULL,
    "destination_latitude" REAL NOT NULL,
    "destination_longitude" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "habits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "habits_desired_times" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "habit_id" INTEGER NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    CONSTRAINT "habits_desired_times_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "habits" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" TEXT NOT NULL,
    "departure_location" TEXT NOT NULL,
    "departure_latitude" REAL NOT NULL,
    "departure_longitude" REAL NOT NULL,
    "destination_location" TEXT NOT NULL,
    "destination_latitude" REAL NOT NULL,
    "destination_longitude" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reservation_desired_times" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reservation_id" INTEGER NOT NULL,
    "start_time" DATETIME NOT NULL,
    "end_time" DATETIME NOT NULL,
    "rank" INTEGER NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    CONSTRAINT "reservation_desired_times_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ride_groups" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "initial_reservation_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'forming',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ride_groups_initial_reservation_id_fkey" FOREIGN KEY ("initial_reservation_id") REFERENCES "reservations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ride_group_participants" (
    "group_id" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,
    "reservation_id" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'participant',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("group_id", "user_id"),
    CONSTRAINT "ride_group_participants_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "ride_groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ride_group_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ride_group_participants_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "join_requests" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "requester_id" TEXT NOT NULL,
    "group_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "join_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "join_requests_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "ride_groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "blocks" (
    "blocker_id" TEXT NOT NULL,
    "blocked_id" TEXT NOT NULL,
    "ride_group_id" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("blocker_id", "blocked_id"),
    CONSTRAINT "blocks_blocker_id_fkey" FOREIGN KEY ("blocker_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "blocks_blocked_id_fkey" FOREIGN KEY ("blocked_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "blocks_ride_group_id_fkey" FOREIGN KEY ("ride_group_id") REFERENCES "ride_groups" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "habits_user_id_idx" ON "habits"("user_id");

-- CreateIndex
CREATE INDEX "habits_departure_latitude_departure_longitude_idx" ON "habits"("departure_latitude", "departure_longitude");

-- CreateIndex
CREATE INDEX "habits_destination_latitude_destination_longitude_idx" ON "habits"("destination_latitude", "destination_longitude");

-- CreateIndex
CREATE INDEX "habits_desired_times_habit_id_idx" ON "habits_desired_times"("habit_id");

-- CreateIndex
CREATE INDEX "reservations_user_id_idx" ON "reservations"("user_id");

-- CreateIndex
CREATE INDEX "reservations_status_idx" ON "reservations"("status");

-- CreateIndex
CREATE INDEX "reservations_departure_latitude_departure_longitude_idx" ON "reservations"("departure_latitude", "departure_longitude");

-- CreateIndex
CREATE INDEX "reservations_destination_latitude_destination_longitude_idx" ON "reservations"("destination_latitude", "destination_longitude");

-- CreateIndex
CREATE INDEX "reservation_desired_times_start_time_end_time_idx" ON "reservation_desired_times"("start_time", "end_time");

-- CreateIndex
CREATE INDEX "reservation_desired_times_source_idx" ON "reservation_desired_times"("source");

-- CreateIndex
CREATE UNIQUE INDEX "ride_groups_initial_reservation_id_key" ON "ride_groups"("initial_reservation_id");

-- CreateIndex
CREATE UNIQUE INDEX "ride_group_participants_reservation_id_key" ON "ride_group_participants"("reservation_id");

-- CreateIndex
CREATE INDEX "join_requests_group_id_idx" ON "join_requests"("group_id");

-- CreateIndex
CREATE INDEX "blocks_ride_group_id_idx" ON "blocks"("ride_group_id");
