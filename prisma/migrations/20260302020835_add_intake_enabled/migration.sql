-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Workspace" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "brandColor" TEXT NOT NULL DEFAULT '#1E3A5F',
    "secondaryColor" TEXT NOT NULL DEFAULT '#4F8FD6',
    "apiKey" TEXT NOT NULL,
    "portalEnabled" BOOLEAN NOT NULL DEFAULT false,
    "intakeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "emailFromName" TEXT,
    "emailReplyTo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Workspace" ("apiKey", "brandColor", "createdAt", "emailFromName", "emailReplyTo", "id", "logoUrl", "name", "portalEnabled", "secondaryColor", "slug", "updatedAt") SELECT "apiKey", "brandColor", "createdAt", "emailFromName", "emailReplyTo", "id", "logoUrl", "name", "portalEnabled", "secondaryColor", "slug", "updatedAt" FROM "Workspace";
DROP TABLE "Workspace";
ALTER TABLE "new_Workspace" RENAME TO "Workspace";
CREATE UNIQUE INDEX "Workspace_slug_key" ON "Workspace"("slug");
CREATE UNIQUE INDEX "Workspace_apiKey_key" ON "Workspace"("apiKey");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
