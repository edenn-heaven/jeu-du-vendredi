document.addEventListener('DOMContentLoaded', async() => {
    const tagList = document.getElementById('tagList');
    const leaderboardList = document.getElementById('leaderboardList');
    const quizCards = document.getElementById('quizCards');
    let selectedTag = null;

    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        const user = JSON.parse(storedUser);
        const nav = document.querySelector('nav');
        if (nav) {
            const accountLink = nav.querySelector('a[href*="login"]');
            if (accountLink) accountLink.textContent = `${user.username}`;
        }
    }

    await Promise.all([loadTags(), loadLeaderboard(), loadQuizzes()]);

    async function loadTags() {
        try {
            const res = await fetch('/api/community/tags', { credentials: 'include' });
            const tags = await res.json();

            tagList.innerHTML = '';

            if (tags.length === 0) {
                tagList.textContent = 'Aucun tag disponible.';
                return;
            }

            tags.forEach(tag => tagList.appendChild(createTagButton(tag)));

        } catch (err) {
            tagList.textContent = 'Erreur de chargement des tags.';
            console.error(err);
        }
    }

    async function loadLeaderboard() {
        try {
            const res = await fetch('/api/community/leaderboard', { credentials: 'include' });
            const players = await res.json();

            leaderboardList.innerHTML = '';

            if (players.length === 0) {
                leaderboardList.innerHTML = '<li class="leaderboard-item">Aucun joueur pour l\'instant.</li>';
                return;
            }

            players.forEach(player => {
                const li = document.createElement('li');
                li.className = 'leaderboard-item';
                li.innerHTML = `
          <span class="leaderboard-rank">#${player.rank}</span>
          <span class="leaderboard-name">${escapeHtml(player.username)}</span>
          <span class="leaderboard-score">${player.total_score} pts</span>
          <span class="leaderboard-rate">${player.average_score}% moy.</span>
        `;
                leaderboardList.appendChild(li);
            });

        } catch (err) {
            leaderboardList.innerHTML = '<li>Erreur de chargement du classement.</li>';
            console.error(err);
        }
    }

    async function loadQuizzes() {
        quizCards.innerHTML = '<p>Chargement…</p>';
        try {
            const url = selectedTag ?
                `/api/community/quizzes?tag=${encodeURIComponent(selectedTag)}` :
                '/api/community/quizzes';

            const res = await fetch(url, { credentials: 'include' });
            const quizzes = await res.json();

            quizCards.innerHTML = '';

            if (quizzes.length === 0) {
                quizCards.textContent = selectedTag ?
                    `Aucun quiz pour le tag "${selectedTag}".` :
                    'Aucun quiz disponible. Soyez le premier à en publier un !';
                return;
            }

            quizzes.forEach(quiz => {
                const card = document.createElement('article');
                card.className = 'quiz-card';
                const tagsHtml = quiz.tags.length ?
                    quiz.tags.map(t => `<span class="tag-badge">${escapeHtml(t)}</span>`).join(' ') :
                    '<em>Sans tag</em>';

                card.innerHTML = `
          <div class="quiz-card__top">
            <h3>${escapeHtml(quiz.name)}</h3>
            <span class="quiz-card__date">${escapeHtml(quiz.creation_date)}</span>
          </div>
          <p class="quiz-author">Par ${escapeHtml(quiz.creator)}</p>
          <div class="quiz-stats">
            <span><strong>${quiz.average_score}%</strong><small>moyenne</small></span>
            <span><strong>${quiz.player_count}</strong><small>joueurs</small></span>
          </div>
          <p class="quiz-tags">${tagsHtml}</p>
        `;
                card.addEventListener('click', () => {
                    sessionStorage.setItem('selectedQuizId', quiz.id);
                    window.location.href = '../prequiz.html';
                });
                quizCards.appendChild(card);
            });

        } catch (err) {
            quizCards.textContent = 'Erreur de chargement des quiz.';
            console.error(err);
        }
    }

    function createTagButton(tag) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = tag;
        button.className = 'tag-item' + (selectedTag === tag ? ' selected' : '');
        button.addEventListener('click', () => {
            selectedTag = selectedTag === tag ? null : tag;
            tagList.querySelectorAll('.tag-item').forEach(btn => {
                btn.classList.toggle('selected', btn.textContent === selectedTag);
            });
            loadQuizzes();
        });
        return button;
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
});
