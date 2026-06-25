(() => {
    const statusEl = document.getElementById("prequiz-status");
    const startBtn = document.getElementById("start-btn");
    const timeLimitControl = document.getElementById("time-limit-control");
    const selectedQuizId = sessionStorage.getItem("selectedQuizId");
    let playableQuiz = null;
    let selectedTimeLimit = 0;

    function escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = str || "";
        return div.innerHTML;
    }

    function setStatus(message, isReady) {
        statusEl.innerHTML = message;
        startBtn.disabled = !isReady;
    }

    // Time limit selector
    if (timeLimitControl) {
        timeLimitControl.addEventListener("click", (e) => {
            const btn = e.target.closest(".segment");
            if (!btn) return;
            selectedTimeLimit = Number(btn.dataset.seconds);
            timeLimitControl.querySelectorAll(".segment").forEach((b) => {
                b.classList.toggle("is-active", b === btn);
            });
        });
    }

    async function loadCommunityQuiz(id) {
        setStatus("Chargement du quiz de la communauté...", false);

        try {
            const response = await fetch(`/api/community/quizzes/${encodeURIComponent(id)}`, {
                credentials: "include",
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Impossible de charger ce quiz.");
            }

            playableQuiz = data;
            const n = playableQuiz.questions.length;
            setStatus(
                `Prêt à jouer : <strong>${escapeHtml(playableQuiz.title)}</strong> - ${n} question${n > 1 ? "s" : ""}.`,
                true
            );
        } catch (error) {
            sessionStorage.removeItem("selectedQuizId");
            setStatus(`${escapeHtml(error.message)} Retournez dans la communauté pour choisir un autre quiz.`, false);
        }
    }

    function loadDraftQuiz() {
        const quiz = QuizStore.getDraftQuiz();
        const hasQuiz = quiz && Array.isArray(quiz.questions) && quiz.questions.length > 0;

        if (!hasQuiz) {
            setStatus("Vous n'avez pas encore de quiz prêt. Créez-en un ou choisissez un quiz dans la communauté.", false);
            return;
        }

        playableQuiz = quiz;
        const n = quiz.questions.length;
        setStatus(
            `Prêt à jouer : <strong>${escapeHtml(quiz.title)}</strong> - ${n} question${n > 1 ? "s" : ""}.`,
            true
        );
    }

    startBtn.addEventListener("click", () => {
        if (!playableQuiz || !playableQuiz.questions || playableQuiz.questions.length === 0) return;
        const quizWithOptions = { ...playableQuiz, timeLimitPerQuestion: selectedTimeLimit };
        QuizStore.startSession(quizWithOptions);
        window.location.href = "quiz.html";
    });

    if (selectedQuizId) {
        loadCommunityQuiz(selectedQuizId);
    } else {
        loadDraftQuiz();
    }
})();
