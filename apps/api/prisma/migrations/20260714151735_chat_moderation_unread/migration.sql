-- AlterTable
ALTER TABLE "ChatMessage" ADD COLUMN     "hiddenForUser" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ChatThread" ADD COLUMN     "adminLastReadAt" TIMESTAMP(3),
ADD COLUMN     "hiddenForUser" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "userLastReadAt" TIMESTAMP(3);
