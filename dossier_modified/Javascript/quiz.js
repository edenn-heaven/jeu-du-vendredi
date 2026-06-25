(() => {
    const LETTERS = ["A. ", "B. ", "C. ", "D. ", "E. ", "F. "];

    let session = QuizStore.getSession();

    if (!session || !session.quiz || !session.quiz.questions || session.quiz.questions.length === 0) {
        window.location.href = "prequiz.html";
        return;
    }

    const counterEl = document.getElementById("question-counter");
    const progressFill = document.getElementById("progress-fill");
    const questionDisplay = document.getElementById("question-text-display");
    const optionsList = document.getElementById("options-list");
    const prevBtn = document.getElementById("prev-btn");
    const nextBtn = document.getElementById("next-btn");

    const total = session.quiz.questions.length;
    const timeLimit = session.quiz.timeLimitPerQuestion || 0;
    let timerInterval = null;
    let timeLeft = 0;

    // Timer display element (created dynamically if time limit is set)
    let timerEl = null;
    if (timeLimit > 0) {
        timerEl = document.createElement("div");
        timerEl.id = "quiz-timer";
        timerEl.style.cssText = "text-align:center; font-size:1.4rem; font-weight:bold; color:#008ce9; margin-bottom:10px;";
        const quizNav = document.querySelector(".quiz-nav");
        if (quizNav) quizNav.parentNode.insertBefore(timerEl, quizNav);
    }

    function startTimer() {
        if (!timeLimit) return;
        clearInterval(timerInterval);
        timeLeft = timeLimit;
        updateTimerDisplay();
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                // Auto-advance when time runs out
                autoAdvance();
            }
        }, 1000);
    }

    function updateTimerDisplay() {
        if (!timerEl) return;
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        timerEl.textContent = mins > 0
            ? `⏱ ${mins}:${String(secs).padStart(2, "0")}`
            : `⏱ ${timeLeft}s`;
        timerEl.style.color = timeLeft <= 5 ? "#dc3545" : "#008ce9";
    }

    function autoAdvance() {
        captureCurrentAnswer();
        if (session.currentIndex < total - 1) {
            session.currentIndex += 1;
            QuizStore.saveSession(session);
            render();
        } else {
            QuizStore.endSession(session);
            window.location.href = "results.html";
        }
    }

    function render() {
        const index = session.currentIndex;
        const question = session.quiz.questions[index];
        const savedAnswer = session.userAnswers[index];

        counterEl.textContent = `QUESTION ${index + 1} / ${total}`;
        progressFill.style.width = `${((index + 1) / total) * 100}%`;
        questionDisplay.textContent = question.question;

        optionsList.innerHTML = "";
        const isMulti = question.correctAnswers.length > 1;
        question.answers.forEach((answer, i) => {
            const label = document.createElement("label");
            label.className = "option-item";

            const input = document.createElement("input");
            input.type = isMulti ? "checkbox" : "radio";
            if (!isMulti) input.name = `question-${index}`;
            input.value = String(i);
            if (savedAnswer && savedAnswer.includes(i)) {
                input.checked = true;
                label.classList.add("is-selected");
            }
            input.addEventListener("change", () => {
                if (!isMulti) {
                    optionsList.querySelectorAll(".option-item").forEach((el) => el.classList.remove("is-selected"));
                }
                label.classList.toggle("is-selected", input.checked);
            });

            const letter = document.createElement("span");
            letter.className = "option-letter";
            letter.textContent = LETTERS[i] || String(i + 1);

            const text = document.createElement("span");
            text.textContent = answer;

            label.appendChild(input);
            label.appendChild(letter);
            label.appendChild(text);
            optionsList.appendChild(label);
        });

        prevBtn.disabled = index === 0;
        nextBtn.textContent = index === total - 1 ? "Terminer le quiz" : "Suivant ▶";

        startTimer();
    }

    function captureCurrentAnswer() {
        const checked = Array.from(optionsList.querySelectorAll("input:checked")).map((input) =>
            Number(input.value)
        );
        session.userAnswers[session.currentIndex] = checked.length > 0 ? checked : null;
        QuizStore.saveSession(session);
    }

    prevBtn.addEventListener("click", () => {
        captureCurrentAnswer();
        session.currentIndex = Math.max(0, session.currentIndex - 1);
        QuizStore.saveSession(session);
        render();
    });

    nextBtn.addEventListener("click", () => {
        captureCurrentAnswer();
        if (session.currentIndex < total - 1) {
            session.currentIndex += 1;
            QuizStore.saveSession(session);
            render();
        } else {
            clearInterval(timerInterval);
            QuizStore.endSession(session);
            window.location.href = "results.html";
        }
    });

    render();
})();
