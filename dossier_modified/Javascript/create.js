(() => {
    const LETTERS = ["A", "B", "C", "D", "E", "F"];

    let quiz = QuizStore.getDraftQuiz() || QuizStore.createEmptyQuiz();
    let editingIndex = null;
    let questionType = "multiple";
    let answerCount = 4;

    const titleInput = document.getElementById("quiz-title");
    const answersGrid = document.getElementById("answers-grid");
    const questionText = document.getElementById("question-text");
    const formError = document.getElementById("form-error");
    const addBtn = document.getElementById("add-question-btn");
    const cancelEditBtn = document.getElementById("cancel-edit-btn");
    const counterEl = document.getElementById("question-counter");
    const editIndicator = document.getElementById("edit-indicator");
    const tbody = document.getElementById("questions-tbody");
    const emptyState = document.getElementById("empty-state");
    const table = document.getElementById("questions-table");
    const totalLabel = document.getElementById("total-questions-label");
    const startLink = document.getElementById("start-quiz-link");
    const questionTypeControl = document.getElementById("question-type");
    const answerCountControl = document.getElementById("answer-count-control");
    const answerCountField = document.getElementById("answer-count-field");
    const tagsInput = document.getElementById("quiz-tags");
    const publishBtn = document.getElementById("publish-btn");
    const publishMessage = document.getElementById("publish-message");
    const importJsonBtn = document.getElementById("import-json-btn");
    const importJsonInput = document.getElementById("import-json-input");
    const importMessage = document.getElementById("import-message");
    const showTemplateLink = document.getElementById("show-template-link");
    const jsonTemplateInfo = document.getElementById("json-template-info");

    showTemplateLink.addEventListener("click", (e) => {
        e.preventDefault();
        const visible = jsonTemplateInfo.style.display !== "none";
        jsonTemplateInfo.style.display = visible ? "none" : "block";
        showTemplateLink.textContent = visible ? "Voir le format attendu ▼" : "Masquer le format ▲";
    });

    function buildAnswersGrid() {
        answersGrid.innerHTML = "";
        const count = questionType === "truefalse" ? 2 : answerCount;
        const values = questionType === "truefalse" ? ["Vrai", "Faux"] : Array(count).fill("");

        values.forEach((value, i) => {
            const row = document.createElement("div");
            row.className = "answer-row";
            row.dataset.index = String(i);

            const letter = document.createElement("span");
            letter.className = "option-letter";
            letter.textContent = LETTERS[i];

            const input = document.createElement("input");
            input.type = "text";
            input.id = `answer-input-${i}`;
            input.placeholder = `Réponse ${i + 1}`;
            input.value = value;
            input.readOnly = questionType === "truefalse";

            const pill = document.createElement("label");
            pill.className = "check-pill";
            const checkbox = document.createElement("input");
            checkbox.type = questionType === "truefalse" ? "radio" : "checkbox";
            checkbox.id = `correct-checkbox-${i}`;
            if (questionType === "truefalse") checkbox.name = "truefalse-correct";
            checkbox.addEventListener("change", () => {
                if (questionType === "truefalse") {
                    answersGrid.querySelectorAll(".answer-row").forEach((answerRow) => {
                        answerRow.classList.remove("is-correct");
                    });
                }
                row.classList.toggle("is-correct", checkbox.checked);
            });
            pill.appendChild(checkbox);
            pill.appendChild(document.createTextNode("Bonne réponse"));

            row.appendChild(letter);
            row.appendChild(input);
            row.appendChild(pill);
            answersGrid.appendChild(row);
        });
    }

    function getAnswerInputs() {
        return Array.from(answersGrid.querySelectorAll('input[type="text"]'));
    }

    function getCheckboxes() {
        return Array.from(answersGrid.querySelectorAll('input[type="checkbox"], input[type="radio"]'));
    }

    function setQuestionType(type) {
        questionType = type;
        questionTypeControl.querySelectorAll(".segment").forEach((button) => {
            button.classList.toggle("is-active", button.dataset.type === type);
        });
        answerCountField.style.display = type === "truefalse" ? "none" : "block";
        buildAnswersGrid();
    }

    function setAnswerCount(count) {
        answerCount = count;
        answerCountControl.querySelectorAll(".segment").forEach((button) => {
            button.classList.toggle("is-active", Number(button.dataset.count) === count);
        });
        buildAnswersGrid();
    }

    function updateCounter() {
        if (editingIndex === null) {
            counterEl.textContent = `QUESTION N°${quiz.questions.length + 1}`;
            editIndicator.style.display = "none";
            addBtn.textContent = "Ajouter la question";
            cancelEditBtn.style.display = "none";
        } else {
            counterEl.textContent = `QUESTION N°${editingIndex + 1}`;
            editIndicator.style.display = "inline";
            addBtn.textContent = "Mettre à jour la question";
            cancelEditBtn.style.display = "inline-flex";
        }
    }

    function resetForm() {
        editingIndex = null;
        questionText.value = "";
        setQuestionType("multiple");
        setAnswerCount(4);
        getAnswerInputs().forEach((input) => {
            if (!input.readOnly) input.value = "";
        });
        getCheckboxes().forEach((cb) => {
            cb.checked = false;
            cb.closest(".answer-row").classList.remove("is-correct");
        });
        formError.textContent = "";
        updateCounter();
        questionText.focus();
    }

    function renderTable() {
        tbody.innerHTML = "";

        if (quiz.questions.length === 0) {
            table.style.display = "none";
            emptyState.style.display = "block";
        } else {
            table.style.display = "table";
            emptyState.style.display = "none";
        }

        quiz.questions.forEach((q, index) => {
            const tr = document.createElement("tr");

            const tdIndex = document.createElement("td");
            tdIndex.className = "q-index";
            tdIndex.textContent = String(index + 1);

            const tdQuestion = document.createElement("td");
            tdQuestion.textContent = `${q.type === "truefalse" ? "Vrai/Faux - " : ""}${q.question}`;

            const tdCorrect = document.createElement("td");
            tdCorrect.textContent = q.correctAnswers.map((i) => q.answers[i]).join(", ");

            const tdActions = document.createElement("td");
            tdActions.className = "row-actions";

            const editBtn = document.createElement("button");
            editBtn.className = "buzzer";
            editBtn.textContent = "Modifier";
            editBtn.addEventListener("click", () => editQuestion(index));

            const deleteBtn = document.createElement("button");
            deleteBtn.className = "buzzer buzzer--danger";
            deleteBtn.textContent = "Supprimer";
            deleteBtn.addEventListener("click", () => deleteQuestion(index));

            tdActions.appendChild(editBtn);
            tdActions.appendChild(deleteBtn);

            tr.appendChild(tdIndex);
            tr.appendChild(tdQuestion);
            tr.appendChild(tdCorrect);
            tr.appendChild(tdActions);
            tbody.appendChild(tr);
        });

        const n = quiz.questions.length;
        totalLabel.textContent = n === 0 ? "0 question" : n === 1 ? "1 question" : `${n} questions`;
    }

    function editQuestion(index) {
        const q = quiz.questions[index];
        editingIndex = index;
        const count = q.answers.length;
        if (q.type !== "truefalse") setAnswerCount(count);
        setQuestionType(q.type || "multiple");

        questionText.value = q.question;
        const inputs = getAnswerInputs();
        const checkboxes = getCheckboxes();
        for (let i = 0; i < inputs.length; i++) {
            inputs[i].value = q.answers[i] || "";
            const isCorrect = q.correctAnswers.includes(i);
            checkboxes[i].checked = isCorrect;
            checkboxes[i].closest(".answer-row").classList.toggle("is-correct", isCorrect);
        }
        formError.textContent = "";
        updateCounter();
        document.getElementById("question-text").scrollIntoView({ behavior: "smooth", block: "center" });
    }

    function deleteQuestion(index) {
        const confirmed = confirm("Supprimer cette question ?");
        if (!confirmed) return;

        quiz.questions.splice(index, 1);
        QuizStore.saveDraftQuiz(quiz);

        if (editingIndex === index) {
            resetForm();
        } else if (editingIndex !== null && editingIndex > index) {
            editingIndex -= 1;
        }
        renderTable();
        updateCounter();
    }

    function handleAddOrUpdate() {
        const text = questionText.value.trim();
        const inputs = getAnswerInputs();
        const checkboxes = getCheckboxes();
        const answers = inputs.map((input) => input.value.trim());
        const correctAnswers = checkboxes
            .map((cb, i) => (cb.checked ? i : null))
            .filter((i) => i !== null);

        if (!text) {
            formError.textContent = "Merci d'écrire une question.";
            return;
        }
        if (answers.some((a) => !a)) {
            formError.textContent = `Merci de remplir les ${answers.length} réponses possibles.`;
            return;
        }
        if (correctAnswers.length === 0) {
            formError.textContent = "Cochez au moins une bonne réponse.";
            return;
        }

        formError.textContent = "";

        if (editingIndex === null) {
            quiz.questions.push({
                id: QuizStore.uid(),
                type: questionType,
                question: text,
                answers,
                correctAnswers,
            });
        } else {
            quiz.questions[editingIndex] = {
                ...quiz.questions[editingIndex],
                type: questionType,
                question: text,
                answers,
                correctAnswers,
            };
        }

        QuizStore.saveDraftQuiz(quiz);
        resetForm();
        renderTable();
    }

    function getTags() {
        return tagsInput.value
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
            .filter((tag, index, tags) => tags.indexOf(tag) === index);
    }

    function buildPublishPayload() {
        return {
            name: (quiz.title || titleInput.value || "Quiz du vendredi").trim(),
            tags: getTags(),
            questions: quiz.questions.map((question) => ({
                question: question.question,
                type: question.type || "multiple",
                answers: question.answers.map((answer, index) => ({
                    text: answer,
                    is_correct: question.correctAnswers.includes(index),
                })),
            })),
        };
    }

    function setPublishMessage(message, type) {
        publishMessage.textContent = message;
        publishMessage.style.color = type === "success" ? "var(--mint)" : "var(--ember)";
    }

    function setImportMessage(message, type) {
        importMessage.textContent = message;
        importMessage.style.color = type === "success" ? "#28a745" : "red";
    }

    async function publishQuiz() {
        if (quiz.questions.length === 0) {
            setPublishMessage("Ajoutez au moins une question avant de publier le quiz.", "error");
            return;
        }

        const name = (quiz.title || titleInput.value || "").trim();
        if (!name) {
            setPublishMessage("Donnez un titre au quiz avant de le publier.", "error");
            titleInput.focus();
            return;
        }

        publishBtn.disabled = true;
        publishBtn.textContent = "Publication...";
        setPublishMessage("", "success");

        try {
            const response = await fetch("/api/quiz/publish", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(buildPublishPayload()),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "Impossible de publier le quiz.");
            }

            setPublishMessage("Quiz publié dans la communauté.", "success");
        } catch (error) {
            setPublishMessage(error.message || "Impossible de contacter le serveur.", "error");
        } finally {
            publishBtn.disabled = false;
            publishBtn.textContent = "Publier dans la communauté";
        }
    }

    function importJsonFile(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                if (!data.title || typeof data.title !== "string") {
                    throw new Error("Le JSON doit contenir un champ \"title\" (chaîne de caractères).");
                }
                if (!Array.isArray(data.questions) || data.questions.length === 0) {
                    throw new Error("Le JSON doit contenir un tableau \"questions\" non vide.");
                }

                const importedQuestions = [];
                data.questions.forEach((q, qi) => {
                    if (!q.question || typeof q.question !== "string") {
                        throw new Error(`Question ${qi + 1} : champ "question" manquant ou invalide.`);
                    }
                    if (!Array.isArray(q.answers) || q.answers.length < 2) {
                        throw new Error(`Question ${qi + 1} : "answers" doit être un tableau d'au moins 2 éléments.`);
                    }
                    const answers = q.answers.map((a) => {
                        if (!a.text || typeof a.text !== "string") {
                            throw new Error(`Question ${qi + 1} : chaque réponse doit avoir un champ "text".`);
                        }
                        return a.text;
                    });
                    const correctAnswers = q.answers
                        .map((a, i) => (a.is_correct ? i : null))
                        .filter((i) => i !== null);
                    if (correctAnswers.length === 0) {
                        throw new Error(`Question ${qi + 1} : aucune bonne réponse marquée (is_correct: true).`);
                    }
                    importedQuestions.push({
                        id: QuizStore.uid(),
                        type: q.type === "truefalse" ? "truefalse" : "multiple",
                        question: q.question,
                        answers,
                        correctAnswers,
                    });
                });

                quiz.title = data.title;
                quiz.questions = importedQuestions;
                titleInput.value = quiz.title;
                if (data.tags && Array.isArray(data.tags)) {
                    tagsInput.value = data.tags.join(", ");
                }
                QuizStore.saveDraftQuiz(quiz);
                resetForm();
                renderTable();
                setImportMessage(`✓ ${importedQuestions.length} question(s) importée(s) depuis "${data.title}".`, "success");
            } catch (err) {
                setImportMessage("Erreur : " + err.message, "error");
            }
        };
        reader.onerror = () => setImportMessage("Impossible de lire le fichier.", "error");
        reader.readAsText(file);
    }

    titleInput.addEventListener("input", () => {
        quiz.title = titleInput.value;
        QuizStore.saveDraftQuiz(quiz);
    });

    addBtn.addEventListener("click", handleAddOrUpdate);
    cancelEditBtn.addEventListener("click", resetForm);

    questionTypeControl.addEventListener("click", (event) => {
        const button = event.target.closest(".segment");
        if (!button) return;
        setQuestionType(button.dataset.type);
    });

    answerCountControl.addEventListener("click", (event) => {
        const button = event.target.closest(".segment");
        if (!button) return;
        setAnswerCount(Number(button.dataset.count));
    });

    importJsonBtn.addEventListener("click", () => importJsonInput.click());
    importJsonInput.addEventListener("change", (e) => {
        importJsonFile(e.target.files[0]);
        e.target.value = "";
    });

    publishBtn.addEventListener("click", publishQuiz);

    startLink.addEventListener("click", (e) => {
        if (quiz.questions.length === 0) {
            e.preventDefault();
            formError.textContent = "Ajoutez au moins une question avant de commencer le quiz.";
        }
    });

    titleInput.value = quiz.title;
    buildAnswersGrid();
    updateCounter();
    renderTable();

    // ── Gestion des images ────────────────────────────────────────────────────
    const uploadImageBtn = document.getElementById("upload-image-btn");
    const uploadImageInput = document.getElementById("upload-image-input");
    const imagePreviewContainer = document.getElementById("image-preview-container");
    const imagePreview = document.getElementById("image-preview");
    const imagePreviewName = document.getElementById("image-preview-name");
    const confirmUploadBtn = document.getElementById("confirm-upload-btn");
    const imageMessage = document.getElementById("image-message");
    const imageQuestionRef = document.getElementById("image-question-ref");
    const uploadedImagesList = document.getElementById("uploaded-images-list");

    let selectedImageFile = null;

    function setImageMessage(message, type) {
        imageMessage.textContent = message;
        imageMessage.style.color = type === "success" ? "var(--mint)" : "var(--ember)";
    }

    function renderUploadedImages(images) {
        if (!images || images.length === 0) {
            uploadedImagesList.innerHTML = "<p class=\"muted\" style=\"font-size:13px;\">Aucune image uploadée pour ce quiz.</p>";
            return;
        }
        let html = "<strong style=\"font-size:13px; text-transform:uppercase; letter-spacing:0.03em; color:#777;\">Images enregistrées</strong><div style=\"display:flex; flex-wrap:wrap; gap:12px; margin-top:10px;\">";
        images.forEach((img) => {
            html += `
                <div style="border:1px solid #e0e0e0; border-radius:10px; overflow:hidden; width:140px; text-align:center; background:#fafafa;">
                    <img src="/api/images/${img.id}" alt="${img.original_name}" style="width:140px; height:90px; object-fit:cover; display:block;" />
                    <div style="padding:6px 4px;">
                        <p style="font-size:11px; color:#555; margin:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${img.original_name}">${img.original_name}</p>
                        ${img.quiz_question_ref ? `<p style="font-size:10px; color:#888; margin:2px 0 0 0;">${img.quiz_question_ref}</p>` : ""}
                        <button class="buzzer buzzer--danger" data-id="${img.id}" style="font-size:11px; padding:4px 8px; margin-top:6px; width:100%;">Supprimer</button>
                    </div>
                </div>`;
        });
        html += "</div>";
        uploadedImagesList.innerHTML = html;

        uploadedImagesList.querySelectorAll("[data-id]").forEach((btn) => {
            btn.addEventListener("click", async () => {
                const id = btn.dataset.id;
                if (!confirm("Supprimer cette image ?")) return;
                try {
                    const res = await fetch(`/api/images/${id}`, { method: "DELETE" });
                    if (!res.ok) throw new Error("Erreur lors de la suppression.");
                    setImageMessage("Image supprimée.", "success");
                    loadUploadedImages();
                } catch (err) {
                    setImageMessage(err.message, "error");
                }
            });
        });
    }

    async function loadUploadedImages() {
        try {
            const res = await fetch("/api/images");
            if (!res.ok) return;
            const images = await res.json();
            renderUploadedImages(images);
        } catch (_) {
            // Silencieux si le serveur n'est pas lancé
        }
    }

    uploadImageBtn.addEventListener("click", () => uploadImageInput.click());

    uploadImageInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
        if (!allowed.includes(file.type)) {
            setImageMessage("Type de fichier non autorisé. Utilisez JPG, PNG, GIF ou WEBP.", "error");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setImageMessage("L'image dépasse 5 Mo.", "error");
            return;
        }
        selectedImageFile = file;
        const url = URL.createObjectURL(file);
        imagePreview.src = url;
        imagePreviewName.textContent = `${file.name} (${Math.round(file.size / 1024)} Ko)`;
        imagePreviewContainer.style.display = "block";
        setImageMessage("", "success");
        e.target.value = "";
    });

    confirmUploadBtn.addEventListener("click", async () => {
        if (!selectedImageFile) return;
        confirmUploadBtn.disabled = true;
        confirmUploadBtn.textContent = "Envoi en cours...";
        setImageMessage("", "success");

        const formData = new FormData();
        formData.append("image", selectedImageFile);
        formData.append("quiz_question_ref", imageQuestionRef.value.trim());

        try {
            const res = await fetch("/api/images/upload", { method: "POST", body: formData });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erreur lors de l'upload.");
            setImageMessage(`✓ Image "${selectedImageFile.name}" enregistrée.`, "success");
            imagePreviewContainer.style.display = "none";
            imagePreview.src = "";
            imageQuestionRef.value = "";
            selectedImageFile = null;
            loadUploadedImages();
        } catch (err) {
            setImageMessage(err.message, "error");
        } finally {
            confirmUploadBtn.disabled = false;
            confirmUploadBtn.textContent = "✅ Envoyer l'image";
        }
    });

    loadUploadedImages();
})();
