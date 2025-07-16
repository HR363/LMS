/*
  Warnings:

  - You are about to drop the column `courseId` on the `Quiz` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[lessonId]` on the table `Quiz` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `lessonId` to the `Quiz` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[Quiz] DROP CONSTRAINT [Quiz_courseId_fkey];

-- AlterTable
ALTER TABLE [dbo].[Quiz] DROP COLUMN [courseId];
ALTER TABLE [dbo].[Quiz] ADD [lessonId] NVARCHAR(1000) NOT NULL;

-- CreateIndex
ALTER TABLE [dbo].[Quiz] ADD CONSTRAINT [Quiz_lessonId_key] UNIQUE NONCLUSTERED ([lessonId]);

-- AddForeignKey
ALTER TABLE [dbo].[Quiz] ADD CONSTRAINT [Quiz_lessonId_fkey] FOREIGN KEY ([lessonId]) REFERENCES [dbo].[Lesson]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
