-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Resource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'OTHER',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "fileUrl" TEXT,
    "fileKey" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "fileType" TEXT,
    "images" TEXT NOT NULL DEFAULT '[]',
    "metadata" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'published',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "Resource_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Resource" ("authorId", "createdAt", "description", "downloads", "fileKey", "fileName", "fileSize", "fileType", "fileUrl", "id", "metadata", "status", "tags", "title", "type", "updatedAt", "views") SELECT "authorId", "createdAt", "description", "downloads", "fileKey", "fileName", "fileSize", "fileType", "fileUrl", "id", "metadata", "status", "tags", "title", "type", "updatedAt", "views" FROM "Resource";
DROP TABLE "Resource";
ALTER TABLE "new_Resource" RENAME TO "Resource";
CREATE INDEX "Resource_authorId_idx" ON "Resource"("authorId");
CREATE INDEX "Resource_type_idx" ON "Resource"("type");
CREATE INDEX "Resource_createdAt_idx" ON "Resource"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
