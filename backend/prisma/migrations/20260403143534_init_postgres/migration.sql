-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "active_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answers" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "session_hash" TEXT NOT NULL,
    "answer_text" TEXT NOT NULL,
    "evaluation_status" TEXT,
    "feedback" TEXT,
    "submitted_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "questions_active_date_key" ON "questions"("active_date");

-- CreateIndex
CREATE INDEX "idx_questions_active_date" ON "questions"("active_date");

-- CreateIndex
CREATE INDEX "idx_answers_session_hash" ON "answers"("session_hash");

-- CreateIndex
CREATE INDEX "idx_answers_question_id" ON "answers"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "answers_session_hash_question_id_key" ON "answers"("session_hash", "question_id");

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
