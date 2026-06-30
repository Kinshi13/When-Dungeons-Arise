/*
  Warnings:

  - You are about to drop the `GoogleAccount` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `googleEventId` on the `Reminder` table. All the data in the column will be lost.
  - You are about to drop the column `origin` on the `Reminder` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "GoogleAccount_email_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "GoogleAccount";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Reminder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dateTime" DATETIME NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'OUTRO',
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "planId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Reminder_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Reminder" ("createdAt", "dateTime", "description", "id", "notified", "planId", "title", "type", "updatedAt") SELECT "createdAt", "dateTime", "description", "id", "notified", "planId", "title", "type", "updatedAt" FROM "Reminder";
DROP TABLE "Reminder";
ALTER TABLE "new_Reminder" RENAME TO "Reminder";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
