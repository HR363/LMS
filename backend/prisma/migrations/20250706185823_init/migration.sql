BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [password] NVARCHAR(1000) NOT NULL,
    [firstName] NVARCHAR(1000) NOT NULL,
    [lastName] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [about] NVARCHAR(1000),
    [profileProgress] INT NOT NULL CONSTRAINT [User_profileProgress_df] DEFAULT 0,
    [profileImage] NVARCHAR(1000),
    [role] NVARCHAR(1000) NOT NULL CONSTRAINT [User_role_df] DEFAULT 'STUDENT',
    [isVerified] BIT NOT NULL CONSTRAINT [User_isVerified_df] DEFAULT 0,
    [resetPasswordToken] NVARCHAR(1000),
    [emailVerificationToken] NVARCHAR(1000),
    [verificationCode] NVARCHAR(1000),
    [verificationCodeExpiry] DATETIME2,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[Course] (
    [id] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000) NOT NULL,
    [objectives] NVARCHAR(1000) NOT NULL,
    [prerequisites] NVARCHAR(1000) NOT NULL,
    [categoryId] NVARCHAR(1000) NOT NULL,
    [difficulty] NVARCHAR(1000) NOT NULL,
    [instructorId] NVARCHAR(1000) NOT NULL,
    [price] FLOAT(53) NOT NULL,
    [imageUrl] NVARCHAR(1000),
    [imagePublicId] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Course_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Course_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[CourseCategory] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [CourseCategory_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [CourseCategory_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[CourseModule] (
    [id] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [order] INT NOT NULL,
    [courseId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [CourseModule_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Lesson] (
    [id] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [contentType] NVARCHAR(1000) NOT NULL,
    [contentUrl] NVARCHAR(1000),
    [contentPublicId] NVARCHAR(1000),
    [thumbnailUrl] NVARCHAR(1000),
    [thumbnailPublicId] NVARCHAR(1000),
    [fileSize] INT,
    [duration] INT,
    [order] INT NOT NULL,
    [moduleId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Lesson_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[StudentLessonCompletion] (
    [id] NVARCHAR(1000) NOT NULL,
    [studentId] NVARCHAR(1000) NOT NULL,
    [lessonId] NVARCHAR(1000) NOT NULL,
    [completedAt] DATETIME2 NOT NULL CONSTRAINT [StudentLessonCompletion_completedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [StudentLessonCompletion_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[CourseEnrollment] (
    [id] NVARCHAR(1000) NOT NULL,
    [studentId] NVARCHAR(1000) NOT NULL,
    [courseId] NVARCHAR(1000) NOT NULL,
    [enrolledAt] DATETIME2 NOT NULL CONSTRAINT [CourseEnrollment_enrolledAt_df] DEFAULT CURRENT_TIMESTAMP,
    [progress] FLOAT(53) NOT NULL CONSTRAINT [CourseEnrollment_progress_df] DEFAULT 0,
    [completed] BIT NOT NULL CONSTRAINT [CourseEnrollment_completed_df] DEFAULT 0,
    [completedAt] DATETIME2,
    [certificateUrl] NVARCHAR(1000),
    CONSTRAINT [CourseEnrollment_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[CourseReview] (
    [id] NVARCHAR(1000) NOT NULL,
    [rating] INT NOT NULL,
    [comment] NVARCHAR(1000),
    [studentId] NVARCHAR(1000) NOT NULL,
    [courseId] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [CourseReview_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [CourseReview_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Quiz] (
    [id] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [courseId] NVARCHAR(1000) NOT NULL,
    [timeLimit] INT,
    CONSTRAINT [Quiz_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[QuizQuestion] (
    [id] NVARCHAR(1000) NOT NULL,
    [text] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [quizId] NVARCHAR(1000) NOT NULL,
    [options] NVARCHAR(1000) NOT NULL,
    [correctAnswer] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [QuizQuestion_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[QuizAttempt] (
    [id] NVARCHAR(1000) NOT NULL,
    [studentId] NVARCHAR(1000) NOT NULL,
    [quizId] NVARCHAR(1000) NOT NULL,
    [score] FLOAT(53),
    [submittedAt] DATETIME2 NOT NULL CONSTRAINT [QuizAttempt_submittedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [answers] NVARCHAR(1000) NOT NULL,
    [isCompleted] BIT NOT NULL CONSTRAINT [QuizAttempt_isCompleted_df] DEFAULT 0,
    CONSTRAINT [QuizAttempt_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[CourseDiscussion] (
    [id] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [courseId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [CourseDiscussion_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[DiscussionPost] (
    [id] NVARCHAR(1000) NOT NULL,
    [content] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [discussionId] NVARCHAR(1000) NOT NULL,
    [parentPostId] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [DiscussionPost_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [DiscussionPost_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Message] (
    [id] NVARCHAR(1000) NOT NULL,
    [senderId] NVARCHAR(1000) NOT NULL,
    [receiverId] NVARCHAR(1000) NOT NULL,
    [content] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Message_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [read] BIT NOT NULL CONSTRAINT [Message_read_df] DEFAULT 0,
    CONSTRAINT [Message_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[Course] ADD CONSTRAINT [Course_categoryId_fkey] FOREIGN KEY ([categoryId]) REFERENCES [dbo].[CourseCategory]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Course] ADD CONSTRAINT [Course_instructorId_fkey] FOREIGN KEY ([instructorId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[CourseModule] ADD CONSTRAINT [CourseModule_courseId_fkey] FOREIGN KEY ([courseId]) REFERENCES [dbo].[Course]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Lesson] ADD CONSTRAINT [Lesson_moduleId_fkey] FOREIGN KEY ([moduleId]) REFERENCES [dbo].[CourseModule]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[StudentLessonCompletion] ADD CONSTRAINT [StudentLessonCompletion_studentId_fkey] FOREIGN KEY ([studentId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[StudentLessonCompletion] ADD CONSTRAINT [StudentLessonCompletion_lessonId_fkey] FOREIGN KEY ([lessonId]) REFERENCES [dbo].[Lesson]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[CourseEnrollment] ADD CONSTRAINT [CourseEnrollment_studentId_fkey] FOREIGN KEY ([studentId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[CourseEnrollment] ADD CONSTRAINT [CourseEnrollment_courseId_fkey] FOREIGN KEY ([courseId]) REFERENCES [dbo].[Course]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[CourseReview] ADD CONSTRAINT [CourseReview_studentId_fkey] FOREIGN KEY ([studentId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[CourseReview] ADD CONSTRAINT [CourseReview_courseId_fkey] FOREIGN KEY ([courseId]) REFERENCES [dbo].[Course]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Quiz] ADD CONSTRAINT [Quiz_courseId_fkey] FOREIGN KEY ([courseId]) REFERENCES [dbo].[Course]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[QuizQuestion] ADD CONSTRAINT [QuizQuestion_quizId_fkey] FOREIGN KEY ([quizId]) REFERENCES [dbo].[Quiz]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[QuizAttempt] ADD CONSTRAINT [QuizAttempt_studentId_fkey] FOREIGN KEY ([studentId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[QuizAttempt] ADD CONSTRAINT [QuizAttempt_quizId_fkey] FOREIGN KEY ([quizId]) REFERENCES [dbo].[Quiz]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[CourseDiscussion] ADD CONSTRAINT [CourseDiscussion_courseId_fkey] FOREIGN KEY ([courseId]) REFERENCES [dbo].[Course]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[DiscussionPost] ADD CONSTRAINT [DiscussionPost_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[DiscussionPost] ADD CONSTRAINT [DiscussionPost_discussionId_fkey] FOREIGN KEY ([discussionId]) REFERENCES [dbo].[CourseDiscussion]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[DiscussionPost] ADD CONSTRAINT [DiscussionPost_parentPostId_fkey] FOREIGN KEY ([parentPostId]) REFERENCES [dbo].[DiscussionPost]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Message] ADD CONSTRAINT [Message_senderId_fkey] FOREIGN KEY ([senderId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Message] ADD CONSTRAINT [Message_receiverId_fkey] FOREIGN KEY ([receiverId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
