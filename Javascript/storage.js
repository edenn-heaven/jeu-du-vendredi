const QuizStore = (() => {
    const DRAFT_KEY = "lvdj_quiz_draft";
    const SESSION_KEY = "lvdj_quiz_session";

    function uid() {
        return "q_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
    }

    function nowIso() {
        return new Date().toISOString();
    }

    function validateQuizShape(quiz) {
        if (!quiz || typeof quiz !== "object") {
            return { valid: false, error: "Le fichier ne contient pas un quiz valide." };
        }
        if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
            return { valid: false, error: "Ce quiz ne contient aucune question." };
        }
        for (const q of quiz.questions) {
            if (!q.question || !Array.isArray(q.answers) || q.answers.length < 2) {
                return { valid: false, error: "Une question est mal formée (texte ou réponses manquants)." };
            }
            if (!Array.isArray(q.correctAnswers) || q.correctAnswers.length === 0) {
                return { valid: false, error: "Une question n'a aucune bonne réponse définie." };
            }
        }
        return { valid: true, error: null };
    }

    function getDraftQuiz() {
        try {
            const raw = localStorage.getItem(DRAFT_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) {
            console.error("Impossible de lire le quiz enregistré :", e);
            return null;
        }
    }

    function saveDraftQuiz(quiz) {
        try {
            localStorage.setItem(DRAFT_KEY, JSON.stringify(quiz));
            return true;
        } catch (e) {
            console.error("Impossible d'enregistrer le quiz :", e);
            return false;
        }
    }

    function clearDraftQuiz() {
        localStorage.removeItem(DRAFT_KEY);
    }

    function createEmptyQuiz(title) {
        return {
            title: title && title.trim() ? title.trim() : "Quiz du vendredi",
            createdAt: nowIso(),
            questions: [],
        };
    }

    function startSession(quiz) {
        const session = {
            sessionId: uid(),
            quiz: quiz,
            currentIndex: 0,
            userAnswers: quiz.questions.map(() => null),
            startedAt: Date.now(),
            finishedAt: null,
        };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
        return session;
    }

    function getSession() {
        try {
            const raw = sessionStorage.getItem(SESSION_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) {
            console.error("Impossible de lire la session en cours :", e);
            return null;
        }
    }

    function saveSession(session) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }

    function endSession(session) {
        session.finishedAt = Date.now();
        saveSession(session);
        return session;
    }

    function clearSession() {
        sessionStorage.removeItem(SESSION_KEY);
    }

    function sameSelection(a, b) {
        if (!Array.isArray(a) || !Array.isArray(b)) return false;
        if (a.length !== b.length) return false;
        const sa = [...a].sort();
        const sb = [...b].sort();
        return sa.every((v, i) => v === sb[i]);
    }

    function computeResults(session) {
        const { quiz, userAnswers, startedAt, finishedAt } = session;
        const details = quiz.questions.map((q, i) => {
            const given = userAnswers[i]; // tableau d'indices ou null
            const skipped = given === null;
            const correct = !skipped && sameSelection(given, q.correctAnswers);
            return {
                question: q.question,
                answers: q.answers,
                correctAnswers: q.correctAnswers,
                given: given || [],
                skipped,
                correct,
            };
        });

        const correctCount = details.filter((d) => d.correct).length;
        const skippedCount = details.filter((d) => d.skipped).length;
        const wrongCount = details.length - correctCount - skippedCount;
        const durationMs = (finishedAt || Date.now()) - startedAt;

        return {
            title: quiz.title,
            total: details.length,
            correctCount,
            wrongCount,
            skippedCount,
            scoreOn20: details.length ? Math.round((correctCount / details.length) * 20 * 10) / 10 : 0,
            percent: details.length ? Math.round((correctCount / details.length) * 100) : 0,
            durationMs,
            details,
        };
    }

    function formatDuration(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${String(seconds).padStart(2, "0")}`;
    }

    return {
        uid,
        validateQuizShape,
        getDraftQuiz,
        saveDraftQuiz,
        clearDraftQuiz,
        createEmptyQuiz,
        startSession,
        getSession,
        saveSession,
        endSession,
        clearSession,
        computeResults,
        formatDuration,
    };
})();
