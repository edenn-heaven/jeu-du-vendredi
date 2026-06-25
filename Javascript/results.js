(() => {
    const session = QuizStore.getSession();

    if (!session) {
        window.location.href = "prequiz.html";
        return;
    }
    if (!session.finishedAt) {
        window.location.href = "quiz.html";
        return;
    }

    const results = QuizStore.computeResults(session);

    fetch('/api/quiz/result', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
            quiz_id: session.quizId,
            score: results.percent
        })
    })
    .catch(console.error);

    document.getElementById("quiz-title-label").textContent = results.title;
    document.getElementById("score-value").textContent = `${results.correctCount}/${results.total}`;
    document.getElementById("score-sublabel").textContent =
        `Soit ${results.scoreOn20}/20 (${results.percent}%)`;

    const statsGrid = document.getElementById("stats-grid");
    const stats = [
        { label: "Bonnes réponses", value: results.correctCount },
        { label: "Mauvaises réponses", value: results.wrongCount },
        { label: "Questions passées", value: results.skippedCount },
        { label: "Temps total", value: QuizStore.formatDuration(results.durationMs) },
    ];
    stats.forEach((stat) => {
        const box = document.createElement("div");
        box.className = "stat-box";
        const value = document.createElement("div");
        value.className = "stat-value";
        value.textContent = stat.value;
        const label = document.createElement("div");
        label.className = "stat-label";
        label.textContent = stat.label;
        box.appendChild(value);
        box.appendChild(label);
        statsGrid.appendChild(box);
    });

    const resultsList = document.getElementById("results-list");
    results.details.forEach((detail, index) => {
        const row = document.createElement("div");
        row.className =
            "result-row " + (detail.skipped ? "is-skipped" : detail.correct ? "is-correct" : "is-wrong");

        const icon = document.createElement("div");
        icon.className = "icon";
        icon.textContent = detail.skipped ? "—" : detail.correct ? "✓" : "✗";

        const body = document.createElement("div");

        const question = document.createElement("div");
        question.className = "r-question";
        question.textContent = `${index + 1}. ${detail.question}`;

        const correctText = detail.correctAnswers.map((i) => detail.answers[i]).join(", ");

        const given = document.createElement("div");
        given.className = "r-answer";
        if (detail.skipped) {
            given.innerHTML = `Votre réponse : <b>aucune</b>`;
        } else {
            const givenText = detail.given.map((i) => detail.answers[i]).join(", ");
            given.innerHTML = `Votre réponse : <b>${escapeHtml(givenText)}</b>`;
        }

        body.appendChild(question);
        body.appendChild(given);

        if (!detail.correct) {
            const correct = document.createElement("div");
            correct.className = "r-answer";
            correct.innerHTML = `Bonne réponse : <b>${escapeHtml(correctText)}</b>`;
            body.appendChild(correct);
        }

        row.appendChild(icon);
        row.appendChild(body);
        resultsList.appendChild(row);
    });

    function escapeHtml(str) {
        const div = document.createElement("div");
        div.textContent = str || "";
        return div.innerHTML;
    }

    const quizId = Number(sessionStorage.getItem("selectedQuizId"));
    console.log("Quiz ID =", quizId);

    fetch('/api/quiz/result', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
            quiz_id: quizId,
            score: results.percent
        })
    })
    .then(r => r.json())
    .then(console.log)
    .catch(console.error);

})();